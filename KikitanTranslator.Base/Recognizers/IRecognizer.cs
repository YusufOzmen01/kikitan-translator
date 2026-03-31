namespace KikitanTranslator.Recognizers;

public enum RecognizerStatus
{
    NotStarted,
    Connecting,
    Running
}

public delegate void OnRecognition(string text, bool final);

public interface IRecognizer
{
    public void Start(string language);
    public void Stop();
    public RecognizerStatus Status();
    public event OnRecognition OnRecognitionReceived;
}