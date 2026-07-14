using System.Runtime.InteropServices;

namespace KikitanTranslator.Overlay;

public partial class Form1 : Form
{
    private Image img;
    private int time;
    private Bitmap _backBuffer;

    public Form1(Rectangle bounds)
    {
        InitializeComponent();
        this.FormBorderStyle = FormBorderStyle.None;
        this.TopMost = true;
        this.BackColor = Color.Lime;
        this.TransparencyKey = Color.Lime;
        this.ShowInTaskbar = false;
        this.Bounds = bounds;
        
        this.DoubleBuffered = true;
        this.SetStyle(
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.UserPaint,
            true);
        this.UpdateStyles();

        SetWindowPos(this.Handle, HWND_TOPMOST, 0, 0, 0, 0, TOPMOST_FLAGS);

        int initialStyle = (int)GetWindowLong(this.Handle, GWL_EXSTYLE);
        SetWindowLong(this.Handle, GWL_EXSTYLE, initialStyle | WS_EX_LAYERED | WS_EX_TRANSPARENT);
    }
    
    protected override void OnPaintBackground(PaintEventArgs e) { }

    protected override void OnPaint(PaintEventArgs e)
    {
        if (_backBuffer != null)
        {
            e.Graphics.DrawImageUnscaled(_backBuffer, 0, 0);
        }
        else
        {
            e.Graphics.Clear(BackColor);
        }
    }
    
    private void RebuildBackBuffer()
    {
        var newBuffer = new Bitmap(this.Width, this.Height);

        using (var g = Graphics.FromImage(newBuffer))
        {
            g.Clear(BackColor);

            if (img != null)
            {
                int w = this.Width / 5;
                int h = img.Height / (img.Width / (this.Width / 5));
                int x = (this.Width - w) / 2;
                int y = this.Height - h - 50;

                Console.WriteLine($"Rendering to back buffer: {w}x{h}");
                g.DrawImage(img, x, y, w, h);
            }
        }
        
        var old = Interlocked.Exchange(ref _backBuffer, newBuffer);
        old?.Dispose();

        Invalidate();
        Update();
    }

    public void SetImage(Image newImg, int timeLeft)
    {
        var old = Interlocked.Exchange(ref img, newImg);
        old?.Dispose();

        this.time = timeLeft;
        
        Invoke(RebuildBackBuffer);

        Task.Run(() =>
        {
            Image captured = this.img;
            Console.WriteLine($"Waiting {timeLeft}ms...");
            Thread.Sleep(timeLeft);
            if (this.img != captured) return;

            var cleared = Interlocked.Exchange(ref img, null);
            cleared?.Dispose();

            Invoke(RebuildBackBuffer);
            Console.WriteLine("Image cleared.");
        });
    }

    private const int GWL_EXSTYLE = -20;
    private const int WS_EX_LAYERED = 0x80000;
    private const int WS_EX_TRANSPARENT = 0x20;

    private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    private const UInt32 SWP_NOSIZE = 0x0001;
    private const UInt32 SWP_NOMOVE = 0x0002;
    private const UInt32 TOPMOST_FLAGS = SWP_NOMOVE | SWP_NOSIZE;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}