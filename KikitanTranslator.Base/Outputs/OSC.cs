using BuildSoft.OscCore;

namespace KikitanTranslator.Base.Outputs;

public class OSC : IOutput
{
    private OscClient? _client;
    private string _baseAddress;

    public OSC(string baseAddress)
    {
        _client = new OscClient("127.0.0.1", 7272);
        
        _baseAddress = baseAddress;
    }


    public void Send(string recognized, string translated, bool final)
    {
        _client?.Send($"{_baseAddress}/recognized", recognized);
        _client?.Send($"{_baseAddress}/translated", translated);
        _client?.Send($"{_baseAddress}/final", final);
    }

    public bool IsDelayed() => false;
}