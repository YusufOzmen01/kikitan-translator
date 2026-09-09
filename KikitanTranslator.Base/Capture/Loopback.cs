using System.Runtime.InteropServices;
using KikitanTranslator.Utility;
using NAudio.CoreAudioApi;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;
using Serilog;

namespace KikitanTranslator.Capture;

public class Loopback : ICapture
{
    public event OnData? OnDataReceived;

    private bool _paused;
    private WasapiCapture? _capture;
    private SileroVad _vad;
    private readonly WaveFormat _targetFormat = new(16000, 16, 1);
    
    private byte[] _resampledBuffer = new byte[16000 * 2 / 10];
    private readonly float[] _vadChunk = new float[480];
    
    private MediaFoundationResampler? _resampler;
    private WaveFormat? _resamplerSourceFormat;

    public uint GetSampleRate() => 16000;

    public Loopback(string sileroModelPath)
    {
        _vad = new SileroVad(sileroModelPath);
    }

    public bool Start()
    {
        _capture = new WasapiLoopbackCapture();
        _capture.DataAvailable += OnDataAvailable;
        _capture.StartRecording();
        Log.Information("[LOOP] Capture has started");

        return true;
    }

    public void Stop()
    {
        if (_capture == null) return;
        
        _capture.DataAvailable -= OnDataAvailable;
        _capture.StopRecording();
        _capture = null;

        _resampler?.Dispose();
        _resampler = null;
        _resamplerSourceFormat = null;

        Log.Information("[LOOP] Capture has stopped");
    }

    public void Pause()   { _paused = true;  Log.Verbose("[LOOP] Capture paused"); }
    public void Resume()  { _paused = false; Log.Verbose("[LOOP] Capture resumed"); }

    private void OnDataAvailable(object? sender, WaveInEventArgs e)
    {
        if (_paused || e.BytesRecorded == 0) return;
        
        int estimatedBytes = (int)((long)e.BytesRecorded * _targetFormat.AverageBytesPerSecond / _capture.WaveFormat.AverageBytesPerSecond) + 1024;
        if (_resampledBuffer.Length < estimatedBytes)
            _resampledBuffer = new byte[estimatedBytes];
        
        if (_resampler == null || _resamplerSourceFormat != _capture.WaveFormat)
        {
            _resampler?.Dispose();

            var raw = new RawSourceWaveStream(e.Buffer, 0, e.BytesRecorded, _capture.WaveFormat);
            _resampler = new MediaFoundationResampler(
                new StereoToMonoProvider16(new SampleToWaveProvider16(raw.ToSampleProvider())),
                _targetFormat)
            {
                ResamplerQuality = 60
            };
            _resamplerSourceFormat = _capture.WaveFormat;
        }

        int bytesRead = _resampler.Read(_resampledBuffer, 0, estimatedBytes);

        int sampleCount = bytesRead / 2;
        float[] samples = new float[sampleCount];
        
        var shorts = MemoryMarshal.Cast<byte, short>(_resampledBuffer.AsSpan(0, bytesRead));
        for (int i = 0; i < shorts.Length; i++)
            samples[i] = shorts[i] / 32768f;

        AudioProcessCallback(samples);
    }

    private void AudioProcessCallback(float[] samples)
    {
        bool speech = false;
        int chunkCount = samples.Length / 480;

        for (int i = 0; i < chunkCount; i++)
        {
            speech |= _vad.SpeechDetection(samples.AsSpan(i * 480, 480));
            
            if (speech) break;
        }

        OnDataReceived?.Invoke(samples, speech);
    }
}