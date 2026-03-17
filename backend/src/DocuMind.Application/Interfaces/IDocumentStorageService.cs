namespace DocuMind.Application.Interfaces;

/// <summary>
/// Stores and retrieves raw document files.
/// Production implementation: Azure Blob Storage.
/// </summary>
public interface IDocumentStorageService
{
    Task<string> UploadAsync(Stream content, string fileName, CancellationToken ct);
}
