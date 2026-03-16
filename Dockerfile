FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY azlobit.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8081
ENV ASPNETCORE_URLS=http://0.0.0.0:8081
ENTRYPOINT ["dotnet", "azlobit.dll"]
