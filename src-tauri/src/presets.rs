use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Presets {
    pub categories: Vec<String>,
    pub styles: Vec<String>,
}

/// Default presets bundled with the app. Can be overridden by loading from a file.
pub fn default_presets() -> Presets {
    Presets {
        categories: vec![
            "Email".into(),
            "LinkedIn".into(),
            "SEO".into(),
            "Support".into(),
            "Product description".into(),
            "Resume/CV".into(),
        ],
        styles: vec![
            "Formal".into(),
            "Friendly".into(),
            "Concise".into(),
            "Persuasive".into(),
            "Technical".into(),
            "Casual".into(),
        ],
    }
}
