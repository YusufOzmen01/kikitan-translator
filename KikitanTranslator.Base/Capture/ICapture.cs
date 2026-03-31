namespace KikitanTranslator.Capture;

public delegate void OnData(float[] samples);

public interface ICapture
{
    public event OnData OnDataReceived;
    public uint GetSampleRate();
    
    public void Start();
    public void Stop();
    public void Pause();
    public void Resume();
}