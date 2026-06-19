# 2. Dependency Injection (CRITICAL)

## 2.1 Prefer Constructor Injection (Primary Constructors) — CRITICAL

Dependencias explícitas, type-safe y testeables. Con primary constructors (C# 12+) el boilerplate desaparece.

**Correcto:**
```csharp
public sealed class CreateOrderHandler(IOrderRepository repo, ILogger<CreateOrderHandler> logger)
{
    public async Task HandleAsync(CreateOrderRequest req, CancellationToken ct)
    {
        logger.LogInformation("Creating order for {Customer}", req.CustomerId);
        await repo.AddAsync(req.ToOrder(), ct);
    }
}
```

## 2.2 Use Correct Lifetimes — CRITICAL

`Scoped` para `DbContext` y handlers (una instancia por request). `Singleton` solo para servicios stateless y thread-safe. `Transient` para servicios livianos sin estado.

```csharp
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(cs)); // Scoped por defecto
builder.Services.AddScoped<CreateOrderHandler>();
builder.Services.AddSingleton<IClock, SystemClock>(); // stateless
```

## 2.3 Never Inject Scoped into Singleton — CRITICAL

Es la "captured dependency": el Singleton retiene una instancia Scoped muerta tras el primer request → datos corruptos o `ObjectDisposedException`. Resolverlo bajo demanda con un scope.

**Incorrecto:**
```csharp
public sealed class CacheWarmer(AppDbContext db) : IHostedService { } // Singleton captura DbContext Scoped
```
**Correcto:**
```csharp
public sealed class CacheWarmer(IServiceScopeFactory scopeFactory) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }
}
```

## 2.4 No Service Locator / No Manual BuildServiceProvider() — HIGH

`provider.GetService<T>()` dentro de la lógica oculta dependencias y rompe los tests. `BuildServiceProvider()` en `Program.cs` crea un container paralelo (singletons duplicados, fugas). Inyectar por constructor (2.1).

## 2.5 Register by Interface — HIGH

Registrar contra la abstracción permite sustituir implementaciones (tests, features) sin tocar consumidores.

```csharp
builder.Services.AddScoped<IOrderRepository, EfOrderRepository>();
```

## 2.6 IOptions<T> Pattern for Config — MEDIUM-HIGH

Bind tipado y validado de configuración, en vez de leer `IConfiguration` con strings por todo el código.

```csharp
builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .ValidateDataAnnotations()
    .ValidateOnStart();
// constructor(IOptions<JwtOptions> options) => _opts = options.Value;
```

_Ref: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection · https://learn.microsoft.com/en-us/dotnet/core/extensions/options_
