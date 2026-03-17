namespace DocuMind.Application;

/// <summary>
/// Splits raw document text into overlapping word-based chunks.
/// Strategy: fixed-size (500 words) with 50-word overlap to preserve
/// sentence context across chunk boundaries.
/// </summary>
public static class TextChunker
{
    public static List<string> Chunk(string text, int chunkSize = 500, int overlap = 50)
    {
        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var chunks = new List<string>();
        var step = chunkSize - overlap;

        for (int i = 0; i < words.Length; i += step)
        {
            var slice = words.Skip(i).Take(chunkSize);
            chunks.Add(string.Join(" ", slice));

            if (i + chunkSize >= words.Length)
                break;
        }

        return chunks;
    }
}
