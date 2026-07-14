using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;

namespace KikitanTranslator.Photino;

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
            TextBytes ??= new byte[2048];
            var encoded = Encoding.UTF8.GetBytes(value);
            TextLength = Math.Min(encoded.Length, 2048);
            Array.Clear(TextBytes, 0, 2048);
            Array.Copy(encoded, TextBytes, TextLength);
        }
    }
}

public class OverlayWriter : IDisposable
{
    private readonly MemoryMappedFile _mmf;
    private readonly MemoryMappedViewAccessor _accessor;

    private int _previousCounter = 0;
    
    public OverlayWriter()
    {
        _mmf = MemoryMappedFile.CreateNew("kikitan-pipe", 4096);
        _accessor = _mmf.CreateViewAccessor();
    }

    public void Write(OverlayPipeData state)
    {
        state.Counter = _previousCounter + 1;
        _previousCounter++;
        
        int size = Marshal.SizeOf<OverlayPipeData>();
        var bytes = new byte[size];
    
        var handle = GCHandle.Alloc(bytes, GCHandleType.Pinned);
        Marshal.StructureToPtr(state, handle.AddrOfPinnedObject(), false);
        handle.Free();

        _accessor.WriteArray(0, bytes, 0, size);
    }

    public void Dispose() { _accessor.Dispose(); _mmf.Dispose(); }
}