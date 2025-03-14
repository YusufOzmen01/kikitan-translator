/**
 * Voice Activity Detection (VAD) library for browser environments
 * Captures microphone audio when speech is detected and returns the audio data
 * as a base64-encoded WAV file once speech has stopped.
 * Continues listening for multiple speech segments until manually stopped.
 */

export interface VADOptions {
    /** Time in milliseconds of silence before speech is considered to have ended */
    silenceThreshold: number;
    /** Volume threshold (0-1) for considering audio as speech */
    volumeThreshold: number;
    /** Sample rate for output audio (default: 16000) */
    sampleRate: number;
    /** Minimum speech duration in milliseconds to be considered valid (default: 300) */
    minSpeechDuration: number;
}

export interface VADResult {
    /** Base64-encoded WAV file with detected speech */
    audioBase64: string;
    /** Duration of speech in seconds */
    duration: number;
}

export class VAD {
    private options: VADOptions;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private recorder: AudioWorkletNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private analyser: AnalyserNode | null = null;
    private recording = false;
    private speechDetected = false;
    private silenceStart: number | null = null;
    private speechStart: number | null = null;
    private audioBuffer: Float32Array[] = [];
    private onSpeechEndCallback: ((result: VADResult) => void) | null = null;
    private continueListening = true;
    private analyserInterval: number | null = null;
    private dataArray: Uint8Array | null = null;

    constructor(options?: Partial<VADOptions>) {
        this.options = {
            silenceThreshold: options?.silenceThreshold ?? 1500,
            volumeThreshold: options?.volumeThreshold ?? 0.05,
            sampleRate: options?.sampleRate ?? 16000,
            minSpeechDuration: options?.minSpeechDuration ?? 300
        };
    }

