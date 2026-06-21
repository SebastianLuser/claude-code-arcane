# 6. Performance (HIGH)

## 6.1 Output Caching & HybridCache — HIGH

Cachear respuestas caras evita recomputar en cada request. `HybridCache` combina cache en memoria (L1) y distribuida (L2) con stampede protection.

**Incorrecto:**
```csharp
app.MapGet("/stats", async (StatsService s) => await s.ComputeAsync()); // recomputa siempre
```
**Correcto:**
```csharp
builder.Services.AddHybridCache();

app.MapGet("/stats", async (HybridCache cache, StatsService s, CancellationToken ct) =>
    await cache.GetOrCreateAsync("stats", async token => await s.ComputeAsync(token), cancellationToken: ct));
```

## 6.2 Response Compression — HIGH

Comprimir respuestas reduce el ancho de banda y la latencia percibida en payloads JSON grandes.

**Correcto:**
```csharp
builder.Services.AddResponseCompression(o => o.EnableForHttps = true);
var app = builder.Build();
app.UseResponseCompression();
```

## 6.3 Never Block on Async (sync-over-async) — HIGH

`.Result` o `.Wait()` bloquean un hilo del thread pool y pueden causar deadlocks y thread starvation bajo carga.

**Incorrecto:**
```csharp
var user = _repo.GetUserAsync(id).Result; // bloquea el hilo
```
**Correcto:**
```csharp
var user = await _repo.GetUserAsync(id);
```

## 6.4 DbContext Pooling — MEDIUM-HIGH

Reusar instancias de `DbContext` desde un pool reduce las allocations y el costo de setup por request.

**Correcto:**
```csharp
builder.Services.AddDbContextPool<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
```

## 6.5 Stream Large Results with IAsyncEnumerable — MEDIUM

Devolver `IAsyncEnumerable<T>` transmite filas a medida que llegan en vez de materializar toda la colección en memoria.

**Correcto:**
```csharp
app.MapGet("/orders", (AppDbContext db) =>
    db.Orders.AsNoTracking().AsAsyncEnumerable()); // streaming, server GC ayuda en cargas altas
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid · https://learn.microsoft.com/en-us/aspnet/core/performance/response-compression · https://learn.microsoft.com/en-us/ef/core/performance/advanced-performance-topics_
