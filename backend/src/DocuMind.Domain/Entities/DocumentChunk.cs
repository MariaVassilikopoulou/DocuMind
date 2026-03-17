namespace DocuMind.Domain.Entities;

/// <summary>
/// Represents a single chunk of text extracted from an uploaded document.
/// Chunks are the unit of embedding and retrieval in the RAG pipeline.
/// </summary>
public class DocumentChunk
{
    public string Id { get; init; } = Guid.NewGuid().ToString();
    public string DocumentId { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public int ChunkIndex { get; init; }
    public int? PageNumber { get; init; }

    // Set after embedding is generated in the Infrastructure layer
    public float[]? Embedding { get; set; }
}
