use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tauri::{Emitter};
use base64::{engine::general_purpose, Engine as _};
use once_cell::sync::Lazy;

struct CaptureState {
    stop_flag: bool,
}

static CAPTURE_STATE: Lazy<Arc<Mutex<Option<CaptureState>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

static MIC_CAPTURE_STATE: Lazy<Arc<Mutex<Option<CaptureState>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

#[tauri::command]
pub fn get_microphone_list() -> Result<Vec<String>, String> {
    let host = cpal::default_host();

    let default_name = host
        .default_input_device()
        .map(|d| d.name().unwrap_or_default())
        .unwrap_or_default();

    let mut names: Vec<String> = Vec::new();

    // Default device first
    if !default_name.is_empty() {
        names.push(default_name.clone());
    }

    // Add remaining input devices, skipping the default
    if let Ok(devices) = host.input_devices() {
        for device in devices {
            if let Ok(name) = device.name() {
                if name != default_name {
                    names.push(name);
                }
            }
        }
    }

    Ok(names)
}

#[tauri::command]
pub fn start_desktop_audio_capture(app: tauri::AppHandle) -> Result<(), String> {
    let mut state_guard = CAPTURE_STATE.lock().unwrap();
    if state_guard.is_some() {
        return Err("Audio capture already running".into());
    }
    *state_guard = Some(CaptureState { stop_flag: false });

    let state_arc = CAPTURE_STATE.clone();
    let app_handle = app.clone();

    thread::spawn(move || {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("No default output device (needed for WASAPI loopback)");

        // Default config of the output device (we’ll request f32)
        let config = device.default_output_config().unwrap();
        let sample_rate = config.sample_rate().0;
        let channels = config.channels() as usize;
        let buffer_size = 4096;

        let mut buffer: Vec<f32> = Vec::with_capacity(buffer_size);

        let state_clone = state_arc.clone();

        let stream = device.build_input_stream::<f32, _, _>(
            &config.into(),
            move |data: &[f32], _| {
                for frame in data.chunks(channels) {
                    buffer.push(frame[0]); // take first channel
                    if buffer.len() >= buffer_size {
                        // Convert Float32 to bytes
                        let mut bytes = Vec::with_capacity(buffer.len() * 4);
                        for &sample in &buffer {
                            bytes.extend_from_slice(&sample.to_le_bytes());
                        }
                        let b64 = general_purpose::STANDARD.encode(&bytes);

                        let _ = app_handle.emit(
                            "audio-chunk",
                            serde_json::json!({
                                "chunk": b64,
                                "sampleRate": sample_rate
                            }),
                        );

                        buffer.clear();
                    }
                }
            },
            move |err| eprintln!("Audio error: {:?}", err),
            None,
        );

        let stream = match stream {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to build input stream: {:?}", e);
                return;
            }
        };

        stream.play().expect("Failed to start stream");

        // run until stop_flag set
        loop {
            {
                let guard = state_clone.lock().unwrap();
                if let Some(state) = &*guard {
                    if state.stop_flag {
                        break;
                    }
                }
            }
            thread::sleep(Duration::from_millis(50));
        }
    });

    Ok(())
}

#[tauri::command]
pub fn stop_desktop_audio_capture() {
    let mut state_guard = CAPTURE_STATE.lock().unwrap();
    if let Some(state) = state_guard.as_mut() {
        state.stop_flag = true;
    }
    *state_guard = None;
}

#[tauri::command]
pub fn start_microphone_audio_capture(app: tauri::AppHandle, mic: usize) -> Result<(), String> {
    let mut state_guard = MIC_CAPTURE_STATE.lock().unwrap();
    if state_guard.is_some() {
        return Err("Microphone capture already running".into());
    }
    *state_guard = Some(CaptureState { stop_flag: false });

    let state_arc = MIC_CAPTURE_STATE.clone();
    let app_handle = app.clone();

    thread::spawn(move || {
        let host = cpal::default_host();

        let device = {
            let default_name = host.default_input_device()
                .map(|d| d.name().unwrap_or_default())
                .unwrap_or_default();

            if mic == 0 {
                host.default_input_device()
                    .expect("No default input device found")
            } else {
                let non_default: Vec<_> = host.input_devices()
                    .expect("Failed to enumerate input devices")
                    .filter(|d| d.name().unwrap_or_default() != default_name)
                    .collect();
                non_default.into_iter().nth(mic - 1)
                    .expect("Microphone index out of range")
            }
        };

        let config = device.default_input_config()
            .expect("Failed to get default input config");
        let sample_rate = config.sample_rate().0;
        let channels = config.channels() as usize;
        let buffer_size = 4096;

        let mut buffer: Vec<f32> = Vec::with_capacity(buffer_size);

        let state_clone = state_arc.clone();

        let stream = device.build_input_stream::<f32, _, _>(
            &config.into(),
            move |data: &[f32], _| {
                for frame in data.chunks(channels) {
                    buffer.push(frame[0]); // take first channel
                    if buffer.len() >= buffer_size {
                        let mut bytes = Vec::with_capacity(buffer.len() * 4);
                        for &sample in &buffer {
                            bytes.extend_from_slice(&sample.to_le_bytes());
                        }
                        let b64 = general_purpose::STANDARD.encode(&bytes);

                        let _ = app_handle.emit(
                            "mic-audio-chunk",
                            serde_json::json!({
                                "chunk": b64,
                                "sampleRate": sample_rate
                            }),
                        );

                        buffer.clear();
                    }
                }
            },
            move |err| eprintln!("Mic audio error: {:?}", err),
            None,
        );

        let stream = match stream {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to build mic input stream: {:?}", e);
                return;
            }
        };

        stream.play().expect("Failed to start mic stream");

        loop {
            {
                let guard = state_clone.lock().unwrap();
                if let Some(state) = &*guard {
                    if state.stop_flag {
                        break;
                    }
                }
            }
            thread::sleep(Duration::from_millis(50));
        }
    });

    Ok(())
}

#[tauri::command]
pub fn stop_microphone_audio_capture() {
    let mut state_guard = MIC_CAPTURE_STATE.lock().unwrap();
    if let Some(state) = state_guard.as_mut() {
        state.stop_flag = true;
    }
    *state_guard = None;
}
