using System.Runtime.InteropServices;

namespace Desktop_Image_Overlay;

public partial class Form1 : Form
{
    private Image img;
    private int time;
    
    public Form1(Rectangle bounds)
    {
        InitializeComponent();
        this.FormBorderStyle = FormBorderStyle.None;
        this.TopMost = true;
        this.BackColor = Color.Lime;
        this.TransparencyKey = Color.Lime;
        this.ShowInTaskbar = false;
        this.Bounds = bounds;
        SetWindowPos(this.Handle, HWND_TOPMOST, 0, 0, 0, 0, TOPMOST_FLAGS);

        int initialStyle = (int)GetWindowLong(this.Handle, GWL_EXSTYLE);
        SetWindowLong(this.Handle, GWL_EXSTYLE, initialStyle | WS_EX_LAYERED | WS_EX_TRANSPARENT);
    }
    
    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);

        if (img == null) return;
        
        Console.WriteLine("Drawing image...");
        e.Graphics.Clear(BackColor);

        int w = this.Width / 5;
        int h = img.Height / (img.Width / (this.Width / 5));

        int x = (this.Width - w) / 2;
        int y = this.Height - h - 50;
        
        Console.WriteLine($"New image size is {w}x{h}");

        e.Graphics.DrawImage(img, x, y, w, h);
        Task.Run(() =>
        {
            Image old = this.img;
            Console.WriteLine($"Waiting {time}ms...");
            Thread.Sleep(this.time);
            if (this.img != old) return;

            Invoke(img.Dispose);
            this.img = null;

            Invoke(Invalidate);

            Console.WriteLine("Image draw complete.");
        });
    }

    public void SetImage(Image img, int timeLeft)
    {
        if (this.img != null) this.img.Dispose();
        this.img = img;
        this.time = timeLeft;
        
        Invoke(Invalidate);
    }
    
    // Constants
    private const int GWL_EXSTYLE = -20;
    private const int WS_EX_LAYERED = 0x80000;
    private const int WS_EX_TRANSPARENT = 0x20;
    
    private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    private const UInt32 SWP_NOSIZE = 0x0001;
    private const UInt32 SWP_NOMOVE = 0x0002;
    private const UInt32 TOPMOST_FLAGS = SWP_NOMOVE | SWP_NOSIZE;

    // WinAPI declarations
    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
    
    [DllImport("user32.dll")] 
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}