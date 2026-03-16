using azlobit.Models;
using azlobit.Services;

namespace azlobit.Endpoints;

public static class ContainerEndpoints
{
    public static WebApplication MapContainerEndpoints(this WebApplication app)
    {
        app.MapGet("/api/containers", async (BlobStorageService storage) =>
        {
            var containers = new List<string>();
            await foreach (var c in storage.Client.GetBlobContainersAsync())
            {
                containers.Add(c.Name);
            }
            return Results.Json(containers);
        });

        app.MapPost("/api/containers", async (BlobStorageService storage, CreateContainerRequest req) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
            {
                return Results.Json(new { error = "Missing name" }, statusCode: StatusCodes.Status400BadRequest);
            }

            var cc = storage.Client.GetBlobContainerClient(req.Name.Trim());
            await cc.CreateAsync();
            return Results.Json(new { created = req.Name.Trim() }, statusCode: StatusCodes.Status201Created);
        });

        app.MapDelete("/api/containers/{name}", async (BlobStorageService storage, string name) =>
        {
            var containerName = Uri.UnescapeDataString(name);
            await storage.Client.GetBlobContainerClient(containerName).DeleteAsync();
            return Results.Json(new { deleted = containerName });
        });

        return app;
    }
}
