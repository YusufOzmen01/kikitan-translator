using KikitanTranslator.Base.Translators;
using KikitanTranslator.Capture;
using KikitanTranslator.Recognizers;

Console.OutputEncoding = System.Text.Encoding.UTF8;

var mic = new Microphone();
int selected = 0;
for (int i = 0; i < mic.GetDevices().Length; i++)
{
    if (mic.GetDevices()[i].IsDefault)
    {
        selected = i;
        
        break;
    }
}
mic.SetDevice(mic.GetDevices()[selected]);

var bing = new Bing(mic);
var google = new GoogleTranslate();

bing.OnRecognitionReceived += (text, final) =>
{
    if (final) Console.WriteLine($"{text}: {google.Translate(text, "ja", "en")}");
    else Console.WriteLine($"User speaking: {text}");
};

bing.Start("ja");

while (true) {}

