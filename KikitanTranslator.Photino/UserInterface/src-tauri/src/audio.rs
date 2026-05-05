use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

use base64::{engine::general_purpose, Engine as _};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SupportedStreamConfig};
use once_cell::sync::Lazy;
use serde::Serialize;
use tauri::Emitter;

#[derive(Serialize)]
pub struct MicrophoneInfo {
    pub name: String,
    pub sample_rate: u32,
}

struct CaptureHandle {
    stop: Arc<AtomicBool>,
    running: Arc<AtomicBool>,
}

impl CaptureHandle {
    fn new() -> Self {
        Self {
            stop: Arc::new(AtomicBool::new(false)),
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    fn stop_and_wait(&self) {
        self.stop.store(true, Ordering::Release);
        for _ in 0..80 {
            if !self.running.load(Ordering::Acquire) {
                return;
            }
            thread::sleep(Duration::from_millis(25));
        }
    }

    fn try_start(&self) -> Result<(Arc<AtomicBool>, Arc<AtomicBool>), String> {
        self.stop.store(false, Ordering::Release);
        self.running
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .map_err(|_| "Previous capture is still running".to_string())?;
        Ok((Arc::clone(&self.stop), Arc::clone(&self.running)))
    }

    fn request_stop(&self) {
        self.stop.store(true, Ordering::Release);
    }
}

struct RunningGuard(Arc<AtomicBool>);

impl Drop for RunningGuard {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

static DESKTOP_CAPTURE: Lazy<CaptureHandle> = Lazy::new(CaptureHandle::new);
static MIC_CAPTURE: Lazy<CaptureHandle> = Lazy::new(CaptureHandle::new);

const CHUNK_SIZE: usize = 4096;

fn start_capture(
    handle: &CaptureHandle,
    app: tauri::AppHandle,
    event_name: &'static str,
    device_fn: impl FnOnce() -> Result<(Device, SupportedStreamConfig), String> + Send + 'static,
) -> Result<(), String> {
    handle.stop_and_wait();
    let (stop, running) = handle.try_start()?;

    thread::spawn(move || {
        let _guard = RunningGuard(Arc::clone(&running));

        let (device, config) = match device_fn() {
            Ok(pair) => pair,
            Err(e) => {
                eprintln!("[audio] Device error: {e}");
                return;
            }
        };

        let sample_rate = config.sample_rate().0;
        let channels = config.channels() as usize;

        let stop_cb = Arc::clone(&stop);
        let mut buffer: Vec<f32> = Vec::with_capacity(CHUNK_SIZE);

        let stream = device.build_input_stream::<f32, _, _>(
            &config.into(),
            move |data: &[f32], _| {
                if stop_cb.load(Ordering::Relaxed) {
                    return;
                }
                for frame in data.chunks(channels) {
                    buffer.push(frame[0]);
                    if buffer.len() >= CHUNK_SIZE {
                        let bytes: Vec<u8> =
                            buffer.iter().flat_map(|s| s.to_le_bytes()).collect();
                        let b64 = general_purpose::STANDARD.encode(&bytes);
                        let _ = app.emit(
                            event_name,
                            serde_json::json!({
                                "chunk": b64,
                                "sampleRate": sample_rate,
                            }),
                        );
                        buffer.clear();
                    }
                }
            },
            |err| eprintln!("[audio] Stream error: {err:?}"),
            None,
        );

        let stream = match stream {
            Ok(s) => s,
            Err(e) => {
                eprintln!("[audio] Failed to build stream: {e:?}");
                return;
            }
        };

        if let Err(e) = stream.play() {
            eprintln!("[audio] Failed to play stream: {e:?}");
            return;
        }

        while !stop.load(Ordering::Acquire) {
            thread::sleep(Duration::from_millis(50));
        }
    });

    Ok(())
}

#[tauri::command]
pub fn get_microphone_list() -> Result<Vec<MicrophoneInfo>, String> {
    let host = cpal::default_host();

    let default_name = host
        .default_input_device()
        .map(|d| d.name().unwrap_or_default())
        .unwrap_or_default();

    let mut result: Vec<MicrophoneInfo> = Vec::new();

    if let Some(device) = host.default_input_device() {
        let sample_rate = device
            .default_input_config()
            .map(|c| c.sample_rate().0)
            .unwrap_or(0);
        result.push(MicrophoneInfo {
            name: default_name.clone(),
            sample_rate,
        });
    }

    if let Ok(devices) = host.input_devices() {
        for device in devices {
            if let Ok(name) = device.name() {
                if name != default_name {
                    let sample_rate = device
                        .default_input_config()
                        .map(|c| c.sample_rate().0)
                        .unwrap_or(0);
                    result.push(MicrophoneInfo { name, sample_rate });
                }
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub fn start_desktop_audio_capture(app: tauri::AppHandle) -> Result<(), String> {
    start_capture(&DESKTOP_CAPTURE, app, "audio-chunk", || {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .ok_or("No default output device (needed for WASAPI loopback)")?;
        let config = device
            .default_output_config()
            .map_err(|e| format!("Failed to get output config: {e}"))?;
        Ok((device, config))
    })
}

#[tauri::command]
pub fn stop_desktop_audio_capture() {
    DESKTOP_CAPTURE.request_stop();
}

#[tauri::command]
pub fn start_microphone_audio_capture(app: tauri::AppHandle, mic: String) -> Result<(), String> {
    start_capture(&MIC_CAPTURE, app, "mic-audio-chunk", move || {
        let host = cpal::default_host();
        let device = host
            .input_devices()
            .map_err(|e| format!("Failed to enumerate input devices: {e}"))?
            .find(|d| d.name().unwrap_or_default().trim() == mic.trim())
            .ok_or_else(|| format!("Microphone '{mic}' not found"))?;
        let config = device
            .default_input_config()
            .map_err(|e| format!("Failed to get input config: {e}"))?;
        Ok((device, config))
    })
}

#[tauri::command]
pub fn stop_microphone_audio_capture() {
    MIC_CAPTURE.request_stop();
}