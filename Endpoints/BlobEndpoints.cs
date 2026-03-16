using System.Text;
using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using azlobit.Helpers;
using azlobit.Models;
using azlobit.Services;

namespace azlobit.Endpoints;

public static class BlobEndpoints
{
    public static WebApplication MapBlobEndpoints(this WebApplication app)
    {
        app.MapGet("/api/blobs/{container}", async (BlobStorageService storage, string container, string? prefix) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            var prefixStr = prefix != null ? Uri.UnescapeDataString(prefix) : null;
            var cc = storage.Client.GetBlobContainerClient(containerName);

            var items = new List<object>();
            
            // Get blobs and virtual directories (prefixes)
            await foreach (var page in cc.GetBlobsByHierarchyAsync(prefix: prefixStr, delimiter: "/").AsPages())
            {
                foreach (var hierarchyItem in page.Values)
                {
                    if (hierarchyItem.IsPrefix)
                    {
                        items.Add(new { 
                            Name = hierarchyItem.Prefix, 
                            IsFolder = true 
                        });
                    }
                    else
                    {
                        var b = hierarchyItem.Blob;
                        items.Add(new BlobItemDto(
                            b.Name,
                            b.Properties.ContentLength,
                            b.Properties.ContentType,
                            b.Properties.LastModified,
                            false));
                    }
                }
            }

            return Results.Json(items);
        });

        app.MapGet("/api/recent-blobs", async (BlobStorageService storage) =>
        {
            var allRecent = new List<SearchResultDto>();
            await foreach (var c in storage.Client.GetBlobContainersAsync())
            {
                var cc = storage.Client.GetBlobContainerClient(c.Name);
                await foreach (var b in cc.GetBlobsAsync())
                {
                    allRecent.Add(new SearchResultDto(
                        c.Name,
                        b.Name,
                        b.Properties.ContentLength,
                        b.Properties.LastModified));
                }
            }

            var result = allRecent
                .OrderByDescending(x => x.LastModified)
                .Take(5)
                .ToList();

            return Results.Json(result);
        });

