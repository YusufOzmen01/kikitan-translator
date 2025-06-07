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
pub fn start_ovr_overlay(handle: tauri::AppHandle) {
    let resource_path = handle
        .path()
        .resource_dir()
        .expect("failed to resolve resource")
        .join("ovrpipe/OpenVROverlayPipe.exe");

    Command::new(resource_path.clone())
        .current_dir(resource_path.parent().expect("Failed to get parent directory"))
        .spawn()
        .unwrap();
}

#[tauri::command]
pub fn is_steamvr_running() -> bool {
    let output = Command::new("tasklist")
        .arg("/FI")
        .arg("IMAGENAME eq vrmonitor.exe")
        .output()
        .expect("Failed to execute command");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !stderr.is_empty() {
        eprintln!("Error checking SteamVR status: {}", stderr);
        return false;
    }

    stdout.contains("vrmonitor.exe")
}

#[tauri::command]
pub fn is_ovr_overlay_running() -> bool {
    let output = Command::new("tasklist")
        .arg("/FI")
        .arg("IMAGENAME eq OpenVROverlayPipe.exe")
        .output()
        .expect("Failed to execute command");

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !stderr.is_empty() {
        eprintln!("Error checking OVR Overlay status: {}", stderr);
        return false;
    }

    stdout.contains("OpenVROverlayPipe.exe")
}

// TODO: Desktop Overlay
