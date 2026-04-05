using KikitanTranslator.Utility;
using Newtonsoft.Json;

namespace KikitanTranslator.Photino.Handlers;

public class GetConfig : IHandler
{
    public string OnDataReceived(string data) => JsonConvert.SerializeObject(AppConfig.ConfigObject);
}