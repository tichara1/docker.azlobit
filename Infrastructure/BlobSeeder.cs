using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using azlobit.Helpers;

namespace azlobit.Infrastructure;

public static class BlobSeeder
{
    public static async Task SeedFromDirAsync(string seedPath, BlobServiceClient client)
    {
        if (!Directory.Exists(seedPath)) return;

        Console.WriteLine($"Seeding blobs from {seedPath} ...");
        foreach (var dir in Directory.EnumerateDirectories(seedPath))
        {
            var containerName = Path.GetFileName(dir);
            var cc = client.GetBlobContainerClient(containerName);
            try
            {
                await cc.CreateAsync();
                Console.WriteLine($"  Created container: {containerName}");
            }
            catch
            {
                Console.WriteLine($"  Container exists:  {containerName}");
            }

            foreach (var filePath in Directory.EnumerateFiles(dir))
            {
                var fileName = Path.GetFileName(filePath);
                var data = await File.ReadAllBytesAsync(filePath);
                var headers = new BlobHttpHeaders { ContentType = ContentTypeHelper.GuessType(fileName) };
                await cc.GetBlobClient(fileName).UploadAsync(
                    new BinaryData(data),
                    new BlobUploadOptions { HttpHeaders = headers });
                Console.WriteLine($"  Uploaded: {containerName}/{fileName}");
            }
        }

        Console.WriteLine("Seed complete.");
    }
}
