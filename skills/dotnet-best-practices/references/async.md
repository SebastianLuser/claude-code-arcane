# 3. Async & Concurrency (HIGH)

## 3.1 Async All the Way — CRITICAL

`.Result`, `.Wait()` and `.GetAwaiter().GetResult()` block the thread: deadlocks and thread-pool starvation under load. Propagate `async`/`await` end to end.

**Incorrect:**
```csharp
public Order Get(int id) => repo.GetAsync(id).Result; // blocks the thread pool
```
**Correct:**
```csharp
public async Task<Order> GetAsync(int id, CancellationToken ct) => await repo.GetAsync(id, ct);
```

## 3.2 Accept and Propagate CancellationToken — HIGH

The token aborts the work when the client drops the connection, freeing threads and DB connections. Pass it to every async call, all the way down to EF Core and `HttpClient`.

**Correct:**
```csharp
app.MapGet("/orders/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
    await db.Orders.FirstOrDefaultAsync(o => o.Id == id, ct) is { } o ? Results.Ok(o) : Results.NotFound());
```

## 3.3 No async void — HIGH

`async void` cannot be awaited and its exceptions bring the process down. Use `async Task`. The only exception is UI/event handlers.

**Incorrect:**
```csharp
public async void Process() => await DoWorkAsync(); // exception => unobservable crash
```
**Correct:**
```csharp
public async Task ProcessAsync(CancellationToken ct) => await DoWorkAsync(ct);
```

## 3.4 ConfigureAwait(false) in Libraries — MEDIUM-HIGH

In reusable library code, `ConfigureAwait(false)` avoids returning to the captured context and prevents deadlocks in hosts with a `SynchronizationContext`. ASP.NET Core apps (no context) do not need it.

```csharp
var data = await httpClient.GetStringAsync(url, ct).ConfigureAwait(false);
```

## 3.5 Task.WhenAll for Parallel Independent Work — MEDIUM-HIGH

Independent operations in parallel instead of sequentially. Do not share a `DbContext` between concurrent tasks (it is not thread-safe): use one scope/context per task.

```csharp
var (user, prefs) = (await Task.WhenAll(GetUserAsync(id, ct), GetPrefsAsync(id, ct))) switch
{
    var r => (r[0], r[1])
};
```

## 3.6 No Fire-and-Forget Without Error Handling — HIGH

A discarded `Task` swallows exceptions and can die when the process recycles. For background work use a `BackgroundService` / queue, logging the error.

_Ref: https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios · https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/consuming-the-task-based-asynchronous-pattern_
