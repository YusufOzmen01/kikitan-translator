using System.Net;
using System.Runtime.InteropServices;
using CurlThin;
using CurlThin.Enums;
using CurlThin.SafeHandles;
using Newtonsoft.Json;
using Serilog;

namespace KikitanTranslator.Base.Translators;

internal class Sentence
{
    [JsonProperty("trans")] public string Translation;
}

internal class Response
{
    [JsonProperty("sentences")] public Sentence[] Sentences;
}

internal static class CurlImpersonateNative
{
    private const string LIBCURL = "libcurl";

    [DllImport(LIBCURL, EntryPoint = "curl_easy_impersonate")]
    public static extern CURLcode Impersonate(SafeEasyHandle handle, string target, int defaultHeaders);
}

public class GoogleTranslate : ITranslator
{
    private const string ImpersonateTarget = "chrome136";
    
    private CurlNative.Easy.DataHandler? _writeCallback;
    private static readonly string CaBundlePath =
        Path.Combine(AppContext.BaseDirectory, "curl-ca-bundle.crt");

    public string? Translate(string text, string source, string target)
    {
        string finalUrl =
            $"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&dt=bd&dj=1&q={Uri.EscapeDataString(text)}";

        var global = CurlNative.Init();
        var easy = CurlNative.Easy.Init();
        var responseBody = new List<byte>();

        try
        {
            var impersonateResult = CurlImpersonateNative.Impersonate(easy, ImpersonateTarget, 1);
            if (impersonateResult != CURLcode.OK)
            {
                Log.Error($"[GT]   curl_easy_impersonate failed: {impersonateResult}");
                return null;
            }

            CurlNative.Easy.SetOpt(easy, CURLoption.URL, finalUrl);

            if (File.Exists(CaBundlePath))
            {
                CurlNative.Easy.SetOpt(easy, CURLoption.CAINFO, CaBundlePath);
            }
            else
            {
                Log.Error($"[GT]   CA bundle not found at {CaBundlePath}");
            }
            
            CurlNative.Easy.SetOpt(easy, CURLoption.ACCEPT_ENCODING, "");

            _writeCallback = (data, size, nmemb, _) =>
            {
                var length = (int)size * (int)nmemb;
                var chunk = new byte[length];
                Marshal.Copy(data, chunk, 0, length);
                responseBody.AddRange(chunk);
                return (UIntPtr)length;
            };
            CurlNative.Easy.SetOpt(easy, CURLoption.WRITEFUNCTION, _writeCallback);
            

            var result = CurlNative.Easy.Perform(easy);
            GC.KeepAlive(_writeCallback);

            if (result != CURLcode.OK)
            {
                Log.Error($"[GT]   curl perform failed: {result}");
                return null;
            }

            CurlNative.Easy.GetInfo(easy, CURLINFO.RESPONSE_CODE, out int statusCode);
            if (statusCode != (int)HttpStatusCode.OK)
            {
                Log.Error($"[GT]   Google Translate returned {statusCode}");
                return null;
            }

            string json = System.Text.Encoding.UTF8.GetString(responseBody.ToArray());
            Response? resp = JsonConvert.DeserializeObject<Response>(json);

            if (resp == null)
            {
                Log.Error("[GT]   Response deserialization returned null");
                return null;
            }

            var final = "";
            foreach (var sentence in resp.Sentences)
            {
                final += $" {Uri.UnescapeDataString(sentence.Translation)}";
            }

            return final.Trim();
        }
        finally
        {
            easy.Dispose();
            if (global == CURLcode.OK)
            {
                CurlNative.Cleanup();
            }
        }
    }

    public void Dispose()
    {
    }
}