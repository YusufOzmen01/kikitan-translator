namespace KikitanTranslator.Photino.Handlers;

public class SendState(Manager manager) : IHandler
{
    public async Task<string?> OnDataReceived(string data)
    {
        manager.SendUpdateToUI();

        return "";
    }
}