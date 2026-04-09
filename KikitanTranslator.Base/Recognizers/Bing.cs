using System.Buffers.Binary;
using System.Globalization;
using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using KikitanTranslator.Capture;
using KikitanTranslator.Types.Bing;
using KikitanTranslator.Utility;
using Newtonsoft.Json;
using Serilog;
using Websocket.Client;

namespace KikitanTranslator.Recognizers;

public class Bing(ICapture capture) : IRecognizer
{
    public event OnRecognition? OnRecognitionReceived;
    public event OnRecognizerStatus? OnRecognizerStatusChanged;

    private ICapture _capture = capture;
    private WebsocketClient _client;

    private RecognizerStatus _status;

    private string _connectionId;
    private string _currentRequestId;
    private uint _streamIdCounter = 1;
    private string? _currentStreamTag;
    private string _language;

    private long _bytesSend;
    
    private readonly uint RESTART_LIMIT = 20;

    private void Reset()
    {
        _connectionId = GenerateUUID();
        _currentRequestId = GenerateUUID();
        _streamIdCounter = 1;
        _currentStreamTag = null;
        _bytesSend = 0;
        _capture.Stop();
        
        Log.Information("\x1b[32m[BING] Configuration has been resetted");
    }
    
    public void Start(string language)
    {
        Log.Information("\x1b[32m[BING] Starting Bing recognizer...");
        ChangeRecognizerStatus(RecognizerStatus.Connecting);
        
        _language = language;
        var url = $"wss://speech.platform.bing.com/speech/recognition/edge/interactive/v1?TrustedClientToken={Constants.BING_TRUSTED_TOKEN}&Sec-MS-GEC={GenerateSecMsSec()}&Sec-MS-GEC-Version={Constants.BING_MS_VERSION}&language={_language}&profanity=raw";

        var factory = new Func<ClientWebSocket>(() =>
        {
            var client = new ClientWebSocket();
            client.Options.SetRequestHeader("X-ConnectionId", _connectionId);
            return client;
        });

        _client = new WebsocketClient(new Uri(url), factory);
        
        _client.ReconnectionHappened.Subscribe(async info =>
        {
            if (_status == RecognizerStatus.Running) return;
            
            Reset();
            Log.Verbose("\x1b[32m[BING] Websocket connection established");
            await Task.Delay(100);
            
            var configPayload = new
            {
                context = new
                {
                    audio = new
                    {
                        source = new
                        {
                            bitspersample = "16",
                            channelcount = "1",
                            model = "",
                            samplerate = _capture.GetSampleRate().ToString(),
                            type = "Stream"
                        }
                    },
                    os = new { name = "Client", platform = "Windows", version = "10" },
                    system = new { build = "Windows-x64", name = "SpeechSDK", version = "1.15.0" }
                }
            };
            
            _client.Send(CreateTextMessage("speech.config", JsonConvert.SerializeObject(configPayload), "application/json", null));
            Log.Verbose("\x1b[32m[BING] Speech configuration has been sent");
            
            var contextPayload = new
            {
                audio = new
                {
                    streams = new Dictionary<string, object>
                    {
                        { "1", null }
                    }
                }
            };

            await Task.Delay(100);
            _client.Send(CreateTextMessage("speech.context", JsonConvert.SerializeObject(contextPayload), null, _currentRequestId));
            Log.Verbose("\x1b[32m[BING] Speech context has been sent");
            
            await Task.Delay(100);
            _client.Send(CreateBinaryMessage("audio", $"{_streamIdCounter}", _currentRequestId, CreateWavHeader(), "audio/x-wav"));
            Log.Verbose("\x1b[32m[BING] Wav header has been sent");

            _capture.OnDataReceived += OnAudioData;
            
            _capture.Start();
            Log.Information("\x1b[32m[BING] Bing recognizer has started");
        });
        
        _client.MessageReceived.Subscribe(message =>
        {
            var (path, json) = ParseWebsocketMessage(message.Text!);
            switch (path)
            {
                case "turn.start":
                    TurnStart? start = JsonConvert.DeserializeObject<TurnStart>(json);
                    _currentStreamTag = start?.Context.ServiceTag;
                    
                    ChangeRecognizerStatus(RecognizerStatus.Running);
                    
                    break;
                case "turn.end":
                    RestartTurn();
                    
                    break;
                case "speech.hypothesis":
                    using (SpeechData? data = JsonConvert.DeserializeObject<SpeechData>(json))
                    {
                        if (data?.Text != null) Task.Run(() => OnRecognitionReceived?.Invoke(data.Text, false));
                    }
                    
                    break;
                case "speech.phrase":
                    using (SpeechData? data = JsonConvert.DeserializeObject<SpeechData>(json))
                    {
                        if (data?.DisplayText != null) Task.Run(() => OnRecognitionReceived?.Invoke(data.DisplayText, true));
                    }
                    
                    break;
            }
        });
        _client.DisconnectionHappened.Subscribe(async info =>
        {
            Log.Error($"\x1b[32m[BING] Websocket connection has closed. Reason: {info.Type}");
            ChangeRecognizerStatus(RecognizerStatus.NotStarted);

            if (info.Type != DisconnectionType.ByServer) return;
            await Task.Delay(1000);
            
            Start(_language);
        });

        _client.Start();
    }   

