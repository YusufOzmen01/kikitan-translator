using Newtonsoft.Json;
using Photino.NET;

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

    public void HandleMessage(PhotinoWindow window, string msg)
    {
        try
        {
            Message? m = JsonConvert.DeserializeObject<Message>(msg);
            if (m == null)
            {
                return; // TODO: Log
            }

            foreach (var handler in _handlers)
            {
                if (handler.Key == m.Method)
                {
                    var d = handler.Value.OnDataReceived(m.Data);
                    if (d.Length != 0) window.SendWebMessage(JsonConvert.SerializeObject(new Message { Method = m.Method, Data = d }));
                    
                    break;
                }
            }

            // TODO: Log
        }
        catch
        {
            // TODO: Log

            return;
        }
    }
}