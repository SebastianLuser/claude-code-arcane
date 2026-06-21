# 10. DevOps & Deployment (LOW-MEDIUM)

## 10.1 Multi-Stage Dockerfile, Non-Root User — MEDIUM

Compilar con la imagen SDK y correr sobre la imagen `aspnet` runtime reduce el tamaño y la superficie de ataque. Usar un usuario no-root limita el blast radius.

**Correcto:**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
ENTRYPOINT ["dotnet", "Api.dll"]
```

## 10.2 Health Checks (Liveness/Readiness) — MEDIUM

Los orquestadores (Kubernetes) necesitan endpoints separados: liveness (¿está vivo?) y readiness (¿puede recibir tráfico?, p. ej. DB conectada).

**Correcto:**
```csharp
builder.Services.AddHealthChecks().AddNpgSql(conn, tags: ["ready"]);
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });
```

## 10.3 Structured Logging (Serilog JSON) — MEDIUM

Logs en JSON son parseables por agregadores (Loki, ELK). Serilog con sink de consola en formato compacto facilita la observabilidad.

**Correcto:**
```csharp
builder.Host.UseSerilog((ctx, cfg) =>
    cfg.WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter()));
```

## 10.4 OpenTelemetry for Traces & Metrics — MEDIUM

OpenTelemetry instrumenta traces y métricas de forma estándar y exportable a cualquier backend OTLP.

**Correcto:**
```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddOtlpExporter());
```

## 10.5 Config per Environment & Graceful Shutdown — LOW-MEDIUM

Nunca hardcodear secrets ni connection strings: usar `appsettings.{Environment}.json` y variables de entorno. Registrar limpieza ante el shutdown con `IHostApplicationLifetime`.

**Correcto:**
```csharp
var conn = builder.Configuration.GetConnectionString("Default"); // env / appsettings, no hardcoded
app.Lifetime.ApplicationStopping.Register(() => Log.Information("Draining connections..."));
```

## 10.6 CI: build, test, format — LOW

El pipeline debe fallar ante código que no compila, tests rojos o formato inconsistente.

**Correcto:**
```yaml
steps:
  - run: dotnet restore
  - run: dotnet build --no-restore -c Release
  - run: dotnet test --no-build -c Release
  - run: dotnet format --verify-no-changes
```

_Ref: https://learn.microsoft.com/en-us/dotnet/core/docker/build-container · https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks · https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/generic-host_
