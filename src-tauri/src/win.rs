use std::os::windows::process::CommandExt;
use std::process::Command;

#[tauri::command]
pub fn show_windows_audio_settings() {
    Command::new("powershell")
        .arg("Start")
        .arg("ms-settings:sound")
        .creation_flags(0x08000000_u32)
        .spawn()
        .unwrap()
        .wait()
        .unwrap();
}

#[tauri::command]
pub fn start_whisper_helper(helper_path: String) {
    Command::new("taskkill")
        .arg("/f")
        .arg("/im")
        .arg("whisperkikitan.exe")
        .creation_flags(0x08000000_u32)
        .spawn()
        .unwrap()
        .wait()
        .unwrap();

    Command::new(helper_path)
        .creation_flags(0x08000000_u32)
        .spawn();
}

