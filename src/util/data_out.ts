import { invoke } from "@tauri-apps/api/core";

export function send_user_recognition(data: string, is_final: boolean) {
    invoke("send_recognized_microphone", { recognized: data, is_final })
}

export function send_user_translation(data: string) {
    invoke("send_translated_microphone", { translated: data })
}

export function send_desktop_recognition(data: string, is_final: boolean) {
    invoke("send_recognized_desktop", { recognized: data, is_final })
}

export function send_desktop_translation(data: string) {
    invoke("send_translated_desktop", { translated: data })
}
