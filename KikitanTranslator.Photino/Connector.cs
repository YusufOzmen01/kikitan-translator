using Fleck;
using Photino.NET;

namespace KikitanTranslator.Photino;

public delegate string? OnConnectorData(string data, Connector conn);

public class Connector
{
    public PhotinoWindow? WindowHandle;
    
    private WebSocketServer _websocketServer;
    private List<IWebSocketConnection> _sockets = new();

    public event OnConnectorData OnConnectorData;

    public void StartWebsocket()
    {
        _websocketServer = new WebSocketServer("ws://0.0.0.0:18378");
        _websocketServer.Start(socket =>
        {
            socket.OnOpen = () => _sockets.Add(socket);
            socket.OnClose = () => _sockets.Remove(socket);
            socket.OnMessage = s => OnWebsocketMessage(s, socket);
        });
    }
    
    public void Send(string data)
    {
        if (WindowHandle != null) WindowHandle.SendWebMessage(data);
        else SendToSockets(data);
    }

    private void OnWebsocketMessage(string msg, IWebSocketConnection conn)
    {
        var data = OnConnectorData?.Invoke(msg, this);
        if (!string.IsNullOrEmpty(data)) conn.Send(data);
    }
    
    private void SendToSockets(string data)
    {
        foreach (var sock in _sockets) sock.Send(data);
    }
}