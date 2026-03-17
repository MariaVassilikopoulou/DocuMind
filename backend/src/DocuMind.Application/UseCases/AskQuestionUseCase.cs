using DocuMind.Application.DTOs;
using DocuMind.Application.Interfaces;
using DocuMind.Domain.Entities;

namespace DocuMind.Application.UseCases;

public class AskQuestionUseCase
{
    private readonly IEmbeddingService _embedding;
    private readonly IVectorIndexService _vectorIndex;
    private readonly IChatCompletionService _chat;

    public AskQuestionUseCase(
        IEmbeddingService embedding,
        IVectorIndexService vectorIndex,
        IChatCompletionService chat)
    {
        _embedding = embedding;
        _vectorIndex = vectorIndex;
        _chat = chat;
    }

    public async Task<AskQuestionResponse?> ExecuteAsync(
        string documentId,
        string question,
        CancellationToken ct)
    {
        // 1. Embed the question using the same model used for chunks
        var questionEmbedding = await _embedding.GenerateEmbeddingAsync(question, ct);

        // 2. Retrieve top-5 most relevant chunks by vector similarity
        var chunks = await _vectorIndex.SearchAsync(documentId, questionEmbedding, topK: 5, ct);

        if (chunks.Count == 0)
            return null;

        // 3. Build grounded RAG prompt
        var systemPrompt = BuildSystemPrompt(chunks);

        // 4. Call LLM
        var answer = await _chat.CompleteAsync(systemPrompt, question, ct);

        // 5. Map retrieved chunks to citation DTOs
        var citations = chunks.Select(c => new CitationDto(
            c.ChunkIndex,
            c.PageNumber,
            c.Text.Length > 200 ? c.Text[..200] + "..." : c.Text
        )).ToList();

        return new AskQuestionResponse(answer, citations);
    }

    private static string BuildSystemPrompt(List<DocumentChunk> chunks)
    {
        var context = string.Join("\n\n", chunks.Select((c, i) => $"[{i + 1}] {c.Text}"));

        return $"""
            You are a document assistant. Answer the user's question using ONLY the document excerpts below.
            For each claim, cite the excerpt number in brackets, e.g. [1].
            If the answer cannot be found in the excerpts, respond with:
            "I cannot find this information in the document."

            Document Excerpts:
            {context}
            """;
    }
}
