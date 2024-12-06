// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rosc::encoder;
use rosc::{OscMessage, OscPacket, OscType};
use std::net::{Ipv4Addr, UdpSocket};
use std::os::windows::process::CommandExt;
use std::process::Command;
use std::thread;
use tauri::{AppHandle, Emitter};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            send_typing,
            send_message,
            show_windows_audio_settings,
            start_vrc_listener
        ])
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
fn show_windows_audio_settings() {
    Command::new("powershell")
        .arg("Start")
        .arg("ms-settings:sound")
        .creation_flags(0x08000000_u32)
        .spawn()
        .unwrap();
}

#[tauri::command]
fn start_vrc_listener(app: AppHandle) {
    thread::spawn(move || {
        let sock = UdpSocket::bind("localhost:9001").unwrap();
        let mut buf = [0u8; rosc::decoder::MTU];

        loop {
            match sock.recv_from(&mut buf) {
                Ok((size, _)) => {
                    let (_, packet) = rosc::decoder::decode_udp(&buf[..size]).unwrap();

                    match packet {
                        OscPacket::Message(msg) => {
                            if msg.addr.as_str() == "/avatar/parameters/MuteSelf" {
                                if let Some(mute) = msg.args.first().unwrap().clone().bool() {
                                    app.emit("vrchat-mute", mute).unwrap();
                                }
                            }
                        }
                        
                        OscPacket::Bundle(bundle) => {
                            println!("OSC Bundle: {:?}", bundle);
                        }
                    }
                }
                Err(e) => {
                    println!("Error receiving from socket: {}", e);
                    break;
                }
            }
        }
    });
}