using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;

namespace KikitanTranslator.Overlay;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct OverlayPipeData
{
    public int Counter; 
    public bool NoLanguageSpace;
    public int Time;
    public int TextLength;

    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 2048)]
    public byte[] TextBytes;
    
    public string Text
    {
        readonly get => Encoding.UTF8.GetString(TextBytes, 0, TextLength);
        set
        {
            TextBytes ??= new byte[512];
            var encoded = Encoding.UTF8.GetBytes(value);
            TextLength = Math.Min(encoded.Length, 512);
            Array.Clear(TextBytes, 0, 512);
            Array.Copy(encoded, TextBytes, TextLength);
        }
    }
}


public class OverlayReader : IDisposable
{
    private readonly MemoryMappedFile _mmf;
    private readonly MemoryMappedViewAccessor _accessor;
    
    private int _previousCounter = 0;

    public OverlayReader()
    {
        _mmf = MemoryMappedFile.OpenExisting("kikitan-pipe");
        _accessor = _mmf.CreateViewAccessor();
    }

    public OverlayPipeData? Read()
    {
        int size = Marshal.SizeOf<OverlayPipeData>();
        var bytes = new byte[size];
        _accessor.ReadArray(0, bytes, 0, size);
        
        var handle = GCHandle.Alloc(bytes, GCHandleType.Pinned);
        var state = Marshal.PtrToStructure<OverlayPipeData>(handle.AddrOfPinnedObject());
        handle.Free();

        if (state.Counter == _previousCounter) return null;
        _previousCounter = state.Counter;

        return state;
    }

    public void Dispose() { _accessor.Dispose(); _mmf.Dispose(); }
}