namespace KikitanTranslator.Base.Outputs;

public delegate void OnData(string recognized, string translated, bool final);

public class Custom(OnData onData) : IOutput
{
    public void Send(string recognized, string translated, bool final) => onData(recognized, translated, final);

    public bool IsDelayed() => false;
}