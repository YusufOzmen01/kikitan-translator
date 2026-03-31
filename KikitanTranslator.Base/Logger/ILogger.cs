namespace KikitanTranslator.Logger;

public interface ILogger
{
    public void Info(string message);
    public void Warning(string message);
    public void Error(string message);
}