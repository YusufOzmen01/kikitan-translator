// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use arboard::Clipboard;
use rosc::encoder;
use rosc::{OscMessage, OscPacket, OscType};
use std::net::{Ipv4Addr, UdpSocket};
use std::os::windows::process::CommandExt;
use std::process::Command;
use enigo::Enigo;
use enigo::KeyboardControllable;

fn main() {
    Command::new("taskkill").arg("/F").arg("/IM").arg("Kikitan OVR.exe").creation_flags(0x08000000_u32).spawn().unwrap();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![send_typing, send_message, start_ovr, kill_ovr, send_ovr])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn send_typing() {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/chatbox/typing".to_string(),
        args: vec![OscType::Bool(true)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:9000").unwrap();
}

#[tauri::command]
fn send_message(msg: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/chatbox/input".to_string(),
        args: vec![OscType::String(msg), OscType::Bool(true)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:9000").unwrap();
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

#[tauri::command]
fn send_ovr(data: String) {
    let mut clipboard = Clipboard::new().unwrap();
    let prev_text = clipboard.get_text().unwrap();

    clipboard.set_text(&data).unwrap();

    let mut enigo = Enigo::new();
    enigo.key_sequence("{+CTRL}V{-CTRL}");

    clipboard.set_text(&prev_text).unwrap();
}
