using KikitanTranslator.Capture;
using KikitanTranslator.Recognizers;

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
bing.OnRecognitionReceived += (text, final) =>
{
    Console.WriteLine($"{(final ? "Final" : "Phrase")}: {text}");
};

bing.Start("en");

while (true) {}

