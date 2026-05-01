using System.Drawing;
using KikitanTranslator.Base;
using KikitanTranslator.Photino;
using KikitanTranslator.Photino.Handlers;
using KikitanTranslator.Utility;
using Photino.NET;
using Photino.NET.Server;
using Serilog;
using Velopack;
using Velopack.Sources;

public class Program
{
    private static readonly int width = 900, height = 600;

    [STAThread]
    public static void Main(string[] args)
    {
#if DEBUG
        string appUrl = "http://localhost:1420";
#else
        PhotinoServer.CreateStaticFileServer(args, out string baseUrl).RunAsync();
        string appUrl = $"{baseUrl}/index.html";
#endif
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Logger.Initialize();
        AppConfig.Load();
        
        VelopackApp.Build().Run();

        bool noUI = Array.Exists(args, e => e.Trim().Contains("--no-ui"));

        var connector = new Connector();
        var manager = new Manager(noUI, connector);
        var messageHandler = new MessageHandler();

        messageHandler.RegisterHandler("manual_translate", new ManualTranslate(manager));
        messageHandler.RegisterHandler("control", new Control(manager));
        messageHandler.RegisterHandler("update_config", new UpdateConfig(manager));
        messageHandler.RegisterHandler("send_app_state", new SendState(manager));
        messageHandler.RegisterHandler("quit", new Quit());
        messageHandler.RegisterHandler("open_url", new OpenURL());
        messageHandler.RegisterHandler("update", new UpdateApp());
        messageHandler.RegisterHandler("fetch", new Fetch());

        if (noUI)
        {
            connector.OnConnectorData += messageHandler.HandleMessage;

            Log.Information("[APP] No UI requested, starting the websocket");
            connector.StartWebsocket();

            Task.Run(() =>
            {
                while (true) Task.Delay(1000);
            }).GetAwaiter().GetResult();
        }

        string windowTitle = "Kikitan Translator";

        var window = new PhotinoWindow()
            .SetTitle(windowTitle)
            .SetUseOsDefaultSize(false)
            .SetMinSize(width, height)
#if DEBUG
            .SetIconFile("Resources/wwwroot/kikitan_logo.ico")
#else
            .SetIconFile("wwwroot/kikitan_logo.ico")
#endif
            .SetSize(new Size(width, height))
            .Center()
            .SetResizable(true)
            .SetLogVerbosity(0)
            .RegisterWebMessageReceivedHandler((sender, s) =>
            {
                connector.WindowHandle = (PhotinoWindow)sender!;

                messageHandler.HandleMessage(s, connector);
            })
            .Load(appUrl);

        window.WaitForClose();
    }
}