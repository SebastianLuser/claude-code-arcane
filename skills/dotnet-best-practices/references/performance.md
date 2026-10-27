# 6. Performance (HIGH)

## 6.1 Output Caching & HybridCache — HIGH

Caching expensive responses avoids recomputing them on every request. `HybridCache` combines in-memory (L1) and distributed (L2) cache with stampede protection.

**Incorrect:**
```csharp
app.MapGet("/stats", async (StatsService s) => await s.ComputeAsync()); // always recomputes
```
**Correct:**
```csharp
builder.Services.AddHybridCache();

app.MapGet("/stats", async (HybridCache cache, StatsService s, CancellationToken ct) =>
    await cache.GetOrCreateAsync("stats", async token => await s.ComputeAsync(token), cancellationToken: ct));
```

## 6.2 Response Compression — HIGH

Compressing responses reduces bandwidth and perceived latency on large JSON payloads.

**Correct:**
```csharp
builder.Services.AddResponseCompression(o => o.EnableForHttps = true);
var app = builder.Build();
app.UseResponseCompression();
```

## 6.3 Never Block on Async (sync-over-async) — HIGH

`.Result` or `.Wait()` block a thread-pool thread and can cause deadlocks and thread starvation under load.

**Incorrect:**
```csharp
var user = _repo.GetUserAsync(id).Result; // blocks the thread
```
**Correct:**
```csharp
var user = await _repo.GetUserAsync(id);
```

## 6.4 DbContext Pooling — MEDIUM-HIGH

Reusing `DbContext` instances from a pool reduces allocations and the per-request setup cost.

**Correct:**
```csharp
builder.Services.AddDbContextPool<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
```

## 6.5 Stream Large Results with IAsyncEnumerable — MEDIUM

Returning `IAsyncEnumerable<T>` streams rows as they arrive instead of materializing the whole collection in memory.

**Correct:**
```csharp
app.MapGet("/orders", (AppDbContext db) =>
    db.Orders.AsNoTracking().AsAsyncEnumerable()); // streaming, server GC helps under heavy load
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid · https://learn.microsoft.com/en-us/aspnet/core/performance/response-compression · https://learn.microsoft.com/en-us/ef/core/performance/advanced-performance-topics_
