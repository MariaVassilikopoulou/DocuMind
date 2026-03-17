using System.Collections.Concurrent;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;

namespace DocuMind.Infrastructure.Services;

/// <summary>
/// In-memory vector index with cosine similarity search.
///
/// This is the real local implementation — no Azure required.
/// It stores all chunk embeddings in a thread-safe dictionary and ranks
/// them by cosine similarity at query time.
///
/// Limitations (expected at this stage):
///   - Data is lost on restart (no persistence).
///   - Linear scan over all chunks — fine for dev/demo, not for production scale.
///
/// Upgrade path:
///   Replace with AzureAISearchService to get persistent storage, HNSW-based
///   approximate nearest-neighbour search, and hybrid (vector + keyword) ranking.
/// </summary>
public class InMemoryVectorIndexService : IVectorIndexService
{
    // ConcurrentDictionary makes this safe to use as a singleton under
    // parallel upload requests without an explicit lock.
    private readonly ConcurrentDictionary<string, List<DocumentChunk>> _store = new();

    // -------------------------------------------------------------------------
    // IVectorIndexService — Index
    // -------------------------------------------------------------------------

    public Task IndexChunksAsync(string documentId, List<DocumentChunk> chunks, CancellationToken ct)
    {
        var missing = chunks.Count(c => c.Embedding is null || c.Embedding.Length == 0);
        if (missing > 0)
            throw new InvalidOperationException(
                $"Cannot index: {missing} chunk(s) are missing embeddings. " +
                "Ensure IEmbeddingService ran before calling IndexChunksAsync.");

        // Overwrite any previous version of this document
        _store[documentId] = chunks;

        Console.WriteLine(
            $"[InMemoryVectorIndex] Indexed {chunks.Count} chunks " +
            $"(dim={chunks[0].Embedding!.Length}) for document {documentId}");

        return Task.CompletedTask;
    }

    // -------------------------------------------------------------------------
    // IVectorIndexService — Search
    // -------------------------------------------------------------------------

    public Task<List<DocumentChunk>> SearchAsync(
        string documentId,
        float[] queryEmbedding,
        int topK,
        CancellationToken ct)
    {
        if (!_store.TryGetValue(documentId, out var chunks))
        {
            Console.WriteLine($"[InMemoryVectorIndex] Document {documentId} not found in index.");
            return Task.FromResult(new List<DocumentChunk>());
        }

        // Score every chunk, sort descending, return the top-K
        var results = chunks
            .Where(c => c.Embedding is not null && c.Embedding.Length == queryEmbedding.Length)
            .Select(c => (chunk: c, score: CosineSimilarity(queryEmbedding, c.Embedding!)))
            .OrderByDescending(x => x.score)
            .Take(topK)
            .Select(x => x.chunk)
            .ToList();

        Console.WriteLine(
            $"[InMemoryVectorIndex] Returning {results.Count}/{topK} chunks " +
            $"for document {documentId}");

        return Task.FromResult(results);
    }

    // -------------------------------------------------------------------------
    // Cosine similarity
    // -------------------------------------------------------------------------

    /// <summary>
    /// Computes the cosine similarity between two vectors.
    ///
    /// Formula:  cos(θ) = (A · B) / (|A| × |B|)
    ///
    /// Result range: -1 (opposite directions) → 0 (orthogonal) → 1 (identical).
    /// For OpenAI ada-002 embeddings, vectors are already L2-normalised,
    /// so the magnitudes are both 1 and this reduces to a plain dot product.
    /// We compute the full formula anyway so the class works correctly with
    /// any embedding model.
    /// </summary>
    private static float CosineSimilarity(float[] a, float[] b)
    {
        // Both vectors must have the same number of dimensions.
        // A mismatch here means the query was embedded with a different model
        // than the chunks — a configuration error worth surfacing loudly.
        if (a.Length != b.Length)
            throw new ArgumentException(
                $"Vector dimension mismatch: query has {a.Length} dims, " +
                $"chunk has {b.Length} dims. Use the same embedding model for both.");

        float dot  = 0f;
        float magA = 0f;
        float magB = 0f;

        // Single-pass loop: compute dot product and both magnitudes together
        for (int i = 0; i < a.Length; i++)
        {
            dot  += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }

        // Guard: a zero vector has no direction, so similarity is undefined.
        // Return 0 (treat as completely dissimilar) rather than throwing.
        if (magA == 0f || magB == 0f)
            return 0f;

        return dot / (MathF.Sqrt(magA) * MathF.Sqrt(magB));
    }
}
