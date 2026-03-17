using DocuMind.Application.DTOs;
using DocuMind.Application.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace DocuMind.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly UploadDocumentUseCase _uploadUseCase;
    private readonly AskQuestionUseCase _askUseCase;

    public DocumentsController(
        UploadDocumentUseCase uploadUseCase,
        AskQuestionUseCase askUseCase)
    {
        _uploadUseCase = uploadUseCase;
        _askUseCase = askUseCase;
    }

    // POST /api/documents/upload
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(UploadDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var allowedTypes = new[] { ".pdf", ".txt" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedTypes.Contains(extension))
            return BadRequest(new { error = "Unsupported file type. Only .pdf and .txt are allowed." });

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { error = "File exceeds the 10 MB limit." });

        using var stream = file.OpenReadStream();
        var result = await _uploadUseCase.ExecuteAsync(stream, file.FileName, extension, ct);
        return Ok(result);
    }

    // POST /api/documents/{documentId}/ask
    [HttpPost("{documentId}/ask")]
    [ProducesResponseType(typeof(AskQuestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Ask(string documentId, [FromBody] AskQuestionRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(new { error = "Question cannot be empty." });

        var result = await _askUseCase.ExecuteAsync(documentId, request.Question, ct);

        if (result is null)
            return NotFound(new { error = "Document not found." });

        return Ok(result);
    }
}
