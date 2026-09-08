/* === AI DISCLOSURE=== 
 * This part of the code has been assisted by AI
 */
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace KikitanTranslator.Utility;

public sealed class SileroVad : IDisposable
{
    private const int _frameLength = 480;
    private const int _chunkSize = 512;
    private const int _contextSize = 64;
    private const int _effectiveSize = _chunkSize + _contextSize;
    private const int _stateSize = 2 * 1 * 128;

    private readonly InferenceSession _session;

    private readonly float[] _state = new float[_stateSize];
    private readonly float[] _context = new float[_contextSize];
    
    private readonly float[] _input = new float[_effectiveSize];
    private readonly float[] _stateScratch = new float[_stateSize];
    private readonly DenseTensor<float> _audioTensor;
    private readonly DenseTensor<float> _stateTensor;
    private readonly DenseTensor<long> _srTensor;

    private static readonly int[] _audioShape = { 1, _effectiveSize };
    private static readonly int[] _stateShape = { 2, 1, 128 };
    private static readonly int[] _srShape = { 1 };

    public float Threshold { get; set; } = 0.5f;

    public SileroVad(string path)
    {
        var options = new SessionOptions();
        options.IntraOpNumThreads = 1;
        options.InterOpNumThreads = 1;
        options.ExecutionMode = ExecutionMode.ORT_SEQUENTIAL;
        options.AppendExecutionProvider_CPU();

        _session = new InferenceSession(path, options);

        _audioTensor = new DenseTensor<float>(_input, _audioShape);
        _stateTensor = new DenseTensor<float>(_stateScratch, _stateShape);
        _srTensor = new DenseTensor<long>(new long[] { 16000L }, _srShape);

        ResetState();
    }

    public void ResetState()
    {
        Array.Clear(_state, 0, _state.Length);
        Array.Clear(_context, 0, _context.Length);
    }

    public bool SpeechDetection(ReadOnlySpan<float> samples)
    {
        Array.Copy(_context, 0, _input, 0, _contextSize);

        Span<float> padded = stackalloc float[_chunkSize];
        samples.Slice(0, _frameLength).CopyTo(padded);
        padded.CopyTo(_input.AsSpan(_contextSize, _chunkSize));

        padded.Slice(_chunkSize - _contextSize, _contextSize).CopyTo(_context);
        
        Array.Copy(_state, _stateScratch, _state.Length);

        var inputs = new[]
        {
            NamedOnnxValue.CreateFromTensor("input", _audioTensor),
            NamedOnnxValue.CreateFromTensor("state", _stateTensor),
            NamedOnnxValue.CreateFromTensor("sr",    _srTensor),
        };

        using var results = _session.Run(inputs);

        float speechProb = 0f;
        foreach (var result in results)
        {
            switch (result.Name)
            {
                case "output":
                    speechProb = result.AsEnumerable<float>().First();
                    break;
                case "stateN":
                    result.AsEnumerable<float>().ToArray().CopyTo(_state, 0);
                    break;
            }
        }

        return speechProb >= Threshold;
    }

    public void Dispose() => _session.Dispose();
}