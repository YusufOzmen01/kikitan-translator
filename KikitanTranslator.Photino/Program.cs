using System.Drawing;
using KikitanTranslator.Base;
using KikitanTranslator.Photino;
using KikitanTranslator.Photino.Handlers;
using KikitanTranslator.Utility;
using Newtonsoft.Json;
using Photino.NET;
using Photino.NET.Server;
using SoundFlow.Backends.MiniAudio;
using SoundFlow.Backends.MiniAudio.Enums;
using SoundFlow.Structs;

public class ConfigUpdate
{
    [JsonProperty("config")] public ConfigObject Config;
}

public class RecognitionData
{
    [JsonProperty("transcription")] public string Transcription;
    [JsonProperty("translation")] public string Translation;
    [JsonProperty("final")] public bool Final;
}

public class Program
{
    private static readonly int width = 900, height = 550;
    
    [STAThread]
    public static void Main(string[] args)
    {
#if DEBUG
        string appUrl = "http://localhost:1420";
#else
        PhotinoServer.CreateStaticFileServer(args, out string baseUrl).RunAsync();
        
        string appUrl = $"{"asd"}/index.html";
#endif
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Logger.Initialize();
        AppConfig.Load();
        
        var manager = new Manager();
        var messageHandler = new MessageHandler();
        
        messageHandler.RegisterHandler("get_microphones", new GetMicrophones(manager));
        messageHandler.RegisterHandler("manual_translate", new ManualTranslate(manager));
        messageHandler.RegisterHandler("control", new Control(manager));
        messageHandler.RegisterHandler("update_config", new UpdateConfig(manager));
        messageHandler.RegisterHandler("get_config", new GetConfig());
        
        string windowTitle = "Kikitan Translator";

        PhotinoWindow? wSender = null;

        var window = new PhotinoWindow()
            .SetTitle(windowTitle)
            .SetUseOsDefaultSize(false)
            .SetMinSize(width, height)
            .SetIconFile("wwwroot/kikitan_logo.ico")
            .SetSize(new Size(width, height))
            .Center()
            .SetResizable(true)
            .SetLogVerbosity(0)
            .RegisterWebMessageReceivedHandler((sender, s) =>
            {
                wSender = (PhotinoWindow)sender!;
                

                messageHandler.HandleMessage(wSender, s);
            })
            .Load(appUrl);

        manager.OnMicrophoneData += (recognized, translated, final) => wSender?.SendWebMessage(JsonConvert.SerializeObject(new Message
        {
            Method = "recognition",
            Data = JsonConvert.SerializeObject(new RecognitionData { Transcription = recognized, Translation = translated, Final = final })
        }));
        
        manager.OnRecognizerStatusData += status => wSender?.SendWebMessage(JsonConvert.SerializeObject(new Message
        {
            Method = "status",
            Data = JsonConvert.SerializeObject(new
            {
                status = status
            })
        }));

        Task.Run(() =>
        {
            var engine = new MiniAudioEngine(backendPriority:[MiniAudioBackend.Wasapi, MiniAudioBackend.Oss]);

            List<Mic> mics = new();

            while (true)
            {
                engine.UpdateAudioDevicesInfo();
                foreach (var mic in engine.CaptureDevices)
                {
                    mics.Add(new Mic { Name = mic.Name, Default = mic.IsDefault});
                }

                wSender?.SendWebMessage(JsonConvert.SerializeObject(new Message { Method = "microphone_list", Data = JsonConvert.SerializeObject(mics.ToArray()) }));
                mics.Clear();

                Task.Delay(500);
            }
        });
        
        window.WaitForClose();
    }
}