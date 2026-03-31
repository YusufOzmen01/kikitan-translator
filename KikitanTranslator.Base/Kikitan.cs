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

    private List<string> _queue = [];

    public Kikitan(ILogger logger, IRecognizer recognizer, ITranslator translator)
    {
        _logger = logger;
        _recognizer = recognizer;
        _translator = translator;

        recognizer.OnRecognitionReceived += OnRecognition;
    }

    public void AddOutput(IOutput output) => _outputs.Append(output);

    public void Start()
    {
        _recognizer.Start(AppConfig.ConfigObject.SourceLanguage);
    }

    public void Stop()
    {
        _recognizer.Stop();
    }

    private void OnRecognition(string text, bool final)
    {
        if (!final)
        {
            // foreach (var output in _outputs)
            // {
            //     output.Send(text, "", final);
            // }

            return;
        }
        var translated = _translator.Translate(text, AppConfig.ConfigObject.SourceLanguage,
            AppConfig.ConfigObject.TargetLanguage);

        if (translated != null)
        {
            foreach (var output in _outputs)
            {
                output.Send(text, translated, true);
            }
        }
    }
}