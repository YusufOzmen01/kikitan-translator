// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod vrc_commands;
mod process_manager;
mod filesys;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            vrc_commands::send_typing,
            vrc_commands::send_message,
            vrc_commands::start_vrc_listener,
            process_manager::show_audio_settings,
            process_manager::start_whisper_helper,
            filesys::download_file,
            filesys::extract_zip
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}