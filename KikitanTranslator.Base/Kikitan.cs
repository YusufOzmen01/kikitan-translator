using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Logger;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;

namespace KikitanTranslator.Base;

public class Kikitan
{
    private ILogger _logger;
    private IRecognizer _recognizer;
    private ITranslator _translator;
    private List<IOutput> _outputs = [];

    private List<string[]> _queue = [];

    private bool _running;

    public Kikitan(ILogger logger, IRecognizer recognizer, ITranslator translator)
    {
        _logger = logger;
        _recognizer = recognizer;
        _translator = translator;

        recognizer.OnRecognitionReceived += OnRecognition;
        
        // TODO: Log
    }

    public void AddOutput(IOutput output) => _outputs.Add(output);

    public void Start()
    {
        _recognizer.Start(AppConfig.ConfigObject.SourceLanguage);
        _running = true;
        
        Task.Run(QueueWorker);
        
        // TODO: Log
    }

    public void Stop()
    {
        _recognizer.Stop();
        _running = false;
        
        // TODO: Log
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
            
            // TODO: Log
            
            foreach (var output in _outputs.Where(v => !v.IsDelayed())) output.Send(texts[0], texts[1], true);
            await Task.Delay(texts[1].Length * AppConfig.ConfigObject.ChatboxWaitPerCharMs);
        }
    }
}