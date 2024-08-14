// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rosc::encoder;
use rosc::{OscMessage, OscPacket, OscType};
use tauri::Manager;
use std::net::{Ipv4Addr, UdpSocket};
use std::os::windows::process::CommandExt;
use std::process::Command;

use webview2_com::Microsoft::Web::WebView2::Win32::{
    ICoreWebView2Profile4, ICoreWebView2_13, COREWEBVIEW2_PERMISSION_KIND_MICROPHONE,
    COREWEBVIEW2_PERMISSION_STATE_ALLOW,
};

use windows::core::{Interface, PCWSTR};

fn main() {
    Command::new("taskkill").arg("/F").arg("/IM").arg("Kikitan OVR.exe").creation_flags(0x08000000_u32).spawn().unwrap();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_typing, send_message, start_ovr, kill_ovr])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn send_typing(address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/chatbox/typing".to_string(),
        args: vec![OscType::Bool(true)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
fn send_message(msg: String, address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/chatbox/input".to_string(),
        args: vec![OscType::String(msg), OscType::Bool(true)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
fn start_ovr(handle: tauri::AppHandle) {
    let resource_path = handle.path_resolver()
      .resolve_resource("ovr/Kikitan OVR.exe")
      .expect("failed to resolve resource");

    Command::new(resource_path).creation_flags(0x08000000_u32).spawn().unwrap();
}

#[tauri::command]
fn kill_ovr() {
    Command::new("taskkill").arg("/F").arg("/IM").arg("Kikitan OVR.exe").creation_flags(0x08000000_u32).spawn().unwrap();
}

// #[tauri::command]
// fn enable_microphone(origin: &str, app: tauri::AppHandle) {
//     let webview = app.get_window("main").unwrap();
//     let mut origin = origin.to_string();
//     origin.push('\0');
//     let origin = origin.encode_utf16().collect::<Vec<u16>>();
//     webview
//         .with_webview(move |webview| unsafe {
//             let core = webview.controller().CoreWebView2().unwrap();
//             let core = Interface::cast::<ICoreWebView2_13>(&core).unwrap();
//             let profile = core.Profile().unwrap();
//             let profile = Interface::cast::<ICoreWebView2Profile4>(&profile).unwrap();
//             let origin = PCWSTR::from_raw(origin.as_ptr());
//             profile
//                 .SetPermissionState(
//                     COREWEBVIEW2_PERMISSION_KIND_MICROPHONE,
//                     origin,
//                     COREWEBVIEW2_PERMISSION_STATE_ALLOW,
//                     None,
//                 )
//                 .unwrap();
//         })
//         .unwrap();
// }