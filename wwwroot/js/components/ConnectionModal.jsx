function CodeBlock({ code, lang }) {
  const ref = React.useRef();
  React.useEffect(() => {
    if (ref.current && window.Prism) Prism.highlightElement(ref.current);
  }, [code]);
  return (
    <pre className="conn-code-block">
      <code ref={ref} className={`language-${lang}`}>{code}</code>
    </pre>
  );
}

function ConnectionModal({ onClose, showToast }) {
  const [info, setInfo] = React.useState(null);
  const [newConn, setNewConn] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [tab, setTab] = React.useState('info');

  React.useEffect(() => {
    fetch('/api/connection-info').then(r => r.json()).then(setInfo).catch(() => {});
  }, []);

  const doReconnect = async () => {
    if (!newConn.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: newConn.trim() })
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'HTTP ' + r.status); }
      showToast('Pripojeno!');
      onClose(true);
    } catch (e) { showToast('Chyba: ' + e.message); }
    setLoading(false);
  };

  const copy = (val) => {
    navigator.clipboard.writeText(val).then(() => showToast('Zkopirovano!'));
  };

  const TABS = [
    { id: 'info',       label: 'Info' },
    { id: 'dotnet',     label: '.NET' },
    { id: 'java',       label: 'Java' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python',     label: 'Python' },
    { id: 'cli',        label: 'Azure CLI' },
  ];

  const getSnippets = (info) => {
    const cs          = info?.connectionString || '';
    const accountName = info?.accountName      || '';
    const accountKey  = info?.accountKey       || '';

    return {
      dotnet: {
        install: {
          lang: 'bash',
          code: `dotnet add package Azure.Storage.Blobs`,
        },
        code: {
          lang: 'csharp',
          value:
`using Azure.Storage.Blobs;

var connStr = "${cs}";
var serviceClient = new BlobServiceClient(connStr);

// Ziskat kontejner
var container = serviceClient.GetBlobContainerClient("muj-kontejner");
await container.CreateIfNotExistsAsync();

// Nahrat blob
var blob = container.GetBlobClient("soubor.txt");
await blob.UploadAsync(BinaryData.FromString("Hello World!"), overwrite: true);

// Stahovat blob
var response = await blob.DownloadContentAsync();
string content = response.Value.Content.ToString();

// Vypsat blobs
await foreach (var item in container.GetBlobsAsync())
    Console.WriteLine(item.Name);`,
        },
      },

      java: {
        install: {
          lang: 'markup',
          code:
`<!-- Maven (pom.xml) -->
<dependency>
  <groupId>com.azure</groupId>
  <artifactId>azure-storage-blob</artifactId>
  <version>12.28.0</version>
</dependency>

// Gradle (build.gradle)
implementation 'com.azure:azure-storage-blob:12.28.0'`,
        },
        code: {
          lang: 'java',
          value:
`import com.azure.storage.blob.*;

String connStr = "${cs}";
BlobServiceClient serviceClient = new BlobServiceClientBuilder()
    .connectionString(connStr)
    .buildClient();

// Ziskat kontejner
BlobContainerClient container =
    serviceClient.getBlobContainerClient("muj-kontejner");
container.createIfNotExists();

// Nahrat blob
BlobClient blob = container.getBlobClient("soubor.txt");
blob.upload(BinaryData.fromString("Hello World!"), true);

// Stahovat blob
BinaryData data = blob.downloadContent();
System.out.println(data.toString());

// Vypsat blobs
container.listBlobs().forEach(b -> System.out.println(b.getName()));`,
        },
      },

      javascript: {
        install: {
          lang: 'bash',
          code: `npm install @azure/storage-blob`,
        },
        code: {
          lang: 'javascript',
          value:
`import { BlobServiceClient } from "@azure/storage-blob";

const connStr = "${cs}";
const serviceClient = BlobServiceClient.fromConnectionString(connStr);

// Ziskat kontejner
const container = serviceClient.getContainerClient("muj-kontejner");
await container.createIfNotExists();

// Nahrat blob
const blob = container.getBlockBlobClient("soubor.txt");
await blob.upload("Hello World!", Buffer.byteLength("Hello World!"));

// Stahovat blob
const download = await blob.download();
const text = (await streamToBuffer(download.readableStreamBody)).toString();

// Vypsat blobs
for await (const item of container.listBlobsFlat()) {
  console.log(item.name);
}`,
        },
      },

      python: {
        install: {
          lang: 'bash',
          code: `pip install azure-storage-blob`,
        },
        code: {
          lang: 'python',
          value:
`from azure.storage.blob import BlobServiceClient

conn_str = "${cs}"
service_client = BlobServiceClient.from_connection_string(conn_str)

# Ziskat kontejner
container = service_client.get_container_client("muj-kontejner")
container.create_container()

# Nahrat blob
blob = container.get_blob_client("soubor.txt")
blob.upload_blob("Hello World!", overwrite=True)

# Stahovat blob
stream = blob.download_blob()
content = stream.readall().decode("utf-8")
print(content)

# Vypsat blobs
for b in container.list_blobs():
    print(b.name)`,
        },
      },

      cli: {
        install: {
          lang: 'bash',
          code:
`# Azure CLI
az extension add --name storage-preview

# PowerShell Az modul
Install-Module -Name Az.Storage -Force`,
        },
        code: {
          lang: 'bash',
          value:
`# Nastavit promennou prostredi
export AZURE_STORAGE_CONNECTION_STRING="${cs}"

# Vypsat kontejnery
az storage container list \\
  --connection-string "${cs}"

# Nahrat soubor
az storage blob upload \\
  --container-name muj-kontejner \\
  --file ./soubor.txt \\
  --name soubor.txt \\
  --connection-string "${cs}"

# Stahovat soubor
az storage blob download \\
  --container-name muj-kontejner \\
  --name soubor.txt \\
  --file ./stazeno.txt \\
  --connection-string "${cs}"

# PowerShell
$ctx = New-AzStorageContext -ConnectionString "${cs}"
Get-AzStorageBlob -Container muj-kontejner -Context $ctx`,
        },
      },
    };
  };

  const fields = info ? [
    { label: 'Connection String', value: info.connectionString },
    { label: 'Account Name',      value: info.accountName },
    { label: 'Account Key',       value: info.accountKey },
    { label: 'Blob Endpoint',     value: info.blobEndpoint },
  ] : [];

  const snippets       = getSnippets(info);
  const currentSnippet = tab !== 'info' ? snippets[tab] : null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(false); }}>
      <div className="modal modal-wide">
        <h2>&#128279; Connection Info</h2>

        <div className="conn-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={'conn-tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>

        {tab === 'info' && (
          <>
            {info ? fields.map(f => (
              <div className="modal-row" key={f.label}>
                <label>{f.label}</label>
                <div className="value-row">
                  <input type="text" readOnly value={f.value} />
                  <button className="btn btn-sm" onClick={() => copy(f.value)}>Copy</button>
                </div>
              </div>
            )) : <div className="loading-state"><div className="spinner" /></div>}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' }} />
            <h2>Reconnect</h2>
            <div className="modal-row">
              <label>Novy Connection String</label>
              <textarea value={newConn} onChange={e => setNewConn(e.target.value)}
                placeholder="DefaultEndpointsProtocol=http;AccountName=..." />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => onClose(false)}>Zavrit</button>
              <button className="btn btn-primary" onClick={doReconnect} disabled={loading}>
                {loading ? 'Pripojovani...' : 'Reconnect'}
              </button>
            </div>
          </>
        )}

        {tab !== 'info' && (
          <>
            {!info ? (
              <div className="loading-state"><div className="spinner" /></div>
            ) : (
              <>
                <div className="conn-section-label">Instalace</div>
                <div className="conn-install-block">
                  <pre className="conn-install-pre">{currentSnippet.install.code}</pre>
                  <button
                    className="btn btn-sm conn-install-copy"
                    onClick={() => copy(currentSnippet.install.code)}
                  >Copy</button>
                </div>

                <div className="conn-section-label" style={{ marginTop: 16 }}>Pripojeni &amp; pouziti</div>
                <div className="conn-code-wrapper">
                  <button
                    className="btn btn-sm conn-copy-code"
                    onClick={() => copy(currentSnippet.code.value)}
                  >Copy</button>
                  <CodeBlock code={currentSnippet.code.value} lang={currentSnippet.code.lang} />
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => onClose(false)}>Zavrit</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
