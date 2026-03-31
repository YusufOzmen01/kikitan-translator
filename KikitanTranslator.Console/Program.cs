using KikitanTranslator.Base;
using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Capture;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;

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

AppConfig.Load();

var bing = new Bing(mic);
var google = new GoogleTranslate();

var kikitan = new Kikitan(null, bing, google);
kikitan.AddOutput(new OSC());
kikitan.AddOutput(new ConsoleOut());
kikitan.Start();

while (true) {}

