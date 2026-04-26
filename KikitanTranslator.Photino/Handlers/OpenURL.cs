using System.Diagnostics;

namespace KikitanTranslator.Photino.Handlers;

public class OpenURL : IHandler
{
    public string OnDataReceived(string data)
    {
        if (!data.StartsWith("https://") || !(data.Contains("buymeacoffee.com") || data.Contains("booth.pm") || data.Contains("github.com") || data.Contains("twitter.com") || data.Contains("discord.gg"))) return null;

        Process.Start(new ProcessStartInfo
        {
            FileName = data,
            UseShellExecute = true
        });
        
        return null;
    }
}