import { invoke } from "@tauri-apps/api/core";

export function send_user_recognition(data: string) {
    invoke("send_recognized_microphone", { recognized: data })
}

export function send_user_translation(data: string) {
    invoke("send_translated_microphone", { translated: data })
}

export function send_desktop(recognized: string, translated: string) {
    invoke("send_desktop", { recognized, translated })
}