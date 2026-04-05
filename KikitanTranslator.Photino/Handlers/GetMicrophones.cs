using KikitanTranslator.Capture;
using Newtonsoft.Json;

namespace KikitanTranslator.Photino.Handlers;

public class Mic
{
    [JsonProperty("name")] public string Name;
    [JsonProperty("default")] public bool Default;
}

public class GetMicrophones(Manager manager) : IHandler
{
    public string OnDataReceived(string data)
    {
        var microphones = manager.GetMicrophones();

        List<Mic> mics = new();
        foreach (var mic in microphones)
        {
            mics.Add(new Mic { Name = mic.Name, Default = mic.IsDefault});
        }

        return JsonConvert.SerializeObject(mics.ToArray());
    }
}