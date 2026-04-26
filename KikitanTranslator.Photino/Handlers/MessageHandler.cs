using Newtonsoft.Json;
using Photino.NET;
using Serilog;

namespace KikitanTranslator.Photino.Handlers;

public class Message
{
    [JsonProperty("method")] public string Method;
    [JsonProperty("data")] public string Data;
}

public class MessageHandler
{
    private Dictionary<string, IHandler> _handlers = new();

    public void RegisterHandler(string methodName, IHandler handler) => _handlers.Add(methodName, handler);

    public string? HandleMessage(string msg, Connector conn)
    {
        try
        {
            Message? m = JsonConvert.DeserializeObject<Message>(msg);
            if (m == null)
            {
                Log.Error($"[MSGH] Unable to deserialize message");
                
                return null;
            }

            foreach (var handler in _handlers)
            {
                if (handler.Key == m.Method)
                {
                    var d = handler.Value.OnDataReceived(m.Data);
                    if (d.Length != 0) conn.Send(JsonConvert.SerializeObject(new Message { Method = m.Method, Data = d }));
                    
                    break;
                }
            }
        }
        catch (Exception e)
        {
            Log.Error($"[MSGH] An error occured while trying to handle the message [{msg}]: {e}");
        }

        return null;
    }
}