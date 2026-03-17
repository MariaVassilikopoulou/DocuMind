namespace DocuMind.Infrastructure.Options;

/// <summary>
/// Binds to the "AzureStorage" section in appsettings.json.
/// In production these values come from environment variables or Key Vault,
/// never from a committed config file.
/// </summary>
public class AzureStorageOptions
{
    public const string SectionName = "AzureStorage";

    /// <summary>
    /// Full connection string from the Azure Portal → Storage Account → Access keys.
    /// Example: "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Name of the blob container that stores uploaded documents.
    /// The container is created automatically on startup if it does not exist.
    /// </summary>
    public string ContainerName { get; set; } = "documents";
}
