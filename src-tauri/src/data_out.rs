use rosc::encoder;
use rosc::{OscMessage, OscPacket, OscType};
use std::net::{Ipv4Addr, UdpSocket};

#[tauri::command]
pub fn send_recognized_microphone(recognized: String, is_final: bool) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/detection/microphone".to_string(),
        args: vec![OscType::String(recognized), OscType::Bool(is_final)],
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
pub fn send_recognized_desktop(recognized: String, is_final: bool) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/detection/desktop".to_string(),
        args: vec![OscType::String(recognized), OscType::Bool(is_final)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:7272").unwrap();
}

#[tauri::command]
pub fn send_translated_desktop(translation: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/translation/desktop".to_string(),
        args: vec![OscType::String(translation)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, "127.0.0.1:7272").unwrap();
}
