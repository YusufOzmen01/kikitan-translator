using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Desktop_Image_Overlay;

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
        Task.Run(() =>
        {
            while (true) if (Process.GetProcessesByName("app").Length == 0) Environment.Exit(0);
        });
        
        var server = new HttpServer("http://localhost:18554/");

        if (Process.GetProcessesByName("vrserver").Length != 0)
        {
            OpenVROverlay overlay = new OpenVROverlay();
            
            server.StartOpenVR(overlay);
            overlay.ImageLoop();
        }
        
        RECT rect;
        IntPtr hWnd = FindWindow(null, "VRChat");
        if (hWnd != IntPtr.Zero && GetWindowRect(hWnd, out rect))
        {
            Rectangle bounds = new Rectangle(
                rect.Left,
                rect.Top,
                rect.Right - rect.Left,
                rect.Bottom - rect.Top
            );

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            var form = new Form1(bounds);
            server.StartForm(form);
            
            Application.Run(form);
        }
    }
}