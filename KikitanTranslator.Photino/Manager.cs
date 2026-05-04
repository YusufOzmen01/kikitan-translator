using System.Diagnostics;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using KikitanTranslator.Base;
using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Capture;
using KikitanTranslator.Photino.Handlers;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;
using Newtonsoft.Json;
using Photino.NET;
using Serilog;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Backends.MiniAudio.Enums;
using SoundFlow.Structs;
using Velopack;
using Velopack.Locators;
using Velopack.Sources;

namespace KikitanTranslator.Photino;

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
    [JsonProperty("app_version")] public string AppVersion = "Developer Build";
    [JsonProperty("server_version")] public string ServerVersion = "Developer Build";
    [JsonProperty("is_linux")] public bool IsLinux;
    [JsonProperty("is_appimage")] public bool IsAppimage;
}

public class RecognitionData
{
    [JsonProperty("transcription")] public string Transcription;
    [JsonProperty("translation")] public string Translation;
    [JsonProperty("final")] public bool Final;
}

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct OverlayState
{
    public bool NoLanguageSpace;
    public int Time;

    private const int TextMaxChars = 256;

    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = TextMaxChars)]
    public string Text;
}

public class Manager
{
    private Kikitan? _microphoneKikitan;
    private Kikitan? _desktopKikitan;

    private ITranslator _translator;
    #if DEBUG
    private Loopback _loopback = new("Resources/wwwroot/silero_vad.onnx");
    private Microphone _mic = new("Resources/wwwroot/silero_vad.onnx");
    #else 
    private Loopback _loopback = new(Path.Combine(AppContext.BaseDirectory, "wwwroot", "silero_vad.onnx"));
    private Microphone _mic = new(Path.Combine(AppContext.BaseDirectory, "wwwroot", "silero_vad.onnx"));
    #endif
    private AppState _appState = new () { Microphones = [] };
    private bool _running;

    private OverlayWriter _writer;

    private Connector _connector;

    public DeviceInfo[] GetMicrophones() => _mic.GetCaptureDevices();

    public Manager(bool noUI, Connector connector)
    {
        _appState.Config = AppConfig.ConfigObject;
        #if !DEBUG
        _appState.AppVersion = VelopackLocator.Current.CurrentlyInstalledVersion?.ToString();
        #endif
        _appState.IsLinux = !RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
        _appState.IsAppimage = _appState.IsLinux && Environment.GetEnvironmentVariable("KIKITAN_NOT_APPIMAGE") == null;
        _connector = connector;

        Task.Run(async () =>
        {
            var mgr = new UpdateManager(new GithubSource("https://github.com/YusufOzmen01/kikitan-translator", null, true));

            var newVersion = await mgr.CheckForUpdatesAsync();
            _appState.ServerVersion = newVersion?.TargetFullRelease.Version.ToString();
            
            SendUpdateToUI();
        });
        
        AppConfig.OnUpdate += () =>
        {
            _appState.Config = AppConfig.ConfigObject;

            SendUpdateToUI();
        };

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows) && !noUI)
        {
            _writer = new();
            
            if (!Path.Exists("KikitanTranslator.Overlay.exe"))
            {
                Log.Warning("Kikitan Overlay doesn't exist! Perhaps a debug build?");
            }
            else
            {
                Process proc = new Process();
                proc.StartInfo.FileName = "KikitanTranslator.Overlay.exe";
                proc.StartInfo.CreateNoWindow = true;
                proc.StartInfo.UseShellExecute = false;
                proc.Start();
            }
        }
        
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

                if (_appState.Config.Microphone.Length != 0 && !mics.Exists(m => m.Name == _appState.Config.Microphone))
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

        IRecognizer rMic;
        if (AppConfig.ConfigObject.Recognizer == 0) rMic = new Bing(_mic);
        else rMic = new GroqRecognizer(_mic);

        if (AppConfig.ConfigObject.Translator == 0) _translator = new GoogleTranslate();
        else _translator = new GroqTranslator();

        _microphoneKikitan = new Kikitan(rMic, _translator, false);
        _microphoneKikitan.AddOutput(new Custom(SendRecognitionData));
        if (AppConfig.ConfigObject.SendToChatbox)
            _microphoneKikitan.AddOutput(new OSC()); // TODO: Data out via OSC for other apps
        
        _microphoneKikitan.OnRecognizerStatusChanged += s =>
        {
            _appState.Status = (int)s;
            
            SendUpdateToUI();
        };
        
        _microphoneKikitan.Start();

        if (AppConfig.ConfigObject.DesktopTranslation && !_appState.IsLinux)
        {
            IRecognizer rDesktop;
            
            if (AppConfig.ConfigObject.Recognizer == 0) rDesktop = new Bing(_loopback);
            else rDesktop = new GroqRecognizer(_loopback);
            
            _desktopKikitan = new Kikitan(rDesktop, _translator, true);
            _desktopKikitan.AddOutput(new Custom((recognized, translated, final) =>
            {
                var text = AppConfig.ConfigObject.SpeechToTextOnly ? recognized : translated;
                var time = text.Length * AppConfig.ConfigObject.ChatboxWaitPerCharMs;

                if (text.Length == 0) return;
            
                _writer.Write(new OverlayPipeData { Text = text, NoLanguageSpace = AppConfig.ConfigObject.TargetLanguage == "ja" || AppConfig.ConfigObject.TargetLanguage == "ko" || AppConfig.ConfigObject.TargetLanguage == "cn", Time = time < 5000 ? 5000 : time});
            }));
            
            _desktopKikitan?.Start();
        }
        
        _running = true;
        SendUpdateToUI();
    }

    public void Stop()
    {
        _microphoneKikitan?.Dispose();
        _desktopKikitan?.Dispose();

        _running = false;
        
        SendUpdateToUI();
    }

    public async void RestartIfRunning()
    {
        if (_running)
        {
            _appState.Status = 1;
            Stop();

            await Task.Delay(100);

            Start();
        }
        
        SendUpdateToUI();
    }

    public void ManualTranslate(string text) => _microphoneKikitan?.ManualTranslate(text);

    public void SendUpdateToUI()
    {
        _connector.Send(
            JsonConvert.SerializeObject(new Message
            {
                Method = "state",
                Data = JsonConvert.SerializeObject(_appState)
            }));
    }

    private void SendRecognitionData(string recognized, string translated, bool final)
    {
        _connector.Send(
            JsonConvert.SerializeObject(new Message
            {
                Method = "recognition",
                Data = JsonConvert.SerializeObject(new RecognitionData { Transcription = recognized, Translation = translated, Final = final })
            }));
    }

    private void SendMicChanged()
    {
        _connector.Send(
            JsonConvert.SerializeObject(new Message
            {
                Method = "mic_changed",
                Data = ""
            }));
    }
        
}