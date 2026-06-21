# 3. Async & Concurrency (HIGH)

## 3.1 Async All the Way — CRITICAL

`.Result`, `.Wait()` y `.GetAwaiter().GetResult()` bloquean el hilo: deadlocks y thread-pool starvation bajo carga. Propagar `async`/`await` de punta a punta.

**Incorrecto:**
```csharp
public Order Get(int id) => repo.GetAsync(id).Result; // bloquea el thread-pool
```
**Correcto:**
```csharp
public async Task<Order> GetAsync(int id, CancellationToken ct) => await repo.GetAsync(id, ct);
```

## 3.2 Accept and Propagate CancellationToken — HIGH

El token aborta el trabajo cuando el cliente corta la conexión, liberando hilos y conexiones de DB. Pasarlo a cada llamada async, hasta EF Core y `HttpClient`.

**Correcto:**
```csharp
app.MapGet("/orders/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
    await db.Orders.FirstOrDefaultAsync(o => o.Id == id, ct) is { } o ? Results.Ok(o) : Results.NotFound());
```

## 3.3 No async void — HIGH

`async void` no se puede esperar y sus excepciones tumban el proceso. Usar `async Task`. La única excepción son los event handlers de UI/eventos.

**Incorrecto:**
```csharp
public async void Process() => await DoWorkAsync(); // excepción => crash no observable
```
**Correcto:**
```csharp
public async Task ProcessAsync(CancellationToken ct) => await DoWorkAsync(ct);
```

## 3.4 ConfigureAwait(false) in Libraries — MEDIUM-HIGH

En código de librería reutilizable, `ConfigureAwait(false)` evita volver al contexto capturado y previene deadlocks en hosts con `SynchronizationContext`. En apps ASP.NET Core (sin contexto) no hace falta.

```csharp
var data = await httpClient.GetStringAsync(url, ct).ConfigureAwait(false);
```

## 3.5 Task.WhenAll for Parallel Independent Work — MEDIUM-HIGH

Operaciones independientes en paralelo en vez de secuencial. No compartir un `DbContext` entre tasks concurrentes (no es thread-safe): usar un scope/contexto por task.

```csharp
var (user, prefs) = (await Task.WhenAll(GetUserAsync(id, ct), GetPrefsAsync(id, ct))) switch
{
    var r => (r[0], r[1])
};
```

## 3.6 No Fire-and-Forget Without Error Handling — HIGH

Un `Task` descartado traga excepciones y puede morir al reciclar el proceso. Para trabajo en background usar un `BackgroundService` / cola, con logging del error.

_Ref: https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/async-scenarios · https://learn.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/consuming-the-task-based-asynchronous-pattern_
