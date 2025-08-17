use rosc::encoder;
use rosc::{OscMessage, OscPacket, OscType};
use std::net::{Ipv4Addr, UdpSocket};

#[tauri::command]
pub fn send_recognized_microphone(recognized: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/detection/microphone".to_string(),
        args: vec![OscType::String(recognized)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:7272").unwrap();
}

#[tauri::command]
pub fn send_translated_microphone(translated: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/translation/microphone".to_string(),
        args: vec![OscType::String(translated)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:7272").unwrap();
}

#[tauri::command]
pub fn send_desktop(recognized: String, translated: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/desktop".to_string(),
        args: vec![OscType::String(recognized), OscType::String(translated)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:7272").unwrap();
}