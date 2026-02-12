//! LLM client abstraction. Implement this trait to swap providers (OpenAI, local, etc.).

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizeRequest {
    pub system_prompt: String,
    pub user_message: String,
}

/// Result of a single completion (non-streaming).
#[derive(Debug)]
pub struct CompletionResult {
    pub text: String,
}

/// LLM client interface: implement for OpenAI-compatible or other providers.
#[async_trait]
pub trait LLMClient: Send + Sync {
    async fn complete(&self, request: OptimizeRequest) -> Result<CompletionResult, String>;
}

/// OpenAI-compatible chat completions client.
pub struct OpenAIClient {
    api_key: String,
    base_url: String,
    model: String,
}

impl OpenAIClient {
    pub fn new(api_key: String, base_url: Option<String>, model: Option<String>) -> Self {
        Self {
            api_key,
            base_url: base_url.unwrap_or_else(|| "https://api.openai.com/v1".into()),
            model: model.unwrap_or_else(|| "gpt-4o-mini".into()),
        }
    }
}

#[async_trait]
impl LLMClient for OpenAIClient {
    async fn complete(&self, request: OptimizeRequest) -> Result<CompletionResult, String> {
        #[derive(serde::Serialize)]
        struct ChatMessage {
            role: &'static str,
            content: String,
        }
        #[derive(serde::Serialize)]
        struct RequestBody {
            model: String,
            messages: Vec<ChatMessage>,
            max_tokens: u32,
        }
        #[derive(serde::Deserialize)]
        struct Choice {
            message: ChoiceMessage,
        }
        #[derive(serde::Deserialize)]
        struct ChoiceMessage {
            content: String,
        }
        #[derive(serde::Deserialize)]
        struct ResponseBody {
            choices: Vec<Choice>,
        }

        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));
        let body = RequestBody {
            model: self.model.clone(),
            messages: vec![
                ChatMessage {
                    role: "system",
                    content: request.system_prompt,
                },
                ChatMessage {
                    role: "user",
                    content: request.user_message,
                },
            ],
            max_tokens: 4096,
        };

        let client = reqwest::Client::new();
        let res = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            return Err(format!("API error {}: {}", status, body));
        }

        let parsed: ResponseBody = res.json().await.map_err(|e| e.to_string())?;
        let text = parsed
            .choices
            .into_iter()
            .next()
            .map(|c| c.message.content)
            .unwrap_or_default()
            .trim()
            .to_string();

        Ok(CompletionResult { text })
    }
}

/// Build the system prompt for the copy editor.
pub fn build_system_prompt() -> String {
    "You are a professional copy editor. Your task is to improve the user's text according to the chosen category and style. \
     Return ONLY the improved text—no explanations, no preamble, no markdown formatting unless the original had it.".into()
}

/// Build the user message from category, style, extra instructions, and original text.
pub fn build_user_message(category: &str, style: &str, extra_instructions: &str, original_text: &str) -> String {
    let mut parts = vec![
        format!("Category: {}", category),
        format!("Style: {}", style),
    ];
    if !extra_instructions.trim().is_empty() {
        parts.push(format!("Extra instructions: {}", extra_instructions.trim()));
    }
    parts.push("---".into());
    parts.push("Original text to optimize:".into());
    parts.push(original_text.trim().to_string());
    parts.join("\n\n")
}