    public void Stop()
    {
        _capture.Stop();
        _client.Stop(WebSocketCloseStatus.NormalClosure, "User request");
        _capture.OnDataReceived -= OnAudioData;
        ChangeRecognizerStatus(RecognizerStatus.NotStarted);
         
        Log.Information("\x1b[32m[BING] Bing recognizer has stopped");
    }
    
    public RecognizerStatus Status() => _status;

    private void OnAudioData(float[] samples)
    {
        var byteArray = new byte[samples.Length * 2]; 

        for (int i = 0; i < samples.Length; i++)
        {
            float sample = samples[i];
            if (sample > 1.0f) sample = 1.0f;
            if (sample < -1.0f) sample = -1.0f;
                    
            short shortSample = (short)(sample * short.MaxValue);
                    
            byteArray[i * 2] = (byte)(shortSample & 0xFF);
            byteArray[i * 2 + 1] = (byte)((shortSample >> 8) & 0xFF);
        }

        _bytesSend += byteArray.Length;
        _client.Send(CreateBinaryMessage("audio", $"{_streamIdCounter}", _currentRequestId, byteArray, null));
    }

    private async void RestartTurn()
    {
        if (!_client.IsRunning) return;

        _currentRequestId = GenerateUUID();
        _streamIdCounter++;

        if (_streamIdCounter >= RESTART_LIMIT)
        {
            Log.Verbose("\x1b[32m[BING] Stream ID counter limit has been reached. Restarting Bing recognizer...");
            
            Stop();
            Start(_language);

            return;
        }
        
        _capture.Pause();

        var bps = _capture.GetSampleRate() * 2;
        var secondsSent = _bytesSend / bps;
        var offset100ns = Math.Floor((decimal)(secondsSent * 10_000_000));

        var contextPayload = new
        {
            audio = new
            {
                streams = new Dictionary<string, object> 
                {
                    { "1", null }
                }
            },
            continuation = new
            {
                audio = new
                {
                    streams = new Dictionary<string, object>
                    {
                        { "1", new
                        {
                            offset = offset100ns.ToString() 
                        } }
                    }
                },
                previousServiceTag = _currentStreamTag
            }
        };
        
        _client.Send(CreateTextMessage("speech.context", JsonConvert.SerializeObject(contextPayload), "application/json", _currentRequestId));
        Log.Verbose("\x1b[32m[BING] Sent speech context");
        
        await Task.Delay(50);
        _client.Send(CreateBinaryMessage("audio", $"{_streamIdCounter}", _currentRequestId, CreateWavHeader(), "audio/x-wav"));
        Log.Verbose("\x1b[32m[BING] Sent wav header");
        
        await Task.Delay(25);
        _capture.Resume();
    }

