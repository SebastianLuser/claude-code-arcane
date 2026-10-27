# 10. DevOps & Deployment (LOW-MEDIUM)

## 10.1 Multi-Stage Dockerfile, Non-Root User — MEDIUM

Building with the SDK image and running on the `aspnet` runtime image reduces size and attack surface. Using a non-root user limits the blast radius.

**Correct:**
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

Orchestrators (Kubernetes) need separate endpoints: liveness (is it alive?) and readiness (can it take traffic?, e.g. DB connected).

**Correct:**
```csharp
builder.Services.AddHealthChecks().AddNpgSql(conn, tags: ["ready"]);
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });
```

## 10.3 Structured Logging (Serilog JSON) — MEDIUM

JSON logs can be parsed by aggregators (Loki, ELK). Serilog with a console sink in compact format makes observability easier.

**Correct:**
```csharp
builder.Host.UseSerilog((ctx, cfg) =>
    cfg.WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter()));
```

## 10.4 OpenTelemetry for Traces & Metrics — MEDIUM

OpenTelemetry instruments traces and metrics in a standard way, exportable to any OTLP backend.

**Correct:**
```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddAspNetCoreInstrumentation().AddOtlpExporter())
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddOtlpExporter());
```

## 10.5 Config per Environment & Graceful Shutdown — LOW-MEDIUM

Never hardcode secrets or connection strings: use `appsettings.{Environment}.json` and environment variables. Register shutdown cleanup with `IHostApplicationLifetime`.

**Correct:**
```csharp
var conn = builder.Configuration.GetConnectionString("Default"); // env / appsettings, not hardcoded
app.Lifetime.ApplicationStopping.Register(() => Log.Information("Draining connections..."));
```

## 10.6 CI: build, test, format — LOW

The pipeline must fail on code that does not compile, red tests or inconsistent formatting.

**Correct:**
```yaml
steps:
  - run: dotnet restore
  - run: dotnet build --no-restore -c Release
  - run: dotnet test --no-build -c Release
  - run: dotnet format --verify-no-changes
```

_Ref: https://learn.microsoft.com/en-us/dotnet/core/docker/build-container · https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks · https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/generic-host_
