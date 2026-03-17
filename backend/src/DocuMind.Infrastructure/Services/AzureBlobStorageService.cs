using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using DocuMind.Application.Interfaces;

namespace DocuMind.Infrastructure.Services;

/// <summary>
/// Stores uploaded documents in Azure Blob Storage.
///
/// Each document is saved under a GUID-prefixed path so that two uploads of
/// a file with the same name never collide:
///   container/
///     {guid}/{originalFileName}   e.g. 3fa8.../contract.pdf
///
/// The blob URI returned here is not persisted anywhere yet (no database).
/// It is returned to the caller purely for logging / future use.
/// A natural next step is to store it alongside the documentId in a
/// database table so the file can be re-downloaded later.
/// </summary>
public class AzureBlobStorageService : IDocumentStorageService
{
    private readonly BlobContainerClient _container;

    // BlobContainerClient is injected — registered as a singleton in
    // DependencyInjection.cs. This keeps the service itself easily unit-testable:
    // pass in a mock/fake BlobContainerClient without any real Azure calls.
    public AzureBlobStorageService(BlobContainerClient container)
    {
        _container = container;
    }

    public async Task<string> UploadAsync(Stream content, string fileName, CancellationToken ct)
    {
        // GUID prefix guarantees uniqueness even if two users upload files with
        // the same name at the same time.
        var blobName = $"{Guid.NewGuid()}/{fileName}";
        var blobClient = _container.GetBlobClient(blobName);

        // Set the Content-Type header so that Azure serves the file with the
        // correct MIME type if it is ever accessed directly via a browser.
        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders
            {
                ContentType = ResolveContentType(fileName),
            },
        };

        await blobClient.UploadAsync(content, uploadOptions, ct);

        // Return the full blob URI, e.g.:
        // https://<account>.blob.core.windows.net/documents/<guid>/contract.pdf
        return blobClient.Uri.ToString();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static string ResolveContentType(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".pdf" => "application/pdf",
            ".txt" => "text/plain; charset=utf-8",
            _      => "application/octet-stream",
        };
}
