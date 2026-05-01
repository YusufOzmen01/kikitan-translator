using KikitanTranslator.Utility;
using Newtonsoft.Json;
using Serilog;

namespace KikitanTranslator.Photino.Handlers;

public class ConfigUpdate
{
    [JsonProperty("field")] public string Field;
    [JsonProperty("value")] public object Value;
}

public class UpdateConfig(Manager manager) : IHandler
{
    public string OnDataReceived(string data)
    {
        bool doNotRestart = false;
        
        var d = JsonConvert.DeserializeObject<ConfigUpdate>(data);
        if (d == null) return "";

        switch (d.Field)
        {
            case "language":
                AppConfig.ConfigObject.Language = (string) d.Value;
                doNotRestart = true;
                
                break;
            case "source_language":
                AppConfig.ConfigObject.SourceLanguage = (string) d.Value;
                
                break;
            case "target_language":
                AppConfig.ConfigObject.TargetLanguage = (string) d.Value;
                
                break;
            case "light_mode":
                AppConfig.ConfigObject.LightMode = (bool) d.Value;
                doNotRestart = true;
                
                break;
            case "speech_to_text_only":
                AppConfig.ConfigObject.SpeechToTextOnly = (bool) d.Value;
                
                break;
            case "microphone":
                AppConfig.ConfigObject.Microphone = (string) d.Value;
                
                break;
            case "translation_only":
                AppConfig.ConfigObject.TranslationOnly = (bool) d.Value;
                
                break;
            case "disable_when_muted":
                AppConfig.ConfigObject.DisableWhenMuted = (bool) d.Value;
                
                break;
            case "chatbox_wait_per_char_ms":
                AppConfig.ConfigObject.ChatboxWaitPerCharMs = Convert.ToInt32((long) d.Value);
                
                break;
            case "osc_port":
                AppConfig.ConfigObject.OscPort = Convert.ToInt32((long) d.Value);
                
                break;
            case "send_to_chatbox":
                AppConfig.ConfigObject.SendToChatbox = (bool) d.Value;
                
                break;
            case "send_user_data":
                AppConfig.ConfigObject.SendUserData = (bool) d.Value;
                
                break;
            case "recognizer":
                AppConfig.ConfigObject.Recognizer = Convert.ToInt32((long) d.Value);
                
                break;
            case "translator":
                AppConfig.ConfigObject.Translator = Convert.ToInt32((long) d.Value);
                
                break;
            case "desktop_translation":
                AppConfig.ConfigObject.DesktopTranslation = (bool) d.Value;
                
                break;
            case "quickstart_viewed":
                AppConfig.ConfigObject.QuickstartViewed = (bool) d.Value;
                doNotRestart = true;
                
                break;
            case "groq_api_key":
                AppConfig.ConfigObject.GroqApiKey = (string) d.Value;
                
                break;
            default:
                Log.Warning($"[CFG]  Received an unknown field {d.Field} with value {d.Value} while trying to update the config!");
                
                break;
        }
        
        if (!doNotRestart) manager.RestartIfRunning();

        return "";
    }
}