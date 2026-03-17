namespace DocuMind.Application.DTOs;

public record UploadDocumentResponse(
    string DocumentId,
    string FileName,
    int ChunkCount
);
