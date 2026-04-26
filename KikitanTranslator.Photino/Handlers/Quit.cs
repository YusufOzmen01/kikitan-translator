namespace KikitanTranslator.Photino.Handlers;

public class Quit : IHandler
{
    public string OnDataReceived(string data)
    {
        Environment.Exit(0);

        return null;
    }
}