using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;

namespace DocuMind.Infrastructure.Services;

/// <summary>
/// Local stub — stores chunks in memory (lost on restart).
/// Replace with AzureAISearchService when Azure credentials are available.
/// </summary>
public class StubVectorIndexService : IVectorIndexService
{
    // In-memory store keyed by documentId
    private static readonly Dictionary<string, List<DocumentChunk>> _store = new();

    public Task IndexChunksAsync(string documentId, List<DocumentChunk> chunks, CancellationToken ct)
    {
        _store[documentId] = chunks;
        Console.WriteLine($"[StubVectorIndex] Indexed {chunks.Count} chunks for document {documentId}");
        return Task.CompletedTask;
    }

    public Task<List<DocumentChunk>> SearchAsync(string documentId, float[] queryEmbedding, int topK, CancellationToken ct)
    {
        if (!_store.TryGetValue(documentId, out var chunks))
        {
            Console.WriteLine($"[StubVectorIndex] Document {documentId} not found");
            return Task.FromResult(new List<DocumentChunk>());
        }

        // No real vector math — just return the first topK chunks as a stub
        var results = chunks.Take(topK).ToList();
        Console.WriteLine($"[StubVectorIndex] Returning {results.Count} stub chunks for document {documentId}");
        return Task.FromResult(results);
    }
}
