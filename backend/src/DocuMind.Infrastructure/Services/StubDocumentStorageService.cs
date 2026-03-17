using DocuMind.Application.Interfaces;

namespace DocuMind.Infrastructure.Services;

/// <summary>
/// Local stub — logs the upload without touching any cloud storage.
/// Replace with AzureBlobStorageService when Azure credentials are available.
/// </summary>
public class StubDocumentStorageService : IDocumentStorageService
{
    public Task<string> UploadAsync(Stream content, string fileName, CancellationToken ct)
    {
        var fakeUri = $"https://stub-storage/documents/{Guid.NewGuid()}/{fileName}";
        Console.WriteLine($"[StubStorage] Simulated upload: {fakeUri}");
        return Task.FromResult(fakeUri);
    }
}
