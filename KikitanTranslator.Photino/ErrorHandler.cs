using KikitanTranslator.Photino.Handlers;
using KikitanTranslator.Utility;
using Newtonsoft.Json;

namespace KikitanTranslator.Photino;

public class ErrorHandler(Connector connector) : IErrorHandler
{
    public void OnError(string message)
    {
        connector.Send(
            JsonConvert.SerializeObject(new 
            {
                method = "notification",
                data = JsonConvert.SerializeObject(new
                {
                    msg = message,
                    level = 2
                })
            }));
    }
}