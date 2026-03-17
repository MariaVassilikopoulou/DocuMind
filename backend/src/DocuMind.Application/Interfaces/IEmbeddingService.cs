namespace DocuMind.Application.Interfaces;

/// <summary>
/// Converts text into a vector embedding.
/// Production implementation: Azure OpenAI text-embedding-ada-002.
/// </summary>
public interface IEmbeddingService
{
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct);
}
