using DocuMind.Application.DTOs;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;

namespace DocuMind.Application.UseCases;

public class UploadDocumentUseCase
{
    private readonly IDocumentStorageService _storage;
    private readonly IEmbeddingService _embedding;
    private readonly IVectorIndexService _vectorIndex;

    public UploadDocumentUseCase(
        IDocumentStorageService storage,
        IEmbeddingService embedding,
        IVectorIndexService vectorIndex)
    {
        _storage = storage;
        _embedding = embedding;
        _vectorIndex = vectorIndex;
    }

    public async Task<UploadDocumentResponse> ExecuteAsync(
        Stream fileStream,
        string fileName,
        string extension,
        CancellationToken ct)
    {
        var documentId = Guid.NewGuid().ToString();

        // 1. Store raw file
        await _storage.UploadAsync(fileStream, fileName, ct);

        // 2. Parse text from file
        fileStream.Position = 0;
        var rawText = await ParseTextAsync(fileStream, extension);

        // 3. Chunk text
        var chunkTexts = TextChunker.Chunk(rawText);

        // 4. Embed each chunk and build domain objects
        var chunks = new List<DocumentChunk>();
        for (int i = 0; i < chunkTexts.Count; i++)
        {
            var embedding = await _embedding.GenerateEmbeddingAsync(chunkTexts[i], ct);
            chunks.Add(new DocumentChunk
            {
                Id = Guid.NewGuid().ToString(),
                DocumentId = documentId,
                Text = chunkTexts[i],
                ChunkIndex = i,
                Embedding = embedding
            });
        }

        // 5. Index chunks in vector store
        await _vectorIndex.IndexChunksAsync(documentId, chunks, ct);

        return new UploadDocumentResponse(documentId, fileName, chunks.Count);
    }

    private static async Task<string> ParseTextAsync(Stream stream, string extension)
    {
        // .txt: read directly
        // .pdf: a PDF parsing library (e.g. PdfPig) will replace this in Infrastructure
        using var reader = new StreamReader(stream, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }
}
