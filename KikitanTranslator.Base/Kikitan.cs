using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;
using Serilog;

namespace KikitanTranslator.Base;

public class Kikitan
{
    private IRecognizer _recognizer;
    private ITranslator _translator;
    private List<IOutput> _outputs = [];

    private List<string[]> _queue = [];

    private bool _running;

    public Kikitan(IRecognizer recognizer, ITranslator translator)
    {
        _recognizer = recognizer;
        _translator = translator;

        recognizer.OnRecognitionReceived += OnRecognition;
        
        Log.Information("\x1b[36m[KKTN] Subsystem is ready");
    }

    public void AddOutput(IOutput output) => _outputs.Add(output);

    public void Start()
    {
        _recognizer.Start(AppConfig.ConfigObject.SourceLanguage);
        _running = true;
        
        Task.Run(QueueWorker);
        
        Log.Information("\x1b[36m[KKTN] Subsystem has started");
    }

    public void Stop()
    {
        _recognizer.Stop();
        _running = false;
        
        Log.Information("\x1b[36m[KKTN] Subsystem has stopped");
    }

    private void OnRecognition(string text, bool final)
    {
        if (!final)
        {
            foreach (var output in _outputs)
            {
                output.Send(text, "", final);
            }

            return;
        }
        
        var translated = _translator.Translate(text, AppConfig.ConfigObject.SourceLanguage,
            AppConfig.ConfigObject.TargetLanguage);

        if (translated != null)
        {
            _queue.Add([text, translated]);
            
            foreach (var output in _outputs.Where(v => !v.IsDelayed())) output.Send(text, translated, true);
        }
    }

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
            
            Log.Verbose("\x1b[36m[KKTN] Processing new delayed translation");
            
            foreach (var output in _outputs.Where(v => v.IsDelayed())) output.Send(texts[0], texts[1], true);
            Log.Verbose($"\x1b[36m[KKTN] Waiting {texts[1].Length * AppConfig.ConfigObject.ChatboxWaitPerCharMs}ms...");
            
            await Task.Delay(texts[1].Length * AppConfig.ConfigObject.ChatboxWaitPerCharMs);
        }
    }
}