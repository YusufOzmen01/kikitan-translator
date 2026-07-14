using System.Globalization;
using System.Net.WebSockets;
using System.Resources;
using System.Runtime.InteropServices;
using System.Text;
using KikitanTranslator.Capture;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using Websocket.Client;

namespace KikitanTranslator.Base.Recognizers;

public class Gemini(ICapture capture) : IRecognizer
{
    private WebsocketClient? _client;

    private RecognizerStatus _status;

    private string currentInput = "";
    private string currentOutput = "";

    private int _lastTranscription;
    
    public void Start(string language, IErrorHandler errorHandler)
    {
        Resources.ErrorMessages.messages.Culture = new CultureInfo(AppConfig.ConfigObject.Language == "jp" ? "ja" : AppConfig.ConfigObject.Language);
        
        Log.Information("[GEMI] Starting Gemini live translator...");
        
        if (String.IsNullOrEmpty(AppConfig.ConfigObject.GeminiApiKey))
        {
            Log.Error("[GEMI] No API key is defined!");
            errorHandler.OnError(Resources.ErrorMessages.messages.NoApiKey);
            
            ChangeRecognizerStatus(RecognizerStatus.NotStarted);

            return;
        }

        if (!ValidateKey().GetAwaiter().GetResult())
        {
            Log.Error("[GEMI] Invalid API key!");
            errorHandler.OnError(Resources.ErrorMessages.messages.ApiKeyInvalidGemini);
            
            return;
        }
        
        var url = $"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={AppConfig.ConfigObject.GeminiApiKey}";
        _client = new WebsocketClient(new Uri(url));
        
        _client.ReconnectionHappened.Subscribe(async info =>
        {
            if (_status == RecognizerStatus.Connecting || _status == RecognizerStatus.Running) return;
            
            Log.Verbose("[GEMI] Websocket connection established");
            await Task.Delay(100);
            
            var configPayload = new
            {
                setup = new
                {
                    model = "models/gemini-3.5-live-translate-preview",
                    inputAudioTranscription = new {},
                    outputAudioTranscription = new {},
                    generationConfig = new
                    {
                        responseModalities = (string[])["TEXT"],
                        translationConfig = new
                        {
                            targetLanguageCode = language == AppConfig.ConfigObject.SourceLanguage ? AppConfig.ConfigObject.TargetLanguage : AppConfig.ConfigObject.SourceLanguage,
                            echoTargetLanguage = false
                        }
                    }
                }
            };

            _client.Send(JsonConvert.SerializeObject(configPayload));
            
            ChangeRecognizerStatus(RecognizerStatus.Connecting);
            Log.Information("[GEMI] Payload has been sent!");
        });
        
        _client.MessageReceived.Subscribe(message =>
        {
            var msg = Encoding.UTF8.GetString(message.Binary).Trim();
            dynamic data = JObject.Parse(msg);

            if (_status != RecognizerStatus.Running)
            {
                capture.OnDataReceived += OnAudioData;
                capture.Start();
            
                ChangeRecognizerStatus(RecognizerStatus.Running);
                Log.Information("[GEMI] Gemini recognizer has started");
            }

            try
            {
                if (data.serverContent?.inputTranscription != null && data.serverContent?.inputTranscription.text != null)
                {
                    currentInput += data.serverContent.inputTranscription.text;
                    
                    OnRecognitionReceived?.Invoke($"{currentInput}|{currentOutput}", false);
                }

                if (data.serverContent?.outputTranscription != null)
                {
                    if (DateTime.Now.Millisecond - _lastTranscription > 5000)
                    {
                        currentInput = "";
                        currentOutput = "";
                    }

                    _lastTranscription = DateTime.Now.Millisecond;
                    
                    if (data.serverContent?.outputTranscription.text != null)
                    {
                        currentOutput += data.serverContent.outputTranscription.text;
                        
                        OnRecognitionReceived?.Invoke($"{currentInput}|{currentOutput}".Trim(), false);
                    } else if (currentInput.Length != 0)
                    {
                        OnRecognitionReceived?.Invoke($"{currentInput}|{currentOutput}".Trim(), true);

                        currentInput = "";
                        currentOutput = "";
                    }
                }
                    
            }
            catch { }
        });
        
        _client.DisconnectionHappened.Subscribe(async info =>
        {
            Log.Error($"[GEMI] Websocket connection has closed. Reason: {info.Type}");
            ChangeRecognizerStatus(RecognizerStatus.NotStarted);
        });

        _client.Start();
    }

    public void Stop()
    {
        capture.Stop();
        _client?.Stop(WebSocketCloseStatus.NormalClosure, "User request");
        capture.OnDataReceived -= OnAudioData;
        ChangeRecognizerStatus(RecognizerStatus.NotStarted);
         
        Log.Information("[GEMI] Gemini translator has stopped");
    }

    public RecognizerStatus Status() => _status;
    
    private void ChangeRecognizerStatus(RecognizerStatus status)
    {
        _status = status;
        OnRecognizerStatusChanged?.Invoke(status);
    }
    
    private void OnAudioData(float[] samples, bool speech)
    {
        var payload = new
        {
            realtimeInput = new
            {
                audio = new
                {
                    data =  FloatArrayToBase64(speech ? samples : new float[1600]),
                    mimeType = "audio/pcm;rate=16000"
                }
            }
        };

        _client?.Send(JsonConvert.SerializeObject(payload));
    }
    
    
    private string FloatArrayToBase64(float[] audioSamples)
    {
        if (audioSamples.Length == 0) return string.Empty;

        byte[] pcm16 = new byte[audioSamples.Length * 2];
        for (int i = 0; i < audioSamples.Length; i++)
        {
            float clamped = Math.Clamp(audioSamples[i], -1f, 1f);
            short sample = (short)(clamped * short.MaxValue);
            pcm16[i * 2]     = (byte)(sample & 0xFF);
            pcm16[i * 2 + 1] = (byte)((sample >> 8) & 0xFF);
        }

        return Convert.ToBase64String(pcm16);
    }

    private async Task<bool> ValidateKey()
    {
        using (HttpClient client = new HttpClient())
        {
            try
            {
                await client.GetStringAsync(
                    $"https://generativelanguage.googleapis.com/v1beta/models?key={AppConfig.ConfigObject.GeminiApiKey}");

                return true;
            }
            catch (HttpRequestException e)
            {
                return false;
            }
        }
    }
    
    public void Dispose()
    {
        Stop();
        _client?.Dispose();
    }
    
    public event OnRecognition? OnRecognitionReceived;
    public event OnRecognizerStatus? OnRecognizerStatusChanged;
}