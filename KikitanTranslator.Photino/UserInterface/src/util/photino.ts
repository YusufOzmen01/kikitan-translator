import {config} from "./constants.ts";

const pendingRequests = new Map();
var recognitionCallback: ((r: string, t: string, f: boolean) => void) | null = null;
var statusCallback: ((status: number) => void) | null = null;

export function init() {
    // @ts-ignore
    if (window.external.receiveMessage == undefined) {
        window.location.reload()
        
        return;
    }
    
    // @ts-ignore
    window.external.receiveMessage(message => {
        const response = JSON.parse(message);
        var data = JSON.parse(response.data);

        if (response.method == "recognition") {
            recognitionCallback?.(data.transcription, data.translation, data.final);

            return;
        } else if (response.method == "status") {
            statusCallback?.(data.status);
            
            return;
        }

        const resolve = pendingRequests.get(response.method);
        resolve(JSON.parse(response.data));
        pendingRequests.delete(response.method);
    });
}

export async function getMicrophones(): Promise<{name: string, default: boolean}[]> {
    return new Promise((resolve, _) => {
        pendingRequests.set("get_microphones", resolve);
        
        // @ts-ignore
        window.external.sendMessage(JSON.stringify({
            method: "get_microphones",
            data: ""
        }));
    });
}

export function setConfig(field: string, value: any) {
    // @ts-ignore
    window.external.sendMessage(JSON.stringify({
        method: "update_config",
        data: JSON.stringify({ field, value })
    }));
}

export async function getConfig(): Promise<config> {
    return new Promise((resolve, _) => {
        pendingRequests.set("get_config", resolve);

        // @ts-ignore
        window.external.sendMessage(JSON.stringify({
            method: "get_config",
            data: ""
        }));
    });
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

export function registerRecognitionCallback(callback: (r: string, t: string, f: boolean) => void) {
    recognitionCallback = callback;
}

export function registerStatusCallback(callback: (status: number) => void) {
    statusCallback = callback;
}