# Build context is the repository root (docker-compose.yml build.context: .)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY NuGet.Config common.props GiapTech.Dentify.slnx ./
COPY src/ src/

RUN dotnet restore src/GiapTech.Dentify.Web/GiapTech.Dentify.Web.csproj
RUN dotnet publish src/GiapTech.Dentify.Web/GiapTech.Dentify.Web.csproj -c Release -o /app/publish --no-restore

# Placeholder OpenIddict signing/encryption certificate so the app can run with
# ASPNETCORE_ENVIRONMENT=Production (required for the embedded-resource virtual file
# system + precompiled Razor views to work from a published container) without needing
# a real one. Passphrase must match AuthServer:CertificatePassPhrase at runtime - the
# default here matches appsettings.json's default. Replace with a real certificate for
# an actual production deployment.
ARG OPENIDDICT_CERT_PASSPHRASE=7dabb9a6-c18d-430e-9078-a1d97b3a5e45
RUN dotnet dev-certs https -v -ep /app/publish/openiddict.pfx -p "$OPENIDDICT_CERT_PASSPHRASE"

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "GiapTech.Dentify.Web.dll"]
