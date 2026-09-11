using System.Net;
using KikitanTranslator.Utility;
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
    private CurlImpersonate _curlImpersonate = new();

    public string? Translate(string text, string source, string target)
    {
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create($"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&dt=bd&dj=1&q={Uri.EscapeDataString(text)}");
        request.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;

        using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
        {
            if (response.StatusCode != HttpStatusCode.OK) return TranslateWithCurlImpersonate(text, source, target);
            
            using(Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream))
            using (Response? resp = JsonConvert.DeserializeObject<Response>(reader.ReadToEnd()))
            {
                if (resp == null)
                {
                    Log.Error($"[GT]   Response deserialization returned null");
                    
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
    
    
    private string? TranslateWithCurlImpersonate(string text, string source, string target)
    {
        string? resp = _curlImpersonate.DoGet( $"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&dt=bd&dj=1&q={Uri.EscapeDataString(text)}");
        if (resp == null)
        {
            Log.Error($"[GT]   Google Translate failed (via curl_impersonate)!");

            return null;
        }

        Response? r = JsonConvert.DeserializeObject<Response>(resp);
        if (r == null)
        {
            Log.Error($"[GT]   Response deserialization returned null");
                    
            return null;
        }

        var final = "";
        foreach (var sentence in r.Sentences)
        {
            final += $" {Uri.UnescapeDataString(sentence.Translation)}";
        }

        return final.Trim();
    }
    
    public void Dispose()
    {
        
    }
}