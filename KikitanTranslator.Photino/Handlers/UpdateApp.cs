using Velopack;
using Velopack.Sources;

namespace KikitanTranslator.Photino.Handlers;

public class UpdateApp : IHandler
{
    public async Task<string?> OnDataReceived(string data)
    {
        Task.Run(async () =>
        {
            var mgr = new UpdateManager(new GithubSource("https://github.com/YusufOzmen01/kikitan-translator", null,
                true));

            var newVersion = await mgr.CheckForUpdatesAsync();
            Console.WriteLine(newVersion);
            if (newVersion != null)
            {
                await mgr.DownloadUpdatesAsync(newVersion);

                mgr.ApplyUpdatesAndRestart(newVersion);
            }
        });

        return null;
    }
}