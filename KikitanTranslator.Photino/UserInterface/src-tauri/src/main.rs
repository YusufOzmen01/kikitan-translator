// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_log::{Target, TargetKind,};
use chrono::Local;

mod audio;
mod data_out;
mod filesys;
mod process_manager;
mod vrc_commands;

fn main() {
    let log_filename = format!("{}", Local::now().format("%Y-%m-%d %H:%M:%S"));

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(Target::new(TargetKind::LogDir {
                    file_name: Some(log_filename.replace(":", "-")),
                }))
                .format(|out, message, record| {
                    let now = Local::now().format("%Y-%m-%d %H:%M:%S");
                    out.finish(format_args!(
                        "[{}] [{}] {}",
                        now,
                        record.level(),
                        message
                    ))
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            vrc_commands::send_typing,
            vrc_commands::send_message,
            vrc_commands::send_disable_mic,
            vrc_commands::send_disable_desktop,
            vrc_commands::send_disable_chatbox,
            vrc_commands::send_disable_overlay,
            vrc_commands::start_vrc_listener,
            process_manager::show_audio_settings,
            process_manager::open_url,
            process_manager::start_desktop_overlay,
            process_manager::kill_desktop_overlay,
            process_manager::is_desktop_overlay_running,
            filesys::download_file,
            filesys::extract_zip,
            audio::start_desktop_audio_capture,
            audio::stop_desktop_audio_capture,
            audio::get_microphone_list,
            audio::start_microphone_audio_capture,
            audio::stop_microphone_audio_capture,
            data_out::send_recognized_microphone,
            data_out::send_translated_microphone,
            data_out::send_recognized_desktop,
            data_out::send_translated_desktop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
