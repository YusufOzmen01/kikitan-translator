namespace KikitanTranslator.Photino.Handlers;

public class ManualTranslate(Manager manager) : IHandler
{
    public async Task<string?> OnDataReceived(string data)
    {
        manager.ManualTranslate(data);
        
        return "";
    }
}