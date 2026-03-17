using DocuMind.Application.Interfaces;

namespace DocuMind.Infrastructure.Services;

public class AzureOpenAIEmbeddingService : IEmbeddingService
{
    // Optional: inject OpenAIClient in Production mode
    // private readonly OpenAIClient? _client;

    public AzureOpenAIEmbeddingService(/*OpenAIClient? client*/ )
    {
        // _client = client;
    }

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct)
    {
        // Stub-safe placeholder: 1536-dim array
        await Task.CompletedTask;
        return new float[1536];
    }
}