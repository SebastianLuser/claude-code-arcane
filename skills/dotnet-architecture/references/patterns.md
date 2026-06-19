# Patrones Idiomáticos (.NET 10 / ASP.NET Core)

## Handler por caso de uso

Un request (record) + un handler. Con MediatR o con un sender hand-rolled mínimo.

```csharp
public sealed record CreateOrder(Guid CustomerId, decimal Amount) : IRequest<Result<Guid>>;

internal sealed class CreateOrderHandler(IApplicationDbContext db)
    : IRequestHandler<CreateOrder, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateOrder cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Amount);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);
        return order.Id;
    }
}
```

## IApplicationDbContext (EF Core detrás de una interfaz, sin repo genérico)

Exponé el `DbContext` a través de una interfaz en `Application`; implementala en
`Infrastructure`. El `DbContext` ya es Unit of Work + repositorio: no lo envuelvas.

```csharp
// Application/Common/IApplicationDbContext.cs
public interface IApplicationDbContext
{
    DbSet<Order> Orders { get; }
    DbSet<Customer> Customers { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

// Infrastructure/Persistence/AppDbContext.cs
public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Customer> Customers => Set<Customer>();
}
```

## Pipeline behaviors (validación, logging, transacción)

Cross-cutting concerns alrededor de cada handler, sin ensuciar la lógica.

```csharp
public sealed class ValidationBehavior<TReq, TRes>(IEnumerable<IValidator<TReq>> validators)
    : IPipelineBehavior<TReq, TRes> where TReq : notnull
{
    public async Task<TRes> Handle(TReq req, RequestHandlerDelegate<TRes> next, CancellationToken ct)
    {
        foreach (var v in validators)
        {
            var result = await v.ValidateAsync(req, ct);
            if (!result.IsValid) throw new ValidationException(result.Errors);
        }
        return await next();
    }
}
```

Un `TransactionBehavior` similar abre `BeginTransactionAsync` antes de `next()` y
hace commit/rollback alrededor: el UnitOfWork vive acá, no en repos a mano.

## Result pattern para fallos esperados

No tires excepciones para flujo de negocio esperado (not found, validación, conflicto).
Devolvé `Result<T>` (o `ErrorOr<T>`) y mapealo a HTTP en el endpoint.

```csharp
public readonly record struct Error(string Code, string Message);

public async Task<Result<OrderDto>> Handle(GetOrder q, CancellationToken ct)
{
    var order = await db.Orders.FindAsync([q.Id], ct);
    return order is null
        ? new Error("Order.NotFound", "Order no existe")
        : order.ToDto();
}
```

## Outbox pattern (consistencia DB + eventos)

Para publicar eventos de forma confiable: persistí el evento en una tabla `Outbox`
**dentro de la misma transacción** que el cambio de datos. Un background worker
(`BackgroundService`) lee la tabla y publica al broker; así nunca queda el estado
guardado sin el evento ni el evento sin el estado.

## TypedResults en minimal API endpoints

El endpoint es delgado: traduce HTTP ↔ request y mapea el `Result` a status code.

```csharp
public static class OrderEndpoints
{
    public static void Map(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orders").WithTags("Orders");

        group.MapPost("/", async (CreateOrder cmd, ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(cmd, ct);
            return result.IsError
                ? TypedResults.Problem(result.FirstError.Message)
                : TypedResults.Created($"/orders/{result.Value}", result.Value);
        });
    }
}
```

`TypedResults` da el tipo de respuesta exacto (útil para OpenAPI y tests) en vez del
`Results` no tipado.

_Ref: https://www.milanjovanovic.tech/blog/internal-vs-public-apis-in-clean-architecture · https://github.com/ardalis/CleanArchitecture · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses_
