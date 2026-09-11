using KikitanTranslator.Utility;
using Serilog;
using Serilog.Events;

namespace KikitanTranslator.Base;

public static class Logger
{
    public static void Initialize(bool overrideDebug)
    {
        var logPath = Path.Combine([
            AppConfig.GetAppFolder(), "logs", $"{DateTime.Now:yyyy-MM-ddTHH\\-mm\\-ssZ}.log"
        ]);

        var cfg = new LoggerConfiguration()
            .WriteTo.File(logPath,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.Console()
            #if DEBUG
            .MinimumLevel.Verbose()
            #endif
            ;

        if (overrideDebug) Log.Logger = cfg.MinimumLevel.Verbose().CreateLogger();
        else Log.Logger = cfg.CreateLogger();
        
        Log.Information("Logger has been initialized!");
    }
}