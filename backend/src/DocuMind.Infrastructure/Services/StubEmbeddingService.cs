using DocuMind.Application.Interfaces;

namespace DocuMind.Infrastructure.Services;

/// <summary>
/// Local stub — returns a deterministic fake embedding (all 0.1f).
/// Replace with AzureOpenAIEmbeddingService when Azure credentials are available.
/// </summary>
public class StubEmbeddingService : IEmbeddingService
{
    private const int Dimensions = 1536; // matches text-embedding-ada-002

    public Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct)
    {
        Console.WriteLine($"[StubEmbedding] Generating fake embedding for {text.Length} chars");
        var vector = Enumerable.Repeat(0.1f, Dimensions).ToArray();
        return Task.FromResult(vector);
    }
}
