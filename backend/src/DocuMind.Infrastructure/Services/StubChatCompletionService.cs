using DocuMind.Application.Interfaces;

namespace DocuMind.Infrastructure.Services;

/// <summary>
/// Local stub — echoes the prompt back as a fake answer.
/// Replace with AzureOpenAIChatService when Azure credentials are available.
/// </summary>
public class StubChatCompletionService : IChatCompletionService
{
    public Task<string> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct)
    {
        Console.WriteLine($"[StubChat] Received question: {userMessage}");
        var fakeAnswer = $"[STUB ANSWER] You asked: \"{userMessage}\". " +
                         "This is a placeholder response. Wire up Azure OpenAI to get real answers.";
        return Task.FromResult(fakeAnswer);
    }
}
