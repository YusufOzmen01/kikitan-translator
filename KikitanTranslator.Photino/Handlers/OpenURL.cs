using System.Diagnostics;
using KikitanTranslator.Utility;

namespace KikitanTranslator.Photino.Handlers;

public class OpenURL : IHandler
{
    public async Task<string?> OnDataReceived(string data)
    {
        if (data == "LOGFILES")
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = Path.Combine([AppConfig.GetAppFolder(), "logs"]) + "\\",
                UseShellExecute = true,
                Verb = "open"
            });

            return null;
        }
        
        if (!data.StartsWith("https://") || !(data.Contains("buymeacoffee.com") || data.Contains("booth.pm") ||
                                               data.Contains("github.com") || data.Contains("twitter.com") ||
                                               data.Contains("discord.gg"))) return null;

        Process.Start(new ProcessStartInfo
        {
            FileName = data,
            UseShellExecute = true
        });

        return null;
    }
}