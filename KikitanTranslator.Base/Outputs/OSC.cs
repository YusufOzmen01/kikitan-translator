using BuildSoft.VRChat.Osc;
using BuildSoft.VRChat.Osc.Chatbox;
using KikitanTranslator.Utility;
using Serilog;

namespace KikitanTranslator.Base.Outputs;

public class OSC : IOutput
{
    public OSC() => OscConnectionSettings.SendPort = AppConfig.ConfigObject.OscPort;
    
    public void Send(string recognized, string translated, bool final)
    {
        try
        {
            OscChatbox.SetIsTyping(!final);
            if (!final) return;

            if (AppConfig.ConfigObject.TranslationOnly) OscChatbox.SendMessage(translated, true);
            else OscChatbox.SendMessage($"{translated} ({recognized})", true);
        } catch (Exception e)
        {
            Log.Error($"[OSC]  Error sending OSC message! Reason: {e}");
        }
    }

    public bool IsDelayed() => true;
}