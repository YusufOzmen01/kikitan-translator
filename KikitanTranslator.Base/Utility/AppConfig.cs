using System.ComponentModel;
using System.Runtime.CompilerServices;
using Newtonsoft.Json;
using Serilog;

namespace KikitanTranslator.Utility;

public class ConfigObject : INotifyPropertyChanged
{
    [JsonProperty("quickstart_viewed")] private bool _quickstartViewed;

    [JsonIgnore]
    public bool QuickstartViewed
    {
        get => _quickstartViewed;
        set
        {
            if (_quickstartViewed != value)
            {
                _quickstartViewed = value;
                OnPropertyChanged();
            }
        }
    }
    
    [JsonProperty("language")] private string _language = "en";

    [JsonIgnore]
    public string Language
    {
        get => _language;
        set
        {
            if (_language != value)
            {
                _language = value;
                OnPropertyChanged();
            }
        }
    }
    
    [JsonProperty("source_language")] private string _sourceLanguage = "en";

    [JsonIgnore]
    public string SourceLanguage
    {
        get => _sourceLanguage;
        set
        {
            if (_sourceLanguage != value)
            {
                _sourceLanguage = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("target_language")] private string _targetLanguage = "ja";

    [JsonIgnore]
    public string TargetLanguage
    {
        get => _targetLanguage;
        set
        {
            if (_targetLanguage != value)
            {
                _targetLanguage = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("light_mode")] private bool _lightMode = false;

    [JsonIgnore]
    public bool LightMode
    {
        get => _lightMode;
        set
        {
            if (_lightMode != value)
            {
                _lightMode = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("speech_to_text_only")] private bool _speechToTextOnly = false;

    [JsonIgnore]
    public bool SpeechToTextOnly
    {
        get => _speechToTextOnly;
        set
        {
            if (_speechToTextOnly != value)
            {
                _speechToTextOnly = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("microphone")] private string _microphone = string.Empty;

    [JsonIgnore]
    public string Microphone
    {
        get => _microphone;
        set
        {
            if (_microphone != value)
            {
                _microphone = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("translation_only")] private bool _translationOnly = false;

    [JsonIgnore]
    public bool TranslationOnly
    {
        get => _translationOnly;
        set
        {
            if (_translationOnly != value)
            {
                _translationOnly = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("disable_when_muted")] private bool _disableWhenMuted = false;

    [JsonIgnore]
    public bool DisableWhenMuted
    {
        get => _disableWhenMuted;
        set
        {
            if (_disableWhenMuted != value)
            {
                _disableWhenMuted = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("chatbox_wait_per_char_ms")] private int _chatboxWaitPerCharMs = 30;

    [JsonIgnore]
    public int ChatboxWaitPerCharMs
    {
        get => _chatboxWaitPerCharMs;
        set
        {
            if (_chatboxWaitPerCharMs != value)
            {
                _chatboxWaitPerCharMs = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("osc_port")] private int _oscPort = 9000;

    [JsonIgnore]
    public int OscPort
    {
        get => _oscPort;
        set
        {
            if (_oscPort != value)
            {
                _oscPort = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("send_to_chatbox")] private bool _sendToChatbox = true;

    [JsonIgnore]
    public bool SendToChatbox
    {
        get => _sendToChatbox;
        set
        {
            if (_sendToChatbox != value)
            {
                _sendToChatbox = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("send_user_data")] private bool _sendUserData = false;

    [JsonIgnore]
    public bool SendUserData
    {
        get => _sendUserData;
        set
        {
            if (_sendUserData != value)
            {
                _sendUserData = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("recognizer")] private int _recognizer = 0;

    [JsonIgnore]
    public int Recognizer
    {
        get => _recognizer;
        set
        {
            if (_recognizer != value)
            {
                _recognizer = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("translator")] private int _translator = 0;

    [JsonIgnore]
    public int Translator
    {
        get => _translator;
        set
        {
            if (_translator != value)
            {
                _translator = value;
                OnPropertyChanged();
            }
        }
    }

    [JsonProperty("desktop_translation")] private bool _desktopTranslation = false;

    [JsonIgnore]
    public bool DesktopTranslation
    {
        get => _desktopTranslation;
        set
        {
            if (_desktopTranslation != value)
            {
                _desktopTranslation = value;
                OnPropertyChanged();
            }
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

public delegate void OnConfigUpdate();

public static class AppConfig
{
    public static ConfigObject ConfigObject;
    public static event OnConfigUpdate? OnUpdate;
    private static string _currentConfigPath;

    public static string GetAppFolder()
    {
        string basePath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string appFolder = Path.Combine(basePath, "Kikitan Translator");
        Directory.CreateDirectory(appFolder);

        return appFolder;
    }

    public static void Load() => Load(Path.Join(GetAppFolder(), "config.json"));

    public static void Load(string configPath)
    {
        if (!Path.Exists(configPath))
        {
            Log.Warning("\x1b[35m[CFG]  Specified path is nonexistent (perhaps first launch?). Using the default configuration");

            ConfigObject = new ConfigObject();
            ConfigObject.PropertyChanged += OnConfigPropertyChanged;
            _currentConfigPath = configPath;
            
            SaveConfig();

            return;
        }

        try
        {
            ConfigObject? cfg = JsonConvert.DeserializeObject<ConfigObject>(File.ReadAllText(configPath));
            if (cfg == null)
            {
                Log.Error("\x1b[35m[CFG]  Deserialization result returned null!");

                return;
            }

            ConfigObject = cfg;
            ConfigObject.PropertyChanged += OnConfigPropertyChanged;
            _currentConfigPath = configPath;
            
            Log.Information($"\x1b[35m[CFG]  Loaded from {configPath}");
        }
        catch (Exception e)
        {
            Log.Error($"\x1b[35m[CFG]  Error occured while trying to load the config file!: {e}");

            return;
        }
    }
    
    public static void SaveConfig() {
        File.WriteAllText(_currentConfigPath, JsonConvert.SerializeObject(ConfigObject, Formatting.Indented));
        
        Log.Verbose($"\x1b[35m[CFG]  Saved to {_currentConfigPath}");
    }

    private static void OnConfigPropertyChanged(object sender, PropertyChangedEventArgs e)
    {
        SaveConfig();
        
        OnUpdate?.Invoke();   
    }
}