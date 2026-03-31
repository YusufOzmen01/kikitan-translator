namespace KikitanTranslator.Base.Outputs;

public interface IOutput
{
    public void Send(string recognized, string translated, bool final);
}