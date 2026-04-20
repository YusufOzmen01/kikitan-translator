using KikitanTranslator.Utility;
using Serilog;
using SoundFlow.Abstracts.Devices;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Backends.MiniAudio.Enums;
using SoundFlow.Enums;
using SoundFlow.Structs;

namespace KikitanTranslator.Capture;

public class Microphone : ICapture
{
    public event OnData? OnDataReceived;
    private AudioCaptureDevice? _captureDevice;
    private bool _paused;
    private MiniAudioEngine _engine;
    
    public uint GetSampleRate() => 16000;

    public Microphone()
    {
            #if WINDOWS
            _engine = new MiniAudioEngine();
            #else
            _engine = new MiniAudioEngine(backendPriority:[MiniAudioBackend.Oss]);
            #endif
    }

    public DeviceInfo[] GetCaptureDevices()
    {
        _engine.UpdateAudioDevicesInfo();

        return _engine.CaptureDevices;
    }

    public void Start()
    {
        _engine.UpdateAudioDevicesInfo();
        if (_captureDevice != null) Stop();

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
            device = _engine.CaptureDevices.First(d => d.IsDefault);
            AppConfig.ConfigObject.Microphone = device.Value.Name;
                
            Log.Warning($"\x1b[33m[MIC]  No microphone was selected, using the default device ({device.Value.Name}) for capture");
        }
        else if (_engine.CaptureDevices.Any(d => d.Name == AppConfig.ConfigObject.Microphone))
        {
            device = _engine.CaptureDevices.First(d => d.Name == AppConfig.ConfigObject.Microphone);
        }
        else
        {
            device = _engine.CaptureDevices.First(d => d.IsDefault);
                    
            Log.Warning($"\x1b[33m[MIC]  The selected mic ({AppConfig.ConfigObject.Microphone}) is not available. Switching to the system default ({device.Value.Name})");
            
            AppConfig.ConfigObject.Microphone = device.Value.Name;
        }
        
        Log.Information($"\x1b[33m[MIC]  Starting capture using {device.Value.Name}");
        
        try
        {
            _captureDevice = _engine.InitializeCaptureDevice(device, audioFormat);
            _captureDevice.OnAudioProcessed += AudioProcessCallback;
            _captureDevice.Start();
        } catch (Exception e)
        {
            Log.Error($"\x1b[33m[MIC]  Error initializing capture: {e}. Restarting with default mic");

            AppConfig.ConfigObject.Microphone = "";

            Start();
            return;
        }
        
        Log.Information("\x1b[33m[MIC]  Capture has started");
    }

    public void Stop()
    {
        if (_captureDevice == null) return;
        
        _captureDevice.Stop();
        _captureDevice = null;
        
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