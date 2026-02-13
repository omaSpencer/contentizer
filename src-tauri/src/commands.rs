use crate::llm::{build_system_prompt, build_user_message, OpenAIClient, LLMClient};
use crate::presets;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "store.json";
const HISTORY_KEY: &str = "history";
const SETTINGS_KEY: &str = "settings";
const DAILY_QUOTA_KEY: &str = "daily_quota";
const MAX_HISTORY_LEN: usize = 20;
const DEFAULT_DAILY_QUOTA: u32 = 20;
const DEFAULT_INPUT_MAX_CHARS: usize = 4000;
const DEFAULT_OUTPUT_MAX_CHARS: usize = 1200;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    /// "keychain" = use stored key from Keychain (future); "env" = use env var (dev).
    pub provider_mode: String,
    /// OpenAI-compatible API key. When provider_mode is "keychain", this is read from Keychain at runtime; when "env", from env.
    #[serde(skip_serializing)]
    pub api_key: Option<String>,
    /// Optional base URL for OpenAI-compatible API (e.g. for local or proxy).
    pub api_base_url: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub timestamp: i64,
    pub category: String,
    pub style: String,
    pub original_preview: String,
    pub optimized_preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct DailyQuotaState {
    day_bucket: u64,
    used: u32,
}

fn get_store(app: &AppHandle) -> Result<std::sync::Arc<tauri_plugin_store::Store<tauri::Wry>>, String> {
    app.store(STORE_PATH)
        .map_err(|e| format!("Failed to load store: {}", e))
}

fn get_api_key(settings: &AppSettings) -> Result<String, String> {
    match settings.provider_mode.as_str() {
        "env" => std::env::var("CONTENTIZER_API_KEY").map_err(|_| {
            "API key not set. In dev, set CONTENTIZER_API_KEY in your environment.".to_string()
        }),
        "keychain" => {
            // When tauri-plugin-keychain is added: retrieve key here.
            Err("Keychain mode not configured. Use env mode and set CONTENTIZER_API_KEY for now.".to_string())
        }
        _ => Err("Unknown provider mode. Use 'env' or 'keychain'.".to_string()),
    }
}

