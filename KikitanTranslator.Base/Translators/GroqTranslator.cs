using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using KikitanTranslator.Utility;
using Serilog;

namespace KikitanTranslator.Base.Translators;

public class GroqTranslator : ITranslator
{
    private const string Url = "https://api.groq.com/openai/v1/chat/completions";

    private readonly HttpClient _httpClient = new();

    public string? Translate(string text, string source, string target)
        => TranslateAsync(text, source, target).GetAwaiter().GetResult();

    private async Task<string?> TranslateAsync(string text, string source, string target)
    {
        var apiKey = AppConfig.ConfigObject.GroqApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            Log.Error("[GROQ] No API key configured");
            return null;
        }

        try
        {
            var body = JsonSerializer.Serialize(new
            {
                model = Constants.GROQ_MODEL,
                temperature = 0.5f,
                max_completion_tokens = 8192,
                top_p = 1,
                messages = new[]
                {
                    new { role = "system", content = Constants.GROQ_PROMPT.Replace("LANG_SRC", source).Replace("LANG_TARGET", target) },
                    new { role = "user",   content = text }
                }
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, Url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var status = (int)response.StatusCode;
                Log.Error($"[GROQ] Translation API error {status}");
                return null;
            }

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            return doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString()
                ?.Trim();
        }
        catch (Exception ex)
        {
            Log.Error($"[GROQ] Translation error: {ex.Message}");
            return null;
        }
    }

    public void Dispose() => _httpClient.Dispose();
}