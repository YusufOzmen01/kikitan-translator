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
    private AudioCaptureDevice _captureDevice;
    
    public Microphone()
    {
        _engine = new MiniAudioEngine();
    }

    public DeviceInfo[] GetDevices() => _engine.CaptureDevices;
    public void SetDevice(DeviceInfo device) => _device = device;

    public uint GetSampleRate() => 16000;

    public void Start()
    {
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
            
            // TODO: Log
        }

        _captureDevice = _engine.InitializeCaptureDevice(_device, audioFormat);
        _captureDevice.OnAudioProcessed += AudioProcessCallback;
        _captureDevice.Start();
        
        // TODO: Log
    }

    public void Stop()
    {
        _captureDevice.Stop();
        _captureDevice.Dispose();
        
        // TODO: Log
    }

    private void AudioProcessCallback(Span<float> samples, Capability capability) => OnDataReceived?.Invoke(samples.ToArray());
}