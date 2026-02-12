mod commands;
mod llm;
mod presets;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::optimize_text,
            commands::get_settings,
            commands::set_settings,
            commands::get_history,
            commands::add_history_item,
            commands::clear_history,
            commands::get_presets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