fn get_model_from_env() -> Option<String> {
    std::env::var("CONTENTIZER_MODEL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn get_language_from_env() -> Option<String> {
    std::env::var("CONTENTIZER_LANGUAGE")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn read_prompt_file(path: &std::path::Path) -> Option<String> {
    std::fs::read_to_string(path)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn get_global_prompt_from_file() -> Option<String> {
    let current_dir = std::env::current_dir().ok()?;
    let candidates = [
        ".prompt",
        "global.prompt",
        "prompt.txt",
        "global_prompt.txt",
    ];
    for relative in candidates {
        let path = current_dir.join(relative);
        if let Some(content) = read_prompt_file(&path) {
            return Some(content);
        }
    }
    None
}

fn get_env_u32(name: &str, default: u32) -> u32 {
    std::env::var(name)
        .ok()
        .and_then(|value| value.trim().parse::<u32>().ok())
        .unwrap_or(default)
}

fn get_env_usize(name: &str, default: usize) -> usize {
    std::env::var(name)
        .ok()
        .and_then(|value| value.trim().parse::<usize>().ok())
        .unwrap_or(default)
}

fn current_day_bucket_utc() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        / 86_400
}

fn consume_daily_quota(app: &AppHandle) -> Result<(), String> {
    let limit = get_env_u32("CONTENTIZER_DAILY_QUOTA", DEFAULT_DAILY_QUOTA);
    if limit == 0 {
        return Ok(());
    }

    let store = get_store(app)?;
    let mut quota: DailyQuotaState = store
        .get(DAILY_QUOTA_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let today = current_day_bucket_utc();
    if quota.day_bucket != today {
        quota.day_bucket = today;
        quota.used = 0;
    }

    if quota.used >= limit {
        return Err(format!(
            "Daily quota reached ({} requests/day). Try again tomorrow.",
            limit
        ));
    }

    quota.used += 1;
    store.set(
        DAILY_QUOTA_KEY,
        serde_json::to_value(&quota).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn optimize_text(
    app: AppHandle,
    category: String,
    style: String,
    extra_instructions: String,
    original_text: String,
) -> Result<String, String> {
    let trimmed_input = original_text.trim();
    if trimmed_input.is_empty() {
        return Err("Enter some text to optimize.".to_string());
    }
    let input_limit = get_env_usize("CONTENTIZER_INPUT_MAX_CHARS", DEFAULT_INPUT_MAX_CHARS);
    if trimmed_input.chars().count() > input_limit {
        return Err(format!(
            "Input too long. Limit is {} characters.",
            input_limit
        ));
    }

    consume_daily_quota(&app)?;

    let store = get_store(&app)?;
    let settings_value = store.get(SETTINGS_KEY);
    let mut settings: AppSettings = serde_json::from_value(settings_value.unwrap_or(serde_json::Value::Null))
        .unwrap_or_default();
    if settings.provider_mode.is_empty() {
        settings.provider_mode = "env".into();
    }
    let api_key = get_api_key(&settings)?;
    let model = get_model_from_env();
    let language = get_language_from_env();
    let global_prompt = get_global_prompt_from_file();
    let output_max_chars =
        Some(get_env_usize("CONTENTIZER_OUTPUT_MAX_CHARS", DEFAULT_OUTPUT_MAX_CHARS));
    let client: Box<dyn LLMClient> = Box::new(OpenAIClient::new(
        api_key,
        settings.api_base_url.clone(),
        model,
    ));
    let request = crate::llm::OptimizeRequest {
        system_prompt: build_system_prompt(
            global_prompt.as_deref(),
            language.as_deref(),
            output_max_chars,
        ),
        user_message: build_user_message(&category, &style, &extra_instructions, trimmed_input),
    };
    let result = client.complete(request).await?;
    let text = result.text;

    // Persist to history
    let id = format!("{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis());
    let item = HistoryItem {
        id: id.clone(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64,
        category: category.clone(),
        style: style.clone(),
        original_preview: original_text.chars().take(80).collect::<String>()
            + if original_text.len() > 80 { "…" } else { "" },
        optimized_preview: text.chars().take(80).collect::<String>()
            + if text.len() > 80 { "…" } else { "" },
    };
    add_history_item_inner(&app, item).await?;

    Ok(text)
}

async fn add_history_item_inner(app: &AppHandle, item: HistoryItem) -> Result<(), String> {
    let store = get_store(app)?;
    let mut history: Vec<HistoryItem> = store
        .get(HISTORY_KEY)
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    history.insert(0, item);
    if history.len() > MAX_HISTORY_LEN {
        history.truncate(MAX_HISTORY_LEN);
    }
    store.set(HISTORY_KEY, serde_json::to_value(&history).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let store = get_store(&app)?;
    let value = store.get(SETTINGS_KEY);
    let mut settings: AppSettings = serde_json::from_value(value.unwrap_or(serde_json::Value::Null))
        .unwrap_or_default();
    if settings.provider_mode.is_empty() {
        settings.provider_mode = "env".into();
    }
    // Never send key to frontend
    settings.api_key = None;
    Ok(settings)
}

#[tauri::command]
pub async fn set_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let store = get_store(&app)?;
    // Don't persist api_key from frontend; key is env or keychain only
    let to_save = AppSettings {
        api_key: None,
        provider_mode: settings.provider_mode,
        api_base_url: settings.api_base_url,
        model: settings.model,
    };
    store.set(SETTINGS_KEY, serde_json::to_value(&to_save).map_err(|e| e.to_string())?);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_history(app: AppHandle) -> Result<Vec<HistoryItem>, String> {
    let store = get_store(&app)?;
    let value = store.get(HISTORY_KEY);
    let history: Vec<HistoryItem> = serde_json::from_value(value.unwrap_or(serde_json::Value::Array(vec![])))
        .unwrap_or_default();
    Ok(history)
}

#[tauri::command]
pub async fn add_history_item(app: AppHandle, item: HistoryItem) -> Result<(), String> {
    add_history_item_inner(&app, item).await
}

#[tauri::command]
pub async fn clear_history(app: AppHandle) -> Result<(), String> {
    let store = get_store(&app)?;
    store.set(HISTORY_KEY, serde_json::json!([]));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_presets() -> Result<presets::Presets, String> {
    Ok(presets::default_presets())
}
