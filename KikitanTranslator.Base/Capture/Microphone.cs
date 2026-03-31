using Serilog;
using SoundFlow.Abstracts.Devices;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Enums;
using SoundFlow.Structs;

namespace KikitanTranslator.Capture;

public class Microphone : ICapture
{
    public event OnData? OnDataReceived;
    private MiniAudioEngine _engine;
    private DeviceInfo? _device;
    private AudioCaptureDevice? _captureDevice;
    private bool _paused;
    
    public Microphone()
    {
        _engine = new MiniAudioEngine();
    }

    public DeviceInfo[] GetDevices() => _engine.CaptureDevices;
    public void SetDevice(DeviceInfo device) => _device = device;

    public uint GetSampleRate() => 16000;

    public void Start()
    {
        Log.Information("\x1b[33m[MIC]  Starting capture");
        var audioFormat = new AudioFormat
        {
            SampleRate = 16000,
            Channels = 1,
            Format = SampleFormat.S16,
            Layout = ChannelLayout.Mono
        };

        if (_device == null)
        {
            _device = _engine.CaptureDevices.First(d => d.IsDefault);
            
            Log.Warning($"\x1b[33m[MIC]  No microphone was selected, using the default device ({_device.Value.Name}) for capture");
        }
        
        _captureDevice = _engine.InitializeCaptureDevice(_device, audioFormat);
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