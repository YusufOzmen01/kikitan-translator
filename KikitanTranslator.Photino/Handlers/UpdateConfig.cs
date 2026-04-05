using KikitanTranslator.Utility;
using Newtonsoft.Json;

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
        var d = JsonConvert.DeserializeObject<ConfigUpdate>(data);
        if (d == null) return "";

        switch (d.Field)
        {
            case "language":
                AppConfig.ConfigObject.Language = (string) d.Value;
                
                break;
            case "source_language":
                AppConfig.ConfigObject.SourceLanguage = (string) d.Value;
                
                break;
            case "target_language":
                AppConfig.ConfigObject.TargetLanguage = (string) d.Value;
                
                break;
            case "light_mode":
                AppConfig.ConfigObject.LightMode = (bool) d.Value;
                
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
                AppConfig.ConfigObject.ChatboxWaitPerCharMs = (int) d.Value;
                
                break;
            case "osc_port":
                AppConfig.ConfigObject.OscPort = (int) d.Value;
                
                break;
            case "send_to_chatbox":
                AppConfig.ConfigObject.SendToChatbox = (bool) d.Value;
                
                break;
            case "send_user_data":
                AppConfig.ConfigObject.SendUserData = (bool) d.Value;
                
                break;
            case "recognizer":
                AppConfig.ConfigObject.Recognizer = (int) d.Value;
                
                break;
            case "translator":
                AppConfig.ConfigObject.Translator = (int) d.Value;
                
                break;
            case "desktop_translation":
                AppConfig.ConfigObject.DesktopTranslation = (bool) d.Value;
                
                break;
            case "swap_languages":
            {
                (AppConfig.ConfigObject.SourceLanguage, AppConfig.ConfigObject.TargetLanguage) = (AppConfig.ConfigObject.TargetLanguage, AppConfig.ConfigObject.SourceLanguage);

                break;
            }
        }
        
        manager.RestartIfRunning();

        return "";
    }
}