using DocuMind.Domain.Entities;

namespace DocuMind.Application.Interfaces;

/// <summary>
/// Stores and retrieves document chunk vectors.
/// Production implementation: Azure AI Search.
/// </summary>
public interface IVectorIndexService
{
    Task IndexChunksAsync(string documentId, List<DocumentChunk> chunks, CancellationToken ct);
    Task<List<DocumentChunk>> SearchAsync(string documentId, float[] queryEmbedding, int topK, CancellationToken ct);
}
