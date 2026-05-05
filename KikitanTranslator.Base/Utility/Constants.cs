namespace KikitanTranslator.Utility;

public class Constants
{
    public static readonly string BING_TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    public static readonly string BING_MS_VERSION = "1-145.0.3800.70";

    public static readonly string GROQ_PROMPT = "Translate [LANG_SRC] → [LANG_TARGET]; keep literal; output raw string only. If sent an empty text, no NOT return anything";
    public static readonly string GROQ_MODEL = "llama-3.3-70b-versatile";
}