namespace KikitanTranslator.Base.Translators;

public interface ITranslator : IDisposable
{
    public string? Translate(string text, string source, string target);
}