namespace DocuMind.Application.DTOs;

public record AskQuestionResponse(
    string Answer,
    List<CitationDto> Citations
);

public record CitationDto(
    int ChunkIndex,
    int? PageNumber,
    string Excerpt
);
