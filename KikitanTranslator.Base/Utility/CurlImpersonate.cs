namespace KikitanTranslator.Utility;

using System.Net;
using System.Runtime.InteropServices;
using CurlThin;
using CurlThin.Enums;
using CurlThin.SafeHandles;
using Serilog;

internal static class CurlImpersonateNative
{
    private const string LIBCURL = "libcurl";

    [DllImport(LIBCURL, EntryPoint = "curl_easy_impersonate")]
    public static extern CURLcode Impersonate(SafeEasyHandle handle, string target, int defaultHeaders);
}

public class CurlImpersonate
{
    private const string ImpersonateTarget = "chrome136";
    
    private CurlNative.Easy.DataHandler? _writeCallback;
    private static readonly string CaBundlePath = Path.Combine(AppContext.BaseDirectory, "cacert.pem");
    
    public string? DoGet(string url)
    {
        var global = CurlNative.Init();
        var easy = CurlNative.Easy.Init();
        var responseBody = new List<byte>();

        try
        {
            var impersonateResult = CurlImpersonateNative.Impersonate(easy, ImpersonateTarget, 1);
            if (impersonateResult != CURLcode.OK)
            {
                Log.Error($"curl_easy_impersonate failed: {impersonateResult}");
                
                return null;
            }

            CurlNative.Easy.SetOpt(easy, CURLoption.URL, url);

            if (File.Exists(CaBundlePath))
            {
                CurlNative.Easy.SetOpt(easy, CURLoption.CAINFO, CaBundlePath);
            }
            else
            {
                Log.Error($"CA bundle not found at {CaBundlePath}");
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
                Log.Error($"curl perform failed: {result}");
                return null;
            }

            CurlNative.Easy.GetInfo(easy, CURLINFO.RESPONSE_CODE, out int statusCode);
            if (statusCode != (int)HttpStatusCode.OK)
            {
                Log.Error($"Request returned {statusCode} on {url}");
                return null;
            }

            return System.Text.Encoding.UTF8.GetString(responseBody.ToArray());
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
}