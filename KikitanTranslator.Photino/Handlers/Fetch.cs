using Serilog;

namespace KikitanTranslator.Photino.Handlers;

public class Fetch : IHandler
{
    public async Task<string?> OnDataReceived(string data)
    {
        try
        {
            return await new HttpClient().GetStringAsync(data);
        } catch (Exception e)
        {
            Log.Error($"[MSGH] Error when fetching from url {data}!: {e}");

            return "";
        }
    }
}