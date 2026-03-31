using System.Net;
using System.Text;
using Desktop_Image_Overlay;
using Valve.VR;

public class HttpServer
{
    private readonly HttpListener _listener = new HttpListener();
    private readonly string _url;

    private Form1 _form;
    private OpenVROverlay _openvroverlay;

    private bool _desktop = false;

    public HttpServer(string prefix)
    {
        _url = prefix;
        _listener.Prefixes.Add(_url);
    }

    public void StartForm(Form1 form)
    {
        _form = form;
        _desktop = true;
        _listener.Start();
        Console.WriteLine($"Listening on {_url}");
        Task.Run(() => ListenLoop());
    }
    
    public void StartOpenVR(OpenVROverlay openVROverlay)
    {
        _openvroverlay = openVROverlay;
        _listener.Start();
        Console.WriteLine($"Listening on {_url}");
        Task.Run(() => ListenLoop());
    }

    private async Task ListenLoop()
    {
        while (_listener.IsListening)
        {
            HttpListenerContext context = await _listener.GetContextAsync();
            _ = Task.Run(() => HandleRequest(context));
        }
    }

    private async Task HandleRequest(HttpListenerContext context)
    {
        if (context.Request.HttpMethod == "POST")
        {
            using (var reader = new StreamReader(context.Request.InputStream, context.Request.ContentEncoding))
            {
                string base64 = await reader.ReadToEndAsync();

                try
                {
                    byte[] imageBytes = Convert.FromBase64String(base64);
                    var ms = new MemoryStream(imageBytes);
                    if (_desktop)
                    {
                        Image image = Image.FromStream(ms);
                        ms.Close();
                            
                        _form.SetImage(image, int.Parse(context.Request.QueryString["time"] ?? "5000"));
                    }
                    else
                    {
                        _openvroverlay.AddToQueue(ms, int.Parse(context.Request.QueryString["time"] ?? "5000"));
                    }
                         
                    Console.WriteLine("Image received!");

                    context.Response.StatusCode = 200;
                    byte[] responseBytes = Encoding.UTF8.GetBytes("Image received successfully");
                    context.Response.AddHeader("Access-Control-Allow-Origin", "*");
                    context.Response.AddHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
                    context.Response.AddHeader("Access-Control-Allow-Headers", "*");
                    
                    await context.Response.OutputStream.WriteAsync(responseBytes, 0, responseBytes.Length);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error: {ex.Message}");
                    context.Response.StatusCode = 400;
                }
                finally
                {
                    context.Response.Close();
                }
            }
        }
        else
        {
            context.Response.StatusCode = 405;
            context.Response.Close();
        }
    }

    public void Stop()
    {
        _listener.Stop();
        _listener.Close();
    }
}
