using KikitanTranslator.Utility;
using Serilog;

namespace KikitanTranslator.Base;

public static class Logger
{
    public static void Initialize()
    {
        var logsDirectory = Path.Combine(AppConfig.GetAppFolder(), "logs");
        Directory.CreateDirectory(logsDirectory);

        var logPath = Path.Combine([
            logsDirectory, $"{DateTime.Now:yyyy-MM-ddTHH\\-mm\\-ss.fffffffZ}.log"
        ]);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Verbose()
            .WriteTo.File(logPath,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.Console()
            .CreateLogger();

        Log.Information("Logger has been initialized!");
        
        try
        {
            var oldLogs = new DirectoryInfo(logsDirectory).GetFiles("*.log")
                .Where(file => !string.Equals(file.FullName, logPath, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(file => file.LastWriteTimeUtc)
                .ThenByDescending(file => file.Name)
                .Skip(6);

            foreach (var file in oldLogs)
            {
                try
                {
                    file.Delete();
                }
                catch (Exception e) when (e is IOException or UnauthorizedAccessException)
                {
                    Log.Warning(e, $"Unable to delete old log file: {file.Name}");
                }
            }
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            Log.Warning(e, "Unable to enumerate old log files for cleanup");
        }
    }
}
