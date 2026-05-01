using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;
using Serilog;

namespace KikitanTranslator.Base;

public class Kikitan : IDisposable
{
    private IRecognizer _recognizer;
    private ITranslator _translator;
    private List<IOutput> _outputs = [];

    private List<string[]> _queue = [];

    private bool _running;
    private bool _isLoopback;
    
    public event OnRecognizerStatus? OnRecognizerStatusChanged;

    public Kikitan(IRecognizer recognizer, ITranslator translator, bool loopback)
    {
        _recognizer = recognizer;
        _translator = translator;

        recognizer.OnRecognitionReceived += OnRecognition;
        recognizer.OnRecognizerStatusChanged += OnRecognizerStatus;

        _isLoopback = loopback;
        
        Log.Information("[KKTN] Kikitan is starting up");
    }

    public void AddOutput(IOutput output) => _outputs.Add(output);

    public void Start()
    {
        _recognizer.Start(_isLoopback ? AppConfig.ConfigObject.TargetLanguage : AppConfig.ConfigObject.SourceLanguage);
        _running = true;
        
        Task.Run(QueueWorker);
    }

    public void Stop()
    {
        _recognizer.Stop();
        _running = false;
        
        Log.Information("[KKTN] Kikitan has stopped");
    }

    private void OnRecognition(string text, bool final)
    {
        foreach (var output in _outputs)
        {
            output.Send(text, "", false);
        }

        if (!final) return;

        var translated = AppConfig.ConfigObject.SpeechToTextOnly ? "" : _isLoopback ? _translator.Translate(text, AppConfig.ConfigObject.TargetLanguage, AppConfig.ConfigObject.SourceLanguage) : _translator.Translate(text, AppConfig.ConfigObject.SourceLanguage, AppConfig.ConfigObject.TargetLanguage);
        
        if (translated != null)
        {
            _queue.Add([text, translated]);
            
            foreach (var output in _outputs.Where(v => !v.IsDelayed())) output.Send(text, translated, true);
        }
    }

    private void OnRecognizerStatus(RecognizerStatus status) => OnRecognizerStatusChanged?.Invoke(status);

    private async void QueueWorker()
    {
        while (_running)
        {
            if (_queue.Count == 0)
            {
                await Task.Delay(50);
                
                continue;
            }

            var texts = _queue.First();
            _queue.RemoveAt(0);
            
            Log.Verbose("[KKTN] Processing new delayed translation");
            
            foreach (var output in _outputs.Where(v => v.IsDelayed())) output.Send(texts[0], texts[1], true);
            Log.Verbose($"[KKTN] Waiting {texts[1].Length * AppConfig.ConfigObject.ChatboxWaitPerCharMs}ms...");
            
            await Task.Delay(texts[1].Length * AppConfig.ConfigObject.ChatboxWaitPerCharMs);
        }
    }

    public void ManualTranslate(string text) => OnRecognition(text, true);

    public void Dispose()
    {
        _running = false;
        _recognizer.Dispose();
        _translator.Dispose();
    }
}