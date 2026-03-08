/* eslint-disable @typescript-eslint/no-explicit-any */
import { Lang, langSource, langTo } from "./constants"

import {
    debug
} from '@tauri-apps/plugin-log';

export const speed_presets = {
    slow: 60,
    medium: 30,
    fast: 15
}

export type MessageHistoryItem = {
    source: string;
    translation: string;
    timestamp: number;
}

export type Config = {
    source_language: string,
    target_language: string,
    light_mode: boolean,
    mode: number,
    microphone: string,
    vrchat_settings: {
        enable_chatbox: boolean,
        translation_first: boolean,
        only_translation: boolean,
        disable_kikitan_when_muted: boolean,
        send_typing_status_while_talking: boolean,
        chatbox_update_speed: number,
        osc_address: string,
        osc_port: number
    },
    message_history: {
        enabled: boolean,
        max_items: number,
        items: MessageHistoryItem[]
    },
    data_out: {
        enable_user_data: boolean,
        enable_desktop_data: boolean
    },
    translator_settings: {
        translation_service: number, // Google Translate = 0, Microsoft Bing = 1, Groq = 2
        recognition_service: number, // Microsoft Bing = 0, Groq = 1, WebSpeech API = 2

        desktop_translation: boolean
    },
    groq: {
        api_key: string,
        used_tokens: number,
        last_used_day: number
    }
}

export const DEFAULT_CONFIG: Config = {
    source_language: "en",
    target_language: "ja",
    mode: 0,
    microphone: "default",
    light_mode: false,
    vrchat_settings: {
        enable_chatbox: true,
        translation_first: true,
        only_translation: false,
        disable_kikitan_when_muted: false,
        send_typing_status_while_talking: true,
        chatbox_update_speed: speed_presets.slow,
        osc_address: "127.0.0.1",
        osc_port: 9000
    },
    message_history: {
        enabled: true,
        max_items: 50,
        items: []
    },
    data_out: {
        enable_user_data: false,
        enable_desktop_data: false
    },
    translator_settings: {
        translation_service: 0,
        recognition_service: 0,

        desktop_translation: false
    },
    groq: {
        api_key: "",
        used_tokens: 0,
        last_used_day: 0
    }
}

export function validate_config(config: Config): Config {
    // Validation 1: Validate the structure of the config
    // Oh yes, we love em types
    const cfg = config as any
    const default_config = DEFAULT_CONFIG
    for (const key in default_config) {
        if (cfg[key] == null) {
            cfg[key as keyof Config] = default_config[key as keyof Config]
        } else {
            const nestedConfig = default_config[key as keyof Config];
            if (typeof nestedConfig === 'object' && nestedConfig !== null) {
                for (const key2 in nestedConfig) {
                    if (cfg[key][key2] == null) {
                        cfg[key][key2] = (nestedConfig as any)[key2];
                        debug(`[CONFIG] Added missing key ${key2} to ${key}`)
                    }
                }
            }
        }
    }

    // Validation 2: Update source and target language
    if (typeof cfg.source_language === "number") {
        cfg.source_language = langSource[cfg.source_language].code

        debug(`[CONFIG] Updated source language to ${cfg.source_language}`)
    }

    if (typeof cfg.target_language === "number") {
        cfg.target_language = langTo[cfg.target_language < 6 ? 0 : cfg.target_language-5].code

        debug(`[CONFIG] Updated target language to ${cfg.target_language}`)
    }

    return cfg
}

export function load_config(): Config {
    if (typeof window === "undefined") return DEFAULT_CONFIG

    const val = window.localStorage.getItem("config")
    if (val == null) return DEFAULT_CONFIG

    const config = validate_config(JSON.parse(val))
    update_config(config)

    return config
}

export function update_config(config: Config) {
    localStorage.setItem("config", JSON.stringify(config))
}

export function get_language(): Lang {
    const language = localStorage.getItem("lang") as Lang | null

    return language ?? "en"
}