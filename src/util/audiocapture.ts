import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export async function setupMicrophoneCapture(
  callback: (chunk: Float32Array, sampleRate: number) => void,
  mic: string
) {
  const unlisten = await listen("mic-audio-chunk", (event) => {
    const { chunk, sampleRate } = event.payload as { chunk: string; sampleRate: number };

    const raw = atob(chunk);
    const buf = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) {
      view[i] = raw.charCodeAt(i);
    }
    const float32 = new Float32Array(buf);

    callback(float32, sampleRate);
  });

  await invoke("start_microphone_audio_capture", { mic });

  return async () => {
    await invoke("stop_microphone_audio_capture");
    
    unlisten();
  };
}

export async function setupSystemAudioCapture(
  callback: (chunk: Float32Array, sampleRate: number) => void
) {
  const unlisten = await listen("audio-chunk", (event) => {
    const { chunk, sampleRate } = event.payload as { chunk: string; sampleRate: number };

    const raw = atob(chunk);
    const buf = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) {
      view[i] = raw.charCodeAt(i);
    }
    const float32 = new Float32Array(buf);

    callback(float32, sampleRate);
  });

  await invoke("start_desktop_audio_capture");

  return async () => {
    await invoke("stop_desktop_audio_capture");

    unlisten();
  };
}