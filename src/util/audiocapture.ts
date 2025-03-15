export async function setupMicrophoneCapture(callback: (chunk: Float32Array<ArrayBufferLike>, sampleRate: number) => void) {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up AudioContext
      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaStreamSource(stream);
      
      // Calculate buffer size based on sample rate and desired chunk duration
      const sampleRate = audioContext.sampleRate;
      const bufferSize = 1024;
      
      // Create ScriptProcessor (note: this API is deprecated but still widely supported)
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      // Process audio data
      processor.onaudioprocess = (audioProcessingEvent) => {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Get PCM data (Float32Array)
        
        callback(inputData, sampleRate);
      };
      
      // Connect the nodes
      sourceNode.connect(processor);
      processor.connect(audioContext.destination);
      
      // Return a function to stop capturing
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
  