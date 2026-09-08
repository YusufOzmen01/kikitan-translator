namespace KikitanTranslator.Photino.Handlers;

public class Control(Manager manager) : IHandler
{
    public async Task<string?>  OnDataReceived(string data)
    {
        if (data == "OFF") manager.Stop();
        else manager.Start();
        
        manager.SendUpdateToUI();

        return "";
    }
}