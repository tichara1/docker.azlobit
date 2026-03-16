using Azure.Storage.Blobs;

namespace azlobit.Infrastructure;

public static class AzuriteWaiter
{
    public static async Task WaitForAzuriteAsync(BlobServiceClient client, int maxRetries = 30)
    {
        for (var i = 0; i < maxRetries; i++)
        {
            try
            {
                await client.GetPropertiesAsync();
                return;
            }
            catch
            {
                if (i == 0) Console.Write("Waiting for Azurite");
                Console.Write(".");
                await Task.Delay(1000);
            }
        }

        Console.WriteLine("\nAzurite not available!");
        Environment.Exit(1);
    }
}