    private void ChangeRecognizerStatus(RecognizerStatus status)
    {
        _status = status;
        OnRecognizerStatusChanged?.Invoke(status);
    }
    
    private (string, string) ParseWebsocketMessage(string msg)
    {
        var path = "";
        var lines = msg.Split("\n");
        var i = 0;

        for (;i < lines.Length; i++)
        {
            if (lines[i].Contains("Path:")) path = lines[i].Replace("Path:", "").Trim();
            if (lines[i].Contains('{')) break;
        }

        var jsonObj = "";

        for (; i < lines.Length; i++)
        {
            jsonObj += lines[i] + '\n';
        }

        return (path, jsonObj);
    }
    
    private string CreateTextMessage(string path, string body, string? contentType, string? requestId)
    {
        List<string> headers = [$"X-Timestamp:{GetTimestamp()}", $"Path:{path}"];

        if (requestId != null) headers.Add($"X-RequestId:{requestId}");
        if (contentType != null) headers.Add($"Content-Type:{contentType}");

        return $"{string.Join("\r\n", headers)}\r\n\r\n{body}";
    }
    private byte[] CreateBinaryMessage(string path, string? streamId, string requestId, byte[] data, string? contentType)
    {
        var headers = new List<string>
        {
            $"X-Timestamp:{GetTimestamp()}",
            $"Path:{path}",
            $"X-RequestId:{requestId}"
        };

        if (!string.IsNullOrEmpty(contentType)) headers.Add($"Content-Type:{contentType}");
        if (!string.IsNullOrEmpty(streamId)) headers.Add($"X-StreamId:{streamId}");

        string headerStr = string.Join("\r\n", headers);
        byte[] headerBytes = Encoding.UTF8.GetBytes(headerStr);
        ushort headerLen = (ushort)headerBytes.Length;

        byte[] result = new byte[2 + headerLen + data.Length];
        
        BinaryPrimitives.WriteUInt16BigEndian(result.AsSpan(0, 2), headerLen);
            
        Buffer.BlockCopy(headerBytes, 0, result, 2, headerLen);
        Buffer.BlockCopy(data, 0, result, 2 + headerLen, data.Length);

        return result;
    }
    private byte[] CreateWavHeader()
    {
        using var ms = new MemoryStream(44);
        using var writer = new BinaryWriter(ms, Encoding.ASCII);
    
        ushort channels = 1;
        ushort bitsPerSample = 16;
        ushort blockAlign = (ushort)(bitsPerSample / 8);
        int sampleRate = (int)_capture.GetSampleRate();
        int byteRate = sampleRate * (bitsPerSample / 8);
        
        writer.Write("RIFF"u8.ToArray());
        writer.Write(0u);
        writer.Write("WAVE"u8.ToArray());

        writer.Write("fmt "u8.ToArray());
        writer.Write(16u);
        writer.Write((ushort)1);
        writer.Write(channels);            
        writer.Write(sampleRate);          
        writer.Write(byteRate);            
        writer.Write(blockAlign);          
        writer.Write(bitsPerSample);       

        writer.Write("data"u8.ToArray());
        writer.Write(0u);

        return ms.ToArray();
    }
    
    private string GenerateUUID() => Guid.NewGuid().ToString().Replace("-", "");
    private string GenerateSecMsSec()
    {
        long ticks = DateTime.UtcNow.ToFileTimeUtc();
        long rounded = ticks - (ticks % 300_000_000L);

        string data = $"{rounded}{Constants.BING_TRUSTED_TOKEN}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(data));

        return Convert.ToHexString(hash);
    }
    private string GetTimestamp() => DateTime.UtcNow.ToString("yyyy-MM-ddTHH\\:mm\\:ssZ", CultureInfo.InvariantCulture);

    public void Dispose()
    {
        Stop();
        _client.Dispose();
    }
}