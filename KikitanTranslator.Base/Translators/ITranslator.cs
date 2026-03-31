namespace KikitanTranslator.Base.Translators;

public interface ITranslator
{
    public string? Translate(string text, string source, string target);
}