namespace KikitanTranslator.Photino.Handlers;

public class Quit : IHandler
{
    public async Task<string?>  OnDataReceived(string data)
    {
        Environment.Exit(0);

        return null;
    }
}