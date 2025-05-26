/* eslint-disable @typescript-eslint/no-explicit-any */
import { langSource, langTo } from "./constants"

import {
    info,
    debug
} from '@tauri-apps/plugin-log';

export const speed_presets = {
    slow: 60,
    medium: 30,
    fast: 15
}

export type Config = {
    source_language: string,
    target_language: string,
    light_mode: boolean,
    mode: number,
    language_settings: {
        japanese_omit_questionmark: boolean,
    },
    vrchat_settings: {
        translation_first: boolean,
        only_translation: boolean,
        disable_kikitan_when_muted: boolean,
        send_typing_status_while_talking: boolean,
        chatbox_update_speed: number,
        osc_address: string,
        osc_port: number
    },
    gemini_settings: {
        gemini_enabled: boolean,
        gemini_enable_transcription: boolean,
        desktop_capture: boolean,
        gemini_api_key: string
    }
}

export const DEFAULT_CONFIG: Config = {
    source_language: "en-US",
    target_language: "ja",
    mode: 0,
    light_mode: false,
    language_settings: {
        japanese_omit_questionmark: true
    },
    vrchat_settings: {
        translation_first: true,
        only_translation: false,
        disable_kikitan_when_muted: false,
        send_typing_status_while_talking: true,
        chatbox_update_speed: speed_presets.slow,
        osc_address: "127.0.0.1",
        osc_port: 9000
    },
    gemini_settings: {
        gemini_enabled: false,
        gemini_enable_transcription: false,
        desktop_capture: false,
        gemini_api_key: ""
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
    info("[CONFIG] Loading config...")
    if (typeof window === "undefined") return DEFAULT_CONFIG

    const val = window.localStorage.getItem("config")
    if (val == null) return DEFAULT_CONFIG

    const config = validate_config(JSON.parse(val))
    update_config(config)

    info("[CONFIG] Loaded config!")

    return config
}

export function update_config(config: Config) {
    info(`[CONFIG] Updating config to ${JSON.stringify({
        ...config,
        gemini_settings: {
            ...config.gemini_settings,
            gemini_api_key: config.gemini_settings.gemini_api_key.trim().length > 0 ? "********" : ""
        }
    }, null, 2)}`)

    localStorage.setItem("config", JSON.stringify(config))
}