using KikitanTranslator.Base;
using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Capture;
using KikitanTranslator.Photino.Handlers;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;
using Newtonsoft.Json;
using Photino.NET;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Backends.MiniAudio.Enums;
using SoundFlow.Structs;

namespace KikitanTranslator.Photino;

public delegate void OnKikitanData(string recognized, string translated, bool final);

public class Mic
{
    [JsonProperty("name")] public string Name;
    [JsonProperty("default")] public bool Default;
}

public class AppState
{
    [JsonProperty("microphones")] public Mic[] Microphones;
    [JsonProperty("config")] public ConfigObject Config;
    [JsonProperty("status")] public int Status;
}

public class RecognitionData
{
    [JsonProperty("transcription")] public string Transcription;
    [JsonProperty("translation")] public string Translation;
    [JsonProperty("final")] public bool Final;
}

public class Manager
{
    private Kikitan? _microphoneKikitan;
    private Kikitan? _desktopKikitan;

    private ITranslator _translator;
    #if DEBUG
    private Microphone _mic = new("Resources/wwwroot/silero_vad.onnx");
    #else 
    private Microphone _mic = new("wwwroot/silero_vad.onnx");
    #endif
    private AppState _appState = new () { Microphones = [] };
    private bool _running;

    public PhotinoWindow? WindowHandle;

    public DeviceInfo[] GetMicrophones() => _mic.GetCaptureDevices();

    public Manager()
    {
        _appState.Config = AppConfig.ConfigObject;
        
        AppConfig.OnUpdate += () =>
        {
            _appState.Config = AppConfig.ConfigObject;

            SendUpdateToUI();
        };
        
        Task.Run(() =>
        {
            var engine = new MiniAudioEngine(backendPriority: [MiniAudioBackend.Wasapi, MiniAudioBackend.Oss]);

            List<Mic> mics = new();

            while (true)
            {
                engine.UpdateAudioDevicesInfo();
                foreach (var mic in engine.CaptureDevices)
                {
                    mics.Add(new Mic { Name = mic.Name, Default = mic.IsDefault });
                }
                
                if (_appState.Microphones.Length != 0 && mics.Count != _appState.Microphones.Length)
                {
                    _appState.Microphones = mics.ToArray();
                    
                    SendUpdateToUI();
                }

                if (!mics.Exists(m => m.Name == _appState.Config.Microphone))
                {
                    SendMicChanged();
                    RestartIfRunning();
                }
                
                _appState.Microphones = mics.ToArray();
                
                mics.Clear();

                Task.Delay(500);
            }
        });
    }

    public void Start()
    {
        if (_running)
        {
            RestartIfRunning();

            return;
        }

        IRecognizer r;
        if (AppConfig.ConfigObject.Recognizer == 0) r = new Bing(_mic);
        else r = new GroqRecognizer(_mic);

        if (AppConfig.ConfigObject.Translator == 0) _translator = new GoogleTranslate();
        else _translator = new GroqTranslator();

        _microphoneKikitan = new Kikitan(r, _translator);
        _microphoneKikitan.AddOutput(new Custom(SendRecognitionData));
        if (AppConfig.ConfigObject.SendToChatbox)
            _microphoneKikitan.AddOutput(new OSC()); // TODO: Data out via OSC for other apps

        _microphoneKikitan.OnRecognizerStatusChanged += s =>
        {
            _appState.Status = (int)s;
            
            SendUpdateToUI();
        };
        _microphoneKikitan.Start();

        _running = true;

        // if (_desktopKikitan != null) _desktopKikitan.Start();
        SendUpdateToUI();
    }

    public void Stop()
    {
        if (_microphoneKikitan != null)
        {
            _microphoneKikitan.Dispose();
        }

        _running = false;

        // if (_desktopKikitan != null) _desktopKikitan.Stop();
        SendUpdateToUI();
    }

    public async void RestartIfRunning()
    {
        if (_running)
        {
            Stop();

            await Task.Delay(100);

            Start();
        }
        
        SendUpdateToUI();
    }

    public void ManualTranslate(string text) => _microphoneKikitan?.ManualTranslate(text);

    public void SendUpdateToUI()
    {
        WindowHandle?.SendWebMessage(
            JsonConvert.SerializeObject(new Message
            {
                Method = "state",
                Data = JsonConvert.SerializeObject(_appState)
            }));
    }

    private void SendRecognitionData(string recognized, string translated, bool final)
    {
        WindowHandle?.SendWebMessage(
            JsonConvert.SerializeObject(new Message
            {
                Method = "recognition",
                Data = JsonConvert.SerializeObject(new RecognitionData { Transcription = recognized, Translation = translated, Final = final })
            }));
    }

    private void SendMicChanged()
    {
        WindowHandle?.SendWebMessage(
            JsonConvert.SerializeObject(new Message
            {
                Method = "mic_changed",
                Data = ""
            }));
    }
        
}