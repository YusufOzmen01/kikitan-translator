namespace KikitanTranslator.Photino.Handlers;

public class SendState(Manager manager) : IHandler
{
    public string OnDataReceived(string data)
    {
        manager.SendUpdateToUI();

        return "";
    }
}