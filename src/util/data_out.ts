import { invoke } from "@tauri-apps/api/core";

export function send_user_recognition(data: string, isFinal: boolean) {
    invoke("send_recognized_microphone", { recognized: data, isFinal: isFinal })
}

export function send_user_translation(data: string) {
    invoke("send_translated_microphone", { translated: data })
}

export function send_desktop_recognition(data: string, isFinal: boolean) {
    invoke("send_recognized_desktop", { recognized: data, isFinal: isFinal })
}

export function send_desktop_translation(data: string) {
    invoke("send_translated_desktop", { translated: data })
}
