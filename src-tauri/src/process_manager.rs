use std::os::windows::process::CommandExt;
use std::process::Command;

#[tauri::command]
pub fn show_audio_settings() {
    Command::new("powershell")
        .arg("Start")
        .arg("ms-settings:sound")
        .creation_flags(0x08000000_u32)
        .spawn()
        .unwrap()
        .wait()
        .unwrap();
}