namespace KikitanTranslator.Base.Outputs;

public class ConsoleOut : IOutput
{
    public void Send(string recognized, string translated, bool final)
    {
        System.Console.WriteLine($"[{(final ? "SENTENCE" : "SPEAKING")}]: {recognized} | {translated}");
    }

    public bool IsDelayed() => false;
}