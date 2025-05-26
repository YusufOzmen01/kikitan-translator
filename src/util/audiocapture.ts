export async function setupMicrophoneCapture(callback: (chunk: Float32Array<ArrayBufferLike>, sampleRate: number) => void) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
