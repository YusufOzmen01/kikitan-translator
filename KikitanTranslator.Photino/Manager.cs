using KikitanTranslator.Base;
using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Capture;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Structs;

namespace KikitanTranslator.Photino;

public delegate void OnKikitanData(string recognized, string translated, bool final);

public class Manager
{
    private Kikitan? _microphoneKikitan;
    private Kikitan? _desktopKikitan;

    private ITranslator _translator;

    private bool _running;

    public event OnKikitanData? OnMicrophoneData;

    public Manager()
    {
        _translator = new GoogleTranslate();
    }

    public DeviceInfo[] GetMicrophones() => new MiniAudioEngine().CaptureDevices;
    
    public void Start()
    {
        IRecognizer r;
        if (AppConfig.ConfigObject.Recognizer == 0) r = new Bing(new Microphone());
        else r = new Bing(new Microphone()); // TODO: Use another one
        
        _microphoneKikitan = new Kikitan(r, _translator);
        _microphoneKikitan.AddOutput(new Custom((recognized, translated, final) => OnMicrophoneData?.Invoke(recognized, translated, final)));
        if (AppConfig.ConfigObject.SendToChatbox)
        {
            _microphoneKikitan.AddOutput(new OSC());
        } // TODO: Data out via OSC for other apps
        
        _microphoneKikitan.Start();

        _running = true;

        // if (_desktopKikitan != null) _desktopKikitan.Start();
    }

    public void Stop()
    {
        if (_microphoneKikitan != null)
        {
            _microphoneKikitan.Dispose();
        }
        
        _running = false;
        
        // if (_desktopKikitan != null) _desktopKikitan.Stop();
    }

    public async void RestartIfRunning()
    {
        if (_running)
        {
            Stop();

            await Task.Delay(500);
            
            Start();
        }
    }

    public void ManualTranslate(string text) => _microphoneKikitan?.ManualTranslate(text);
}