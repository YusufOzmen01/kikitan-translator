using Kikitan_OVR;
using OVRSharp;
using WebSocketSharp.Server;

try
{
    var wssv = new WebSocketServer("ws://127.0.0.1");

    wssv.AddWebSocketService<KikitanOverlay>("/ovr");
    wssv.Start();

    Console.ReadKey();
}
catch (Exception e)
{
    Console.WriteLine(e.Message + "\nPress any key to exit.");
    Console.ReadKey(false);

    Environment.Exit(-1);
}