using System.Drawing;
using KikitanTranslator.Base;
using KikitanTranslator.Photino;
using KikitanTranslator.Photino.Handlers;
using KikitanTranslator.Utility;
using Photino.NET;
using Photino.NET.Server;

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
        string appUrl = $"{baseUrl}/index.html";
#endif
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        Logger.Initialize();
        AppConfig.Load();

        var manager = new Manager();
        var messageHandler = new MessageHandler();
        
        messageHandler.RegisterHandler("manual_translate", new ManualTranslate(manager));
        messageHandler.RegisterHandler("control", new Control(manager));
        messageHandler.RegisterHandler("update_config", new UpdateConfig(manager));
        messageHandler.RegisterHandler("send_app_state", new SendState(manager));

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
                manager.WindowHandle = (PhotinoWindow)sender!;


                messageHandler.HandleMessage(manager.WindowHandle, s);
            })
            .Load(appUrl);

        window.WaitForClose();
    }
}
