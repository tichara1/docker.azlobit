namespace azlobit.Helpers;

public static class ContentTypeHelper
{
    public static string GuessType(string name)
    {
        if (name.EndsWith(".xml", StringComparison.OrdinalIgnoreCase)) return "application/xml";
        if (name.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) return "application/json";
        if (name.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)) return "text/plain";
        return "application/octet-stream";
    }

    public static string FormatSize(long bytes)
    {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024d).ToString("0.0") + " KB";
        return (bytes / 1048576d).ToString("0.0") + " MB";
    }

    public static string EscapeHtml(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return input
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;");
    }
}
