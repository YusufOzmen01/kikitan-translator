using System.Diagnostics;
using System.Runtime.InteropServices;

namespace KikitanTranslator.Overlay;

static class Program
{
    [DllImport("user32.dll", SetLastError = true)]
    static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    
    [STAThread]
    static void Main()
    {
        if (Process.GetProcessesByName("KikitanTranslator.Overlay").Length > 1)
        {
            Console.WriteLine("Another overlay is running!");
            
            return;
        }
        
        Task.Run(() =>
        {
            while (true)
                if (Process.GetProcessesByName("KikitanTranslator.Photino").Length == 0)
                {
                    Console.WriteLine("Kikitan is not running!");
                    
                    Environment.Exit(0);
                }
        });
        
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        
        var server = new OverlayServer();

        if (Process.GetProcessesByName("vrserver").Length != 0) server.StartOpenVR(new OpenVROverlay());
        
        RECT rect;
        IntPtr hWnd = FindWindow(null, "VRChat");
        if (Screen.PrimaryScreen != null)
        {
            Rectangle bounds = Screen.PrimaryScreen.Bounds;
            if (hWnd != IntPtr.Zero && GetWindowRect(hWnd, out rect))
            {
                bounds = new Rectangle(
                    rect.Left,
                    rect.Top,
                    rect.Right - rect.Left,
                    rect.Bottom - rect.Top
                );
            }
        
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            var form = new Form1(bounds);
            server.StartForm(form);
            
            Application.Run(form);
        }
    }
}