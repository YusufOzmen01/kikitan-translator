using System.Net;
using Newtonsoft.Json;
using Serilog;

namespace KikitanTranslator.Base.Translators;

internal class Sentence
{
    [JsonProperty("trans")] public string Translation;
}

internal class Response : IDisposable
{
    [JsonProperty("sentences")] public Sentence[] Sentences;


    public void Dispose()
    {
        
    }
}

public class GoogleTranslate : ITranslator
{
    public string? Translate(string text, string source, string target)
    {
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create($"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&dt=bd&dj=1&q={Uri.EscapeDataString(text)}");
        request.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;

        using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
        {
            if (response.StatusCode != HttpStatusCode.OK)
            {
                Log.Error($"\x1b[34m[GT]   Google Translate returned {response.StatusCode}");
                
                return null;
            }
            
            using(Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream))
            using (Response? resp = JsonConvert.DeserializeObject<Response>(reader.ReadToEnd()))
            {
                if (resp == null)
                {
                    Log.Error($"\x1b[34m[GT]   Response deserialization returned null");
                    
                    return null;
                }

                var final = "";
                foreach (var sentence in resp.Sentences)
                {
                    final += $" {Uri.UnescapeDataString(sentence.Translation)}";
                }

                return final.Trim();
            }
        }
    }

    public void Dispose()
    {
        
    }
}