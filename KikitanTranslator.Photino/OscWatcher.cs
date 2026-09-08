using BuildSoft.OscCore;
using VRC.OSCQuery;

namespace KikitanTranslator.Photino; 

public class OscWatcher : IDisposable
{
    private OSCQueryService? _oscQuery;
    private OscServer? _oscServer;
    private Thread? _listenThread;
    private bool _running;
    
    public bool? IsMuted { get; private set; }
    
    public event Action<bool>? MuteStatusChanged;
    
    public void Start()
    {
        var tcpPort = Extensions.GetAvailableTcpPort();
        var udpPort = Extensions.GetAvailableUdpPort();
        
        _oscQuery = new OSCQueryServiceBuilder()
            .WithTcpPort(tcpPort)
            .WithUdpPort(udpPort)
            .WithServiceName("Kikitan Translator")
            .WithDefaults()
            .Build();
        
        _oscQuery.AddEndpoint<bool>("/avatar/parameters/MuteSelf", Attributes.AccessValues.ReadOnly, ["Muted status"]);

        _oscServer = new OscServer(udpPort);
        _oscServer.TryAddMethod("/avatar/parameters/MuteSelf", m =>
        {
            if (m.ElementCount > 0)
            {
                var muted = m.ReadBooleanElement(0);
                if (IsMuted != muted)
                    MuteStatusChanged?.Invoke(muted);
                    
                IsMuted = muted;
            }
        });
        
        _oscServer.Start();

        _running = true;
        _listenThread = new Thread(ListenLoop) { IsBackground = true };
        _listenThread.Start();
    }

    private void ListenLoop()
    {
        while (_running)
        {
            _oscServer?.Update();
            Thread.Sleep(100);
        }
    }

    public void Dispose()
    {
        _running = false;
        _oscServer?.Dispose();
        _oscQuery?.Dispose();
    }
}