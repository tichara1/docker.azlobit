using System.Text.Json;
using System.Text.Json.Serialization;
using azlobit.Endpoints;
using azlobit.Infrastructure;
using azlobit.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

var connStr = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING")
    ?? "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;";

var storage = new BlobStorageService(connStr);
builder.Services.AddSingleton(storage);

var app = builder.Build();

const int Port = 8081;
app.Urls.Add($"http://0.0.0.0:{Port}");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapContainerEndpoints();
app.MapBlobEndpoints();
app.MapConnectionEndpoints();

await AzuriteWaiter.WaitForAzuriteAsync(storage.Client);
await BlobSeeder.SeedFromDirAsync("/seed", storage.Client);

await app.RunAsync();

