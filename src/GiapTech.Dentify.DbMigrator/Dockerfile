# Build context is the repository root (docker-compose.yml build.context: .)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY NuGet.Config common.props GiapTech.Dentify.slnx ./
COPY src/ src/

RUN dotnet restore src/GiapTech.Dentify.DbMigrator/GiapTech.Dentify.DbMigrator.csproj
RUN dotnet publish src/GiapTech.Dentify.DbMigrator/GiapTech.Dentify.DbMigrator.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "GiapTech.Dentify.DbMigrator.dll"]
