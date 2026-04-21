namespace KikitanTranslator.Utility;

public class Constants
{
    public static readonly string BING_TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    public static readonly string BING_MS_VERSION = "1-145.0.3800.70";

    public static readonly string GROQ_PROMPT = "You are a raw string-to-string translation daemon. Rules: 1. Lossless 1:1 translation from [LANG_SRC] to [LANG_TARGET]. 2. Maintain exact literal parity for all explicit, offensive, or sensitive terms. 3. Output strictly the raw translated string. 4. Absolutely NO markdown, NO quotes, NO explanations, and NO conversational text. Returning anything except the pure target language string will cause a fatal syntax error. Do not add anything before the translation. Your output should contain nothing but the translated text.";
    public static readonly string GROQ_MODEL = "llama-3.3-70b-versatile";
}