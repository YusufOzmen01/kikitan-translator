use std::os::windows::process::CommandExt;
use std::process::Command;

use tauri::Manager;

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

#[tauri::command]
pub fn start_desktop_overlay(handle: tauri::AppHandle) {
    kill_desktop_overlay();

    let resource_path = handle
        .path()
        .resource_dir()
        .expect("failed to resolve resource")
        .join("desktopoverlay/Desktop Image Overlay.exe");

    Command::new(resource_path.clone())
        .current_dir(resource_path.parent().expect("Failed to get parent directory"))
        .creation_flags(0x08000000_u32)
        .spawn()
        .unwrap();
}

#[tauri::command]
pub fn kill_desktop_overlay() {
    Command::new("taskkill")
        .arg("/F")
        .arg("/IM")
        .arg("Desktop Image Overlay.exe")
        .creation_flags(0x08000000_u32)
        .output()
        .expect("Failed to execute command");
}

#[tauri::command]
pub fn is_desktop_overlay_running() -> bool {
    let output = Command::new("tasklist")
        .arg("/FI")
        .arg("IMAGENAME eq Desktop Image Overlay.exe")
        .creation_flags(0x08000000_u32)
        .output()
        .expect("Failed to execute command");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !stderr.is_empty() {
        eprintln!("Error checking OVR Overlay status: {}", stderr);
        return false;
    }

    stdout.contains("Desktop Image Overlay.exe")
}

#[tauri::command]
pub fn show_gemini_api_page() {
    let output = Command::new("explorer")
        .arg("https://aistudio.google.com/apikey")
        .creation_flags(0x08000000_u32)
        .output()
        .expect("Failed to execute command");
}