namespace azlobit.Models;

public record CreateContainerRequest(string Name);

public record ReconnectRequest(string ConnectionString);

public record ConnectionInfo(
    string ConnectionString,
    string AccountName,
    string AccountKey,
    string BlobEndpoint,
    string Protocol);

public record BlobItemDto(
    string Name,
    long? Size,
    string? Type,
    DateTimeOffset? LastModified,
    bool IsFolder = false);

public record SearchResultDto(
    string Container,
    string Name,
    long? Size,
    DateTimeOffset? LastModified);

public record MoveRequest(string SourceContainer, string SourceBlob, string TargetContainer, string TargetBlob);
