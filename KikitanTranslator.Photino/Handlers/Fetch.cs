namespace KikitanTranslator.Photino.Handlers;

public class Fetch : IHandler
{
    public string? OnDataReceived(string data)
    {
        using var client = new HttpClient();

        try
        {
            string resp = client.GetStringAsync(data).GetAwaiter().GetResult();

            return resp;
        }
        catch (HttpRequestException e)
        {
            return $"ERR: {e}";
        }
    }
}