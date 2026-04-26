import {app_state} from "./constants.ts";

const pendingRequests = new Map();
var recognitionCallback: ((r: string, t: string, f: boolean) => void) | null = null;
var stateCallback: ((state: app_state) => void) | null = null;
var microphoneChangedCallback: (() => void) | null = null;

export function init() {
    // @ts-ignore
    if (window.external.receiveMessage == undefined) {
        window.location.reload()
        
        return;
    }
    
    // @ts-ignore
    window.external.receiveMessage(message => {
        const response = JSON.parse(message);
        if (response.method == "mic_changed") {
            microphoneChangedCallback?.();

            return;
        }
        
        const data = JSON.parse(response.data);
        if (response.method == "recognition") {
            recognitionCallback?.(data.transcription, data.translation, data.final);

            return;
        } else if (response.method == "state") {
            stateCallback?.(data);
            
            return;
        } 

        const resolve = pendingRequests.get(response.method);
        resolve(JSON.parse(response.data));
        pendingRequests.delete(response.method);
    });
}

export function setConfig(field: string, value: any) {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "update_config",
        data: JSON.stringify({ field, value })
    }));
}

export function manualTranslate(data: string) {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "manual_translate",
        data
    }));
}

export function controlKikitan(status: boolean) {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "control",
        data: status ? "ON" : "OFF"
    }));
}

export function openURL(url: string) {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "open_url",
        data: url
    }));
}

export function sendAppState() {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "send_app_state",
        data: ""
    }));
}

export function sendQuit() {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "quit",
        data: ""
    }));
}

export function registerRecognitionCallback(callback: (r: string, t: string, f: boolean) => void) {
    recognitionCallback = callback;
}

export function registerStateCallback(callback: (state: app_state) => void) {
    stateCallback = callback;
}

export function registerMicrophoneChangedCallback(callback: () => void) {
    microphoneChangedCallback = callback;
}