        app.MapPost("/upload/{container}", async (HttpRequest request, BlobStorageService storage, string container) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            if (!request.HasFormContentType)
            {
                return Results.Text("Missing boundary", statusCode: StatusCodes.Status400BadRequest);
            }

            var form = await request.ReadFormAsync();
            var files = form.Files;
            var cc = storage.Client.GetBlobContainerClient(containerName);
            var uploaded = 0;

            foreach (var file in files)
            {
                if (file.Length == 0) continue;
                await using var stream = file.OpenReadStream();
                var headers = new BlobHttpHeaders
                {
                    ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                        ? ContentTypeHelper.GuessType(file.FileName)
                        : file.ContentType
                };
                await cc.GetBlobClient(file.FileName).UploadAsync(stream, new BlobUploadOptions { HttpHeaders = headers });
                uploaded++;
            }

            return Results.Json(new { uploaded });
        });

        app.MapDelete("/delete/{container}/{*blob}", async (BlobStorageService storage, string container, string blob) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            var blobName = Uri.UnescapeDataString(blob ?? string.Empty);
            await storage.Client.GetBlobContainerClient(containerName).GetBlobClient(blobName).DeleteAsync();
            return Results.Json(new { deleted = blobName });
        });

        app.MapDelete("/delete-folder/{container}/{*prefix}", async (BlobStorageService storage, string container, string prefix) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            var prefixStr = Uri.UnescapeDataString(prefix ?? string.Empty);
            if (!prefixStr.EndsWith("/")) prefixStr += "/";
            
            var cc = storage.Client.GetBlobContainerClient(containerName);
            var deletedCount = 0;
            
            await foreach (var blobItem in cc.GetBlobsAsync(prefix: prefixStr))
            {
                await cc.DeleteBlobAsync(blobItem.Name);
                deletedCount++;
            }
            
            return Results.Json(new { deletedCount, prefix = prefixStr });
        });

        app.MapPut("/save/{container}/{*blob}", async (BlobStorageService storage, string container, string blob, HttpRequest request) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            var blobName = Uri.UnescapeDataString(blob ?? string.Empty);
            var bc = storage.Client.GetBlobContainerClient(containerName).GetBlobClient(blobName);

            using var reader = new StreamReader(request.Body);
            var content = await reader.ReadToEndAsync();
            var bytes = Encoding.UTF8.GetBytes(content);

            await using var stream = new MemoryStream(bytes);
            await bc.UploadAsync(stream, overwrite: true);

            return Results.Json(new { saved = blobName });
        });

        app.MapGet("/download/{container}/{*blob}", async (BlobStorageService storage, string container, string blob) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            var blobName = Uri.UnescapeDataString(blob ?? string.Empty);
            var bc = storage.Client.GetBlobContainerClient(containerName).GetBlobClient(blobName);
            var download = await bc.DownloadContentAsync();
            var contentType = download.Value.Details.ContentType ?? "application/octet-stream";
            var bytes = download.Value.Content.ToArray();
            return Results.File(bytes, contentType, fileDownloadName: blobName);
        });

        app.MapGet("/view/{container}/{*blob}", async (HttpRequest request, BlobStorageService storage, string container, string blob) =>
        {
            var containerName = Uri.UnescapeDataString(container);
            var blobName = Uri.UnescapeDataString(blob ?? string.Empty);
            var bc = storage.Client.GetBlobContainerClient(containerName).GetBlobClient(blobName);
            var download = await bc.DownloadContentAsync();
            var contentType = download.Value.Details.ContentType ?? "application/octet-stream";
            var text = Encoding.UTF8.GetString(download.Value.Content.ToArray());

            var formatted = ContentTypeHelper.EscapeHtml(text);
            if (contentType.Contains("json", StringComparison.OrdinalIgnoreCase)
                || blobName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    using var doc = JsonDocument.Parse(text);
                    formatted = ContentTypeHelper.EscapeHtml(
                        JsonSerializer.Serialize(doc, new JsonSerializerOptions { WriteIndented = true }));
                }
                catch
                {
                    // Keep raw text if JSON parsing fails
                }
            }

            var acceptHeader = request.Headers.Accept.ToString();
            if (acceptHeader.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            {
                var contentBytes = download.Value.Content.ToArray();
                return Results.Json(new
                {
                    content = formatted,
                    rawContent = text,
                    contentType,
                    size = ContentTypeHelper.FormatSize(contentBytes.Length)
                });
            }

            var target = "/#view/" + Uri.EscapeDataString(containerName) + "/" + Uri.EscapeDataString(blobName);
            return Results.Redirect(target);
        });

        app.MapGet("/search", async (BlobStorageService storage, string? q) =>
        {
            var query = (q ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(query))
            {
                return Results.Json(Array.Empty<SearchResultDto>());
            }

            var results = new List<SearchResultDto>();
            await foreach (var c in storage.Client.GetBlobContainersAsync())
            {
                var cc = storage.Client.GetBlobContainerClient(c.Name);
                await foreach (var b in cc.GetBlobsAsync())
                {
                    if (b.Name.ToLowerInvariant().Contains(query))
                    {
                        results.Add(new SearchResultDto(
                            c.Name,
                            b.Name,
                            b.Properties.ContentLength,
                            b.Properties.LastModified));
                    }
                }
            }

            return Results.Json(results);
        });

        app.MapPost("/api/move", async (BlobStorageService storage, MoveRequest req) =>
        {
            if (string.IsNullOrEmpty(req.SourceContainer) || string.IsNullOrEmpty(req.SourceBlob) ||
                string.IsNullOrEmpty(req.TargetContainer) || string.IsNullOrEmpty(req.TargetBlob))
            {
                return Results.BadRequest("Missing move parameters");
            }

            var sourceClient = storage.Client.GetBlobContainerClient(req.SourceContainer).GetBlobClient(req.SourceBlob);
            var targetClient = storage.Client.GetBlobContainerClient(req.TargetContainer).GetBlobClient(req.TargetBlob);

            // Copy
            var operation = await targetClient.StartCopyFromUriAsync(sourceClient.Uri);
            await operation.WaitForCompletionAsync();

            // Delete source
            await sourceClient.DeleteAsync();

            return Results.Json(new { ok = true });
        });

        return app;
    }
}
