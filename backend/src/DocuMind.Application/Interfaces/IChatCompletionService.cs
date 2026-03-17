namespace DocuMind.Application.Interfaces;

/// <summary>
/// Generates a natural-language answer given a system prompt and user message.
/// Production implementation: Azure OpenAI GPT-4o chat completions.
/// </summary>
public interface IChatCompletionService
{
    Task<string> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct);
}
