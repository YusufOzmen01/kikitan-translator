using KikitanTranslator.Utility;
using Serilog;
using SoundFlow.Abstracts.Devices;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Enums;
using SoundFlow.Structs;

namespace KikitanTranslator.Capture;

public class Microphone : ICapture
{
    public event OnData? OnDataReceived;
    private AudioCaptureDevice? _captureDevice;
    private bool _paused;
    
    public uint GetSampleRate() => 16000;

    public void Start()
    {
        var engine = new MiniAudioEngine();
        DeviceInfo? device;
        
        Log.Information("\x1b[33m[MIC]  Starting capture");
        var audioFormat = new AudioFormat
        {
            SampleRate = 16000,
            Channels = 1,
            Format = SampleFormat.S16,
            Layout = ChannelLayout.Mono
        };

        if (AppConfig.ConfigObject.Microphone.Length == 0)
        {
            device = engine.CaptureDevices.First(d => d.IsDefault);
                
            Log.Warning($"\x1b[33m[MIC]  No microphone was selected, using the default device ({device.Value.Name}) for capture");
        }
        else if (engine.CaptureDevices.Any(d => d.Name == AppConfig.ConfigObject.Microphone))
        {
            device = engine.CaptureDevices.First(d => d.Name == AppConfig.ConfigObject.Microphone);
        }
        else
        {
            device = engine.CaptureDevices.First(d => d.IsDefault);
                    
            Log.Warning($"\x1b[33m[MIC]  The selected mic ({AppConfig.ConfigObject.Microphone}) is not available. Switching to the system default ({device.Value.Name})");
            
            AppConfig.ConfigObject.Microphone = device.Value.Name;
        }
        
        Log.Information($"\x1b[33m[MIC]  Starting capture using {device.Value.Name}");
        
        _captureDevice = engine.InitializeCaptureDevice(device, audioFormat);
        _captureDevice.OnAudioProcessed += AudioProcessCallback;
        _captureDevice.Start();
        
        Log.Information("\x1b[33m[MIC]  Capture has started");
    }

    public void Stop()
    {
        if (_captureDevice == null) return;
        
        _captureDevice.Stop();
        
        Log.Information("\x1b[33m[MIC]  Capture has stopped");
    }

    public void Pause()
    {
        Log.Verbose("\x1b[33m[MIC]  Capture paused");
        
        _paused = true;
    }

    public void Resume()
    {
        Log.Verbose("\x1b[33m[MIC]  Capture resumed");
        
        _paused = false;
    }

    private void AudioProcessCallback(Span<float> samples, Capability capability)
    {
        if (_paused) return;
        
        OnDataReceived?.Invoke(samples.ToArray());
    }
}