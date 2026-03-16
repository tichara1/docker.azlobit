using azlobit.Models;
using azlobit.Services;

namespace azlobit.Endpoints;

public static class ConnectionEndpoints
{
    public static WebApplication MapConnectionEndpoints(this WebApplication app)
    {
        app.MapGet("/api/connection-info", (BlobStorageService storage) =>
        {
            return Results.Json(storage.GetConnectionInfo());
        });

        app.MapPost("/api/reconnect", async (BlobStorageService storage, ReconnectRequest req) =>
        {
            if (string.IsNullOrWhiteSpace(req.ConnectionString))
            {
                return Results.Json(
                    new { error = "Missing connectionString" },
                    statusCode: StatusCodes.Status400BadRequest);
            }

            try
            {
                await storage.ReconnectAsync(req.ConnectionString.Trim());
                return Results.Json(new { ok = true });
            }
            catch (Exception ex)
            {
                return Results.Json(
                    new { error = "Connection failed: " + ex.Message },
                    statusCode: StatusCodes.Status400BadRequest);
            }
        });

        return app;
    }
}
