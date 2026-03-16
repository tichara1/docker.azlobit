# Azlobit - Gemini Context

Azlobit is a lightweight, web-based tool for visualizing and managing Azure Blob Storage and Azurite. It's designed specifically for developers as a modern, "zero-install" alternative to heavy storage explorer applications.

## Project Overview

- **Purpose:** Fast and convenient browsing, management, and preview of Azure Blob Storage contents.
- **Backend:** ASP.NET Core (Minimal APIs) on .NET 10.
- **Frontend:** React 18, utilizing `@babel/standalone` for runtime JSX transpilation (no build step for the frontend).
- **Core SDK:** `Azure.Storage.Blobs` (v12.25.0).
- **Architecture:** 
    - **Backend:** Organized into `Endpoints`, `Services`, `Models`, `Infrastructure`, and `Helpers`.
    - **Frontend:** Single Page Application (SPA) located in `wwwroot`, with React components in `wwwroot/js/components`.

## Building and Running

### Locally (.NET CLI)

1.  **Run the application:**
    ```powershell
    dotnet run
    ```
2.  **Access the UI:** Open [http://localhost:8081](http://localhost:8081) in your browser.
    *Note: The application listens on port 8081 by default as configured in `Program.cs`.*

### Using Docker

1.  **Build the image:**
    ```powershell
    docker build -t radek-tichacek/azlobit:latest .
    ```
2.  **Run the container:**
    ```powershell
    docker run -d -p 8081:8081 --name azlobit radek-tichacek/azlobit:latest
    ```

## Development Conventions

### Backend (C#)
- **Minimal APIs:** Endpoints are mapped in static classes under the `Endpoints` namespace (e.g., `BlobEndpoints`, `ContainerEndpoints`).
- **Dependency Injection:** `BlobStorageService` is registered as a singleton to manage the `BlobServiceClient`.
- **Naming:** Follows standard .NET naming conventions (PascalCase for classes/methods, camelCase for parameters).
- **Error Handling:** Minimal explicit error handling in current endpoints; relies on ASP.NET Core defaults.

### Frontend (React/JSX)
- **Runtime Transpilation:** JSX files in `wwwroot/js` are transpiled by Babel in the browser. Do not introduce a complex build step (like Webpack/Vite) unless requested.
- **CDN Dependencies:** React, ReactDOM, Babel, and Prism.js are loaded via CDN in `index.html`.
- **Components:** Functional components are preferred. Components are separated into individual `.jsx` files in `wwwroot/js/components`.
- **State Management:** Uses standard React hooks (`useState`, `useEffect`).

### Storage Configuration
- **Connection String:** Defaults to Azurite on localhost. Can be overridden using the `AZURE_STORAGE_CONNECTION_STRING` environment variable.
- **Seeding:** The application attempts to seed blobs from a `/seed` directory during startup (see `BlobSeeder.cs`).

## Key Files
- `Program.cs`: Entry point, configures the web host and maps endpoints.
- `Endpoints/`: Contains API route definitions.
- `Services/BlobStorageService.cs`: Encapsulates interactions with the Azure Storage SDK.
- `wwwroot/js/App.jsx`: Main React application logic.
- `wwwroot/index.html`: Main entry point for the frontend, includes all script references.
