# Azlobit

[English](#english) | [Čeština](#čeština)

---

## English

**Azlobit** is a lightweight web tool for visualizing and managing Azure Blob Storage (including the Azurite emulator). It was created as a modern alternative for developers who need to quickly and conveniently browse the contents of their storage accounts without installing heavy applications.

### About the Project
- **Author:** Radek Ticháček
- **Target:** Exclusively for development (dev) purposes.
- **Technology:** .NET 10 (Backend), React (Frontend).

### Key Features
- 📂 **Container Management:** Create and delete containers.
- 📤 **Upload & Download:** Easy file uploading and downloading.
- 🔍 **Search:** Quickly find files across containers.
- 👁️ **Viewer:** Integrated preview for JSON, XML, JS, and other text formats with code highlighting.
- 🔄 **Auto-refresh:** Automatic file list updates every 5 seconds.
- 🚜 **Drag & Drop:** Support for moving files between containers.

### Quick Start (Docker)

The fastest way to run Azlobit is using Docker:

```powershell
# Build the image
docker build -t radek-tichacek/azlobit:latest .

# Run the container
docker run -d -p 8081:8081 --name azlobit radek-tichacek/azlobit:latest
```

The tool will be available at: **http://localhost:8081**

### Configuration

By default, the application looks for Azurite on localhost. To connect to your own storage account, use the environment variable:

`AZURE_STORAGE_CONNECTION_STRING`

### How to Use

1. **Connection:** Upon startup, Azlobit automatically tries to connect to the default emulator (Azurite). To change the connection, click the gear icon in the top right corner.
2. **Browsing:** The left panel shows a list of containers. Click a container to view its contents.
3. **File Operations:**
   - Click a file name to open the preview.
   - Use the trash icon to delete a file.
   - The download button saves the file to your computer.
4. **Uploading:** You can simply drag and drop new files into the active container or use the upload button.

---

## Čeština

**Azlobit** je lehký webový nástroj pro vizualizaci a správu Azure Blob Storage (včetně emulátoru Azurite). Byl vytvořen jako moderní alternativa pro vývojáře, kteří potřebují rychle a pohodlně procházet obsah svých storage accountů bez nutnosti instalace těžkopádných aplikací.

### O projektu
- **Autor:** Radek Ticháček
- **Určení:** Výhradně pro vývojové (dev) účely.
- **Technologie:** .NET 10 (Backend), React (Frontend).

### Hlavní funkce
- 📂 **Správa kontejnerů:** Vytváření a mazání kontejnerů.
- 📤 **Upload & Download:** Snadné nahrávání souborů a jejich stahování.
- 🔍 **Vyhledávání:** Rychlé hledání souborů napříč kontejnery.
- 👁️ **Prohlížeč:** Integrovaný náhled pro JSON, XML, JS a další textové formáty s highlightováním kódu.
- 🔄 **Auto-refresh:** Automatická aktualizace seznamu souborů každých 5 sekund.
- 🚜 **Drag & Drop:** Podpora pro přesouvání souborů mezi kontejnery.

### Rychlý start (Docker)

Nejrychlejší způsob, jak Azlobit spustit, je pomocí Dockeru:

```powershell
# Sestavení image
docker build -t radek-tichacek/azlobit:latest .

# Spuštění kontejneru
docker run -d -p 8081:8081 --name azlobit radek-tichacek/azlobit:latest
```

Nástroj bude dostupný na adrese: **http://localhost:8081**

### Konfigurace

Aplikace standardně hledá Azurite na localhostu. Pro připojení k vlastnímu storage accountu můžete použít proměnnou prostředí:

`AZURE_STORAGE_CONNECTION_STRING`

### Návod k použití

1. **Připojení:** Po spuštění se Azlobit automaticky pokusí připojit k výchozímu emulátoru (Azurite). Pokud chcete změnit připojení, klikněte na ikonu ozubeného kola v pravém horním rohu.
2. **Procházení:** V levém panelu vidíte seznam kontejnerů. Kliknutím na kontejner zobrazíte jeho obsah.
3. **Práce se soubory:**
   - Kliknutím na název souboru otevřete náhled.
   - Pomocí ikony koše soubor smažete.
   - Tlačítko pro stažení uloží soubor do vašeho počítače.
4. **Nahrávání:** Nové soubory můžete do aktivního kontejneru jednoduše přetáhnout (Drag & Drop) nebo použít tlačítko pro nahrání.

---
*Tento nástroj je poskytován "tak jak je" pro potřeby lokálního vývoje a testování.*
