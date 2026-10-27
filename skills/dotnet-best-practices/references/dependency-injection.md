# 2. Dependency Injection (CRITICAL)

## 2.1 Prefer Constructor Injection (Primary Constructors) — CRITICAL

Explicit, type-safe and testable dependencies. With primary constructors (C# 12+) the boilerplate disappears.

**Correct:**
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

`Scoped` for `DbContext` and handlers (one instance per request). `Singleton` only for stateless, thread-safe services. `Transient` for lightweight stateless services.

```csharp
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(cs)); // Scoped by default
builder.Services.AddScoped<CreateOrderHandler>();
builder.Services.AddSingleton<IClock, SystemClock>(); // stateless
```

## 2.3 Never Inject Scoped into Singleton — CRITICAL

This is the "captured dependency": the Singleton holds on to a dead Scoped instance after the first request → corrupted data or `ObjectDisposedException`. Resolve it on demand with a scope.

**Incorrect:**
```csharp
public sealed class CacheWarmer(AppDbContext db) : IHostedService { } // Singleton captures a Scoped DbContext
```
**Correct:**
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

`provider.GetService<T>()` inside the logic hides dependencies and breaks the tests. `BuildServiceProvider()` in `Program.cs` creates a parallel container (duplicate singletons, leaks). Inject through the constructor (2.1).

## 2.5 Register by Interface — HIGH

Registering against the abstraction lets you swap implementations (tests, features) without touching consumers.

```csharp
builder.Services.AddScoped<IOrderRepository, EfOrderRepository>();
```

## 2.6 IOptions<T> Pattern for Config — MEDIUM-HIGH

Typed, validated configuration binding, instead of reading `IConfiguration` with strings throughout the code.

```csharp
builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection("Jwt"))
    .ValidateDataAnnotations()
    .ValidateOnStart();
// constructor(IOptions<JwtOptions> options) => _opts = options.Value;
```

_Ref: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection · https://learn.microsoft.com/en-us/dotnet/core/extensions/options_
