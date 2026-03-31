using KikitanTranslator.Base;
using KikitanTranslator.Base.Outputs;
using KikitanTranslator.Base.Translators;
using KikitanTranslator.Capture;
using KikitanTranslator.Recognizers;
using KikitanTranslator.Utility;

Console.OutputEncoding = System.Text.Encoding.UTF8;
Logger.Initialize();


AppConfig.Load();

var kikitan = new Kikitan(new Bing(new Microphone()), new GoogleTranslate());
kikitan.AddOutput(new OSC());
kikitan.Start();

while (true) {}

