using System.Net.Http.Headers;
using System.Text.Json;
using KikitanTranslator.Capture;
using KikitanTranslator.Utility;
using Serilog;

namespace KikitanTranslator.Recognizers;

public class GroqRecognizer : IRecognizer
{
    private const int BitsPerSample = 16;
    private const int Channels = 1;

    public event OnRecognition? OnRecognitionReceived;
    public event OnRecognizerStatus? OnRecognizerStatusChanged;

    private readonly ICapture _capture;
    private readonly HttpClient _httpClient = new();

    private RecognizerStatus _status = RecognizerStatus.NotStarted;

    private readonly List<float> _speechBuffer = [];
    private bool _isCollectingSpeech;

    private readonly Queue<(float[] samples, bool speech)> _frameQueue = new();
    private readonly SemaphoreSlim _processingSemaphore = new(1, 1);

    private string _language;

    public GroqRecognizer(ICapture capture)
    {
        _capture = capture;
        _capture.OnDataReceived += OnDataReceived;
    }

    public void Start(string language)
    {
        if (_status == RecognizerStatus.Running) return;
        _status = RecognizerStatus.Connecting;
        
        _speechBuffer.Clear();
        _isCollectingSpeech = false;
        _capture.Start();

        _language = language;

        SetStatus(RecognizerStatus.Running);
        Log.Information("[GROQ] Started Groq recognizer");
    }

    public void Stop()
    {
        if (_status == RecognizerStatus.NotStarted) return;

        _capture.Stop();

        if (_isCollectingSpeech && _speechBuffer.Count > 0)
        {
            TranscribeAsync(_speechBuffer.ToArray(), _capture.GetSampleRate());
            _speechBuffer.Clear();
            _isCollectingSpeech = false;
        }

        SetStatus(RecognizerStatus.NotStarted);
        Log.Information("[GROQ] Stopped Groq recognizer");
    }

    public RecognizerStatus Status() => _status;

    private void OnDataReceived(float[] samples, bool speech)
    {
        lock (_frameQueue) _frameQueue.Enqueue((samples, speech));
        _ = DrainQueueAsync();
    }

    private async Task DrainQueueAsync()
    {
        if (!await _processingSemaphore.WaitAsync(0)) return;

        try
        {
            while (true)
            {
                (float[] samples, bool speech) frame;
                lock (_frameQueue)
                {
                    if (_frameQueue.Count == 0) break;
                    frame = _frameQueue.Dequeue();
                }
                ProcessFrame(frame.samples, frame.speech);
            }
        }
        finally
        {
            _processingSemaphore.Release();
        }
    }

    private void ProcessFrame(float[] samples, bool speech)
    {
        if (speech)
        {
            if (!_isCollectingSpeech)
            {
                _isCollectingSpeech = true;
                _speechBuffer.Clear();
                
                OnRecognitionReceived?.Invoke("", false);
            }
            
            _speechBuffer.AddRange(samples);
        }
        else if (_isCollectingSpeech)
        {
            var audio = _speechBuffer.ToArray();
            _speechBuffer.Clear();
            _isCollectingSpeech = false;
            OnRecognitionReceived?.Invoke("", true);

            if (audio.Length < 3840) return;
            TranscribeAsync(audio, _capture.GetSampleRate());
        }
    }

    private async Task TranscribeAsync(float[] samples, uint sampleRate)
    {
        var apiKey = AppConfig.ConfigObject.GroqApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            Log.Error("[GROQ] No API key configured");
            return;
        }

        try
        {
            var fileContent = new ByteArrayContent(EncodeWav(samples, sampleRate));
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("audio/wav");
            
            using var content = new MultipartFormDataContent
            {
                { fileContent, "file", "audio.wav" },
                { new StringContent("whisper-large-v3"), "model" },
                { new StringContent("0"), "temperature" },
                { new StringContent("verbose_json"), "response_format" },
                { new StringContent(_language), "language" },
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/audio/transcriptions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = content;

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                Log.Error($"[GROQ] Whisper API error {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
                return;
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var transcript = doc.RootElement.TryGetProperty("text", out var textProp) ? textProp.GetString()?.Trim() : null;

            if (string.IsNullOrWhiteSpace(transcript)) return;
            OnRecognitionReceived?.Invoke(transcript, true);
        }
        catch (Exception ex)
        {
            Log.Error($"[GROQ] Transcription error: {ex.Message}");
        }
    }

    private static byte[] EncodeWav(float[] samples, uint sampleRate)
    {
        int dataBytes = samples.Length * (BitsPerSample / 8);
        uint byteRate = sampleRate * Channels * (BitsPerSample / 8);

        using var ms = new MemoryStream(44 + dataBytes);
        using var writer = new BinaryWriter(ms);

        writer.Write("RIFF"u8);
        writer.Write(36 + dataBytes);
        writer.Write("WAVE"u8);
        writer.Write("fmt "u8);
        writer.Write(16);
        writer.Write((ushort)1);
        writer.Write((ushort)Channels);
        writer.Write(sampleRate);
        writer.Write(byteRate);
        writer.Write((ushort)(Channels * (BitsPerSample / 8)));
        writer.Write((ushort)BitsPerSample);
        writer.Write("data"u8);
        writer.Write(dataBytes);

        foreach (var sample in samples)
        {
            var clamped = Math.Max(-1f, Math.Min(1f, sample));
            writer.Write((short)(clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF));
        }

        return ms.ToArray();
    }

    private void SetStatus(RecognizerStatus status)
    {
        _status = status;
        OnRecognizerStatusChanged?.Invoke(status);
    }

    public void Dispose()
    {
        Stop();
        _capture.OnDataReceived -= OnDataReceived;
        _httpClient.Dispose();
        _processingSemaphore.Dispose();
        GC.SuppressFinalize(this);
    }
}