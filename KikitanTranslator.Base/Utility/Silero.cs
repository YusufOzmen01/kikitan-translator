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

    private static readonly int[] _audioShape = { 1, _effectiveSize };
    private static readonly int[] _stateShape = { 2, 1, 128 };
    private static readonly int[] _srShape = { 1 };

    public float Threshold { get; set; } = 0.5f;

    public SileroVad(string path)
    {
        var options = new SessionOptions();
        options.AppendExecutionProvider_CPU();

        _session = new InferenceSession(path, options);
        ResetState();
    }

    public void ResetState()
    {
        Array.Clear(_state, 0, _state.Length);
        Array.Clear(_context, 0, _context.Length);
    }

    public bool SpeechDetection(float[] samples)
    {
        var input = new float[_effectiveSize];
        Array.Copy(_context, 0, input, 0, _contextSize);

        var padded = new float[_chunkSize];
        Array.Copy(samples, padded, _frameLength);
        Array.Copy(padded, 0, input, _contextSize, _chunkSize);
        Array.Copy(padded, _chunkSize - _contextSize, _context, 0, _contextSize);

        var audioTensor = new DenseTensor<float>(input, _audioShape);
        var stateTensor = new DenseTensor<float>(_state.AsSpan().ToArray(), _stateShape);
        var srTensor    = new DenseTensor<long>(new long[] { 16000L }, _srShape);

        var inputs = new[]
        {
            NamedOnnxValue.CreateFromTensor("input", audioTensor),
            NamedOnnxValue.CreateFromTensor("state", stateTensor),
            NamedOnnxValue.CreateFromTensor("sr",    srTensor),
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