using Azure.Storage.Blobs;
using azlobit.Models;

namespace azlobit.Services;

public class BlobStorageService
{
    private BlobServiceClient _client;
    private string _connectionString;
    private readonly object _lock = new();

    public BlobStorageService(string connectionString)
    {
        _connectionString = connectionString;
        _client = new BlobServiceClient(connectionString);
    }

    public BlobServiceClient Client
    {
        get { lock (_lock) return _client; }
    }

    public string ConnectionString
    {
        get { lock (_lock) return _connectionString; }
    }

    public async Task ReconnectAsync(string connectionString)
    {
        var newClient = new BlobServiceClient(connectionString);
        await newClient.GetPropertiesAsync();

        lock (_lock)
        {
            _connectionString = connectionString;
            _client = newClient;
        }
    }

    public Models.ConnectionInfo GetConnectionInfo()
    {
        var cs = ConnectionString;
        var parts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var part in cs.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var eq = part.IndexOf('=');
            if (eq > 0)
            {
                parts[part[..eq]] = part[(eq + 1)..];
            }
        }

        parts.TryGetValue("AccountName", out var accountName);
        parts.TryGetValue("AccountKey", out var accountKey);
        parts.TryGetValue("BlobEndpoint", out var blobEndpoint);
        parts.TryGetValue("DefaultEndpointsProtocol", out var protocol);

        return new Models.ConnectionInfo(
            cs,
            accountName ?? string.Empty,
            accountKey ?? string.Empty,
            blobEndpoint ?? string.Empty,
            protocol ?? string.Empty);
    }
}
