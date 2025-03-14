// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod filesys;
mod process_manager;
mod vrc_commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
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
            process_manager::kill_whisper_helper,
            filesys::download_file,
            filesys::extract_zip
        ])
        .on_window_event(|_, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                println!("Killing whisper process...");
                process_manager::kill_whisper_helper();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
