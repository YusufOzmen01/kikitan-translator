import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export async function setupMicrophoneCapture(callback: (chunk: Float32Array<ArrayBufferLike>, sampleRate: number) => void) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false } });

    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaStreamSource(stream);

    const sampleRate = audioContext.sampleRate;
    const bufferSize = 1024;

    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    processor.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      callback(inputData, sampleRate);
    };

    sourceNode.connect(processor);
    processor.connect(audioContext.destination);

    return () => {
      processor.disconnect();
      sourceNode.disconnect();
      stream.getTracks().forEach(track => track.stop());
    };
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw error;
  }
}

export async function setupDesktopCapture(callback: (chunk: Float32Array<ArrayBufferLike>, sampleRate: number) => void) {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("Desktop capture is not supported in this browser.");
    }

    console.log("Requesting desktop audio capture...");

    const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true });
    if (!stream) {
      throw new Error("No audio stream available from desktop capture.");
    }

    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaStreamSource(stream);

    const sampleRate = audioContext.sampleRate;
    const bufferSize = 1024;

    const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);

    processor.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      callback(inputData, sampleRate);
    };

    sourceNode.connect(processor);
    processor.connect(audioContext.destination);

    return () => {
      processor.disconnect();
      sourceNode.disconnect();
      stream.getTracks().forEach(track => track.stop());
    };
  } catch (error) {
    console.error("Error accessing desktop audio:", error);
    throw error;
  }
}

export async function setupSystemAudioCapture(
  callback: (chunk: Float32Array, sampleRate: number) => void
) {
  const unlisten = await listen("audio-chunk", (event) => {
    const { chunk, sampleRate } = event.payload as { chunk: string; sampleRate: number };

    // decode base64 -> ArrayBuffer -> Float32Array
    const raw = atob(chunk);
    const buf = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) {
      view[i] = raw.charCodeAt(i);
    }
    const float32 = new Float32Array(buf);

    callback(float32, sampleRate);
  });

  await invoke("start_audio_capture");

  return async () => {
    await invoke("stop_audio_capture");
    unlisten();
  };
}