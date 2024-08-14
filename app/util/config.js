export const speed_presets = {
    slow: 60,
    medium: 30,
    fast: 15
}

export const DEFAULT_CONFIG = {
    source_language: 0,
    target_language: 6,
    translator: 0,
    mode: 0,
    language_settings: {
        japanese_omit_questionmark: true
    },
    vrchat_settings: {
        translation_first: true,
        send_typing_while_talking: false,
        chatbox_update_speed: speed_presets.slow,
        osc_address: "127.0.0.1",
        osc_port: 9000
    }
}

export function load_config() {
    console.log("loading")
    if (typeof window === "undefined") return DEFAULT_CONFIG

    let val = window.localStorage.getItem("config")
    if (val == null) return DEFAULT_CONFIG

    return JSON.parse(val)
}

export function update_config(config) {
    localStorage.setItem("config", JSON.stringify(config))
}