    /**
     * Start listening to microphone input and detecting voice activity
     * Will continue detecting multiple speech segments until stop() is called
     * @param callback Function to call when each speech segment ends with the processed audio data
     */
    public async start(callback: (result: VADResult) => void): Promise<void> {
        if (this.recording) {
            throw new Error('VAD is already running');
        }

        this.onSpeechEndCallback = callback;
        this.recording = true;
        this.continueListening = true;
        this.resetSpeechDetection();

        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Set up audio processing
            this.audioContext = new AudioContext();

            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create analyzer for volume detection
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // Connect source to analyzer
            this.sourceNode.connect(this.analyser);

            // Set up volume detection interval
            this.analyserInterval = window.setInterval(() => this.checkVolume(), 100);

        } catch (error) {
            this.recording = false;
            throw new Error(`Failed to access microphone: ${error}`);
        }
    }

    /**
     * Stop listening to microphone input and clean up resources
     */
    public stop(): void {
        if (!this.recording) {
            return;
        }

        this.continueListening = false;

        // If speech was being detected, finalize it
        if (this.speechDetected) {
            this.finalizeSpeech();
        } else {
            this.cleanup();
        }
    }

    /**
     * Reset speech detection state for new utterance
     */
    private resetSpeechDetection(): void {
        this.speechDetected = false;
        this.silenceStart = null;
        this.speechStart = null;
        this.audioBuffer = [];
    }

    /**
     * Check volume levels to detect speech
     */
    private checkVolume(): void {
        if (!this.recording || !this.analyser || !this.dataArray) return;

        // Get volume data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length / 255; // Normalize to 0-1

        const now = Date.now();

        if (average > this.options.volumeThreshold) {
            // Voice detected
            if (!this.speechDetected) {
                this.speechDetected = true;
                this.speechStart = now;

                // Start recording audio samples directly
                this.startRecordingAudioSamples();
            }
            this.silenceStart = null;
        } else if (this.speechDetected) {
            // Potential silence after speech
            if (this.silenceStart === null) {
                this.silenceStart = now;
            } else if (now - this.silenceStart > this.options.silenceThreshold) {
                // Check if speech was long enough to be considered valid
                const speechDuration = (this.silenceStart - (this.speechStart || this.silenceStart));

                if (speechDuration >= this.options.minSpeechDuration) {
                    // Silence threshold reached, end this speech segment
                    this.finalizeSpeech();

                    // If we should continue listening, reset for next utterance
                    if (this.continueListening) {
                        this.resetSpeechDetection();
                    }
                } else {
                    // Speech too short, discard and reset
                    this.resetSpeechDetection();
                }
            }
        }
    }

    /**
     * Start recording raw audio samples
     */
    private startRecordingAudioSamples(): void {
        if (!this.audioContext || !this.sourceNode) return;

        // Create a script processor to collect audio samples
        const bufferSize = 4096;
        const scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

        scriptNode.onaudioprocess = (event) => {
            if (this.speechDetected) {
                // Clone the input buffer to store the samples
                const inputData = event.inputBuffer.getChannelData(0);
                const samples = new Float32Array(inputData.length);
                samples.set(inputData);
                this.audioBuffer.push(samples);
            }
        };

        this.sourceNode.connect(scriptNode);
        scriptNode.connect(this.audioContext.destination);

        // Store for cleanup
        this.recorder = scriptNode as any; // Type hack since ScriptProcessorNode isn't a proper AudioWorkletNode
    }

    /**
     * Process recorded audio and call the callback
     */
    private async finalizeSpeech(): Promise<void> {
        if (!this.speechDetected || this.audioBuffer.length === 0) {
            if (!this.continueListening) {
                this.cleanup();
            }
            return;
        }

        // Convert raw audio samples to WAV format
        const wavBase64 = this.rawSamplesToWavBase64(this.audioBuffer);

        // Calculate duration (approximate)
        const sampleCount = this.audioBuffer.reduce((count, buffer) => count + buffer.length, 0);
        const duration = sampleCount / this.audioContext!.sampleRate;

        // Call the callback with the result
        if (this.onSpeechEndCallback) {
            this.onSpeechEndCallback({
                audioBase64: wavBase64,
                duration
            });
        }

        // If we're not continuing to listen, clean up resources
        if (!this.continueListening) {
            this.cleanup();
        }
    }

    /**
     * Convert raw Float32Array samples to WAV base64 string
     */
    private rawSamplesToWavBase64(buffers: Float32Array[]): string {
        if (!this.audioContext) {
            throw new Error('AudioContext not initialized');
        }

        // Calculate total length
        const totalLength = buffers.reduce((length, buffer) => length + buffer.length, 0);

        // Create a single buffer with all samples
        const mergedBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const buffer of buffers) {
            mergedBuffer.set(buffer, offset);
            offset += buffer.length;
        }

        // Resample to target sample rate if needed
        let samples: Float32Array;
        if (this.audioContext.sampleRate !== this.options.sampleRate) {
            samples = this.resampleAudio(mergedBuffer, this.audioContext.sampleRate, this.options.sampleRate);
        } else {
            samples = mergedBuffer;
        }

        // Create WAV file
        const wavBuffer = this.float32ToWav(samples, this.options.sampleRate);

        // Convert to base64
        return this.arrayBufferToBase64(wavBuffer);
    }

    /**
     * Resample audio to a different sample rate
     */
    private resampleAudio(audioBuffer: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
        const ratio = originalSampleRate / targetSampleRate;
        const newLength = Math.round(audioBuffer.length / ratio);
        const result = new Float32Array(newLength);

        for (let i = 0; i < newLength; i++) {
            const position = i * ratio;
            const index = Math.floor(position);
            const fraction = position - index;

            if (index + 1 < audioBuffer.length) {
                // Linear interpolation
                result[i] = audioBuffer[index] * (1 - fraction) + audioBuffer[index + 1] * fraction;
            } else {
                result[i] = audioBuffer[index];
            }
        }

        return result;
    }

    /**
     * Convert Float32Array to WAV format
     */
    private float32ToWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
        const numChannels = 1; // Mono
        const bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;

        // Calculate sizes
        const dataLength = samples.length * bytesPerSample;
        const fileLength = 44 + dataLength;

        // Create WAV buffer
        const wavBuffer = new ArrayBuffer(fileLength);
        const view = new DataView(wavBuffer);

        // Write WAV header
        // "RIFF" chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, fileLength - 8, true);
        this.writeString(view, 8, 'WAVE');

        // "fmt " sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, numChannels, true); // channels
        view.setUint32(24, sampleRate, true); // sample rate
        view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
        view.setUint16(32, numChannels * bytesPerSample, true); // block align
        view.setUint16(34, bitsPerSample, true); // bits per sample

        // "data" sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data
        // Convert float to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            // Clamp value between -1 and 1
            let sample = Math.max(-1, Math.min(1, samples[i]));
            // Convert to 16-bit value
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
        }

        return wavBuffer;
    }

    /**
     * Convert ArrayBuffer to base64 string
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Write a string to a DataView at the specified offset
     */
    private writeString(view: DataView, offset: number, string: string): void {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Clean up resources
     */
    private cleanup(): void {
        // Clear analyzer interval
        if (this.analyserInterval !== null) {
            window.clearInterval(this.analyserInterval);
            this.analyserInterval = null;
        }

        // Disconnect and clean up audio nodes
        if (this.recorder) {
            this.recorder.disconnect();
            this.recorder = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }

        // Stop all tracks from the media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(console.error);
            this.audioContext = null;
        }

        this.dataArray = null;
        this.resetSpeechDetection();
        this.recording = false;
    }
}