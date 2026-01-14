use rosc::encoder;
use rosc::{OscMessage, OscPacket, OscType};
use std::net::{Ipv4Addr, UdpSocket};
use std::thread;
use tauri::{AppHandle, Emitter};

static mut LISTENER_STARTED: bool = false;

#[tauri::command]
pub fn send_typing(address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/chatbox/typing".to_string(),
        args: vec![OscType::Bool(true)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
pub fn send_message(msg: String, address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/chatbox/input".to_string(),
        args: vec![OscType::String(msg), OscType::Bool(true)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
pub fn send_disable_mic(data: bool, address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/avatar/parameters/DisableKikitanMic".to_string(),
        args: vec![OscType::Bool(data)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
pub fn send_disable_desktop(data: bool, address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/avatar/parameters/DisableKikitanDesktop".to_string(),
        args: vec![OscType::Bool(data)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
pub fn send_disable_chatbox(data: bool, address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/avatar/parameters/DisableKikitanChatbox".to_string(),
        args: vec![OscType::Bool(data)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
pub fn send_disable_overlay(data: bool, address: String, port: String) {
    let sock = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
    let msg_buf = encoder::encode(&OscPacket::Message(OscMessage {
        addr: "/avatar/parameters/DisableKikitanOverlay".to_string(),
        args: vec![OscType::Bool(data)],
    }))
    .unwrap();

    sock.send_to(&msg_buf, address + ":" + &port).unwrap();
}

#[tauri::command]
pub fn start_vrc_listener(app: AppHandle) {
    unsafe {
        if LISTENER_STARTED {
            return;
        }

        LISTENER_STARTED = true;
    }

    thread::spawn(move || {
        let sock = UdpSocket::bind("127.0.0.1:9001");
        match sock {
            Ok(sock) => {
                println!("Starting OSC listener...");
                let mut buf = [0u8; rosc::decoder::MTU];

                loop {
                    match sock.recv_from(&mut buf) {
                        Ok((size, _)) => {
                            let (_, packet) = rosc::decoder::decode_udp(&buf[..size]).unwrap();

                            match packet {
                                OscPacket::Message(msg) => {
                                    // println!("{:?}", msg);
                                    match msg.addr.as_str() {
                                    "/avatar/parameters/MuteSelf" => {
                                    if let Some(mute) = msg.args.first().unwrap().clone().bool()
                                        {
                                            app.emit("vrchat-mute", mute).unwrap();
                                        }
                                    }

                                    "/avatar/parameters/DisableKikitanMic" => {
                                    if let Some(disable) = msg.args.first().unwrap().clone().bool()
                                        {
                                            app.emit("disable-kikitan-mic", disable).unwrap();
                                        }
                                    }

                                    "/avatar/parameters/DisableKikitanDesktop" => {
                                    if let Some(disable) = msg.args.first().unwrap().clone().bool()
                                        {
                                            app.emit("disable-kikitan-desktop", disable).unwrap();
                                        }
                                    }

                                    "/avatar/parameters/DisableKikitanChatbox" => {
                                    if let Some(disable) = msg.args.first().unwrap().clone().bool()
                                        {
                                            app.emit("disable-kikitan-chatbox", disable).unwrap();
                                        }
                                    }

                                    "/avatar/parameters/DisableKikitanOverlay" => {
                                    if let Some(disable) = msg.args.first().unwrap().clone().bool()
                                        {
                                            app.emit("disable-kikitan-overlay", disable).unwrap();
                                        }
                                    }

                                    _ => {}
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
            }

            Err(e) => {
                println!("Error binding to 9001: {:?}", e);
            }
        }
    });
}
