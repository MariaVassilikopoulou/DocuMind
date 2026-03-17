namespace DocuMind.Infrastructure.Options;

/// <summary>
/// Binds to the "AzureOpenAI" section in appsettings.json.
///
/// All three services that use Azure OpenAI (embeddings, chat, future features)
/// share the same endpoint and API key but reference different deployment names.
/// This single options class keeps them all in one config section.
/// </summary>
public class AzureOpenAIOptions
{
    public const string SectionName = "AzureOpenAI";

    /// <summary>
    /// Your Azure OpenAI resource endpoint.
    /// Found in Azure Portal → Azure OpenAI → Keys and Endpoint.
    /// Example: "https://my-openai-resource.openai.azure.com/"
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// API key for the Azure OpenAI resource (Key 1 or Key 2).
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Name of the deployment for text-embedding-ada-002.
    /// Create this in Azure Portal → Azure OpenAI → Model deployments.
    /// </summary>
    public string EmbeddingDeployment { get; set; } = "text-embedding-ada-002";

    /// <summary>
    /// Name of the deployment for GPT-4o (used by AzureOpenAIChatService).
    /// </summary>
    public string ChatDeployment { get; set; } = "gpt-4o";
}
