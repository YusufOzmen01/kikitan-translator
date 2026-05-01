namespace KikitanTranslator.Photino.Handlers;

public class Fetch : IHandler
{
    public async Task<string?> OnDataReceived(string data) => await new HttpClient().GetStringAsync(data);
}