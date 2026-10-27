# Idiomatic Patterns (.NET 10 / ASP.NET Core)

## One handler per use case

One request (record) + one handler. With MediatR or with a minimal hand-rolled sender.

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

## IApplicationDbContext (EF Core behind an interface, no generic repo)

Expose the `DbContext` through an interface in `Application`; implement it in
`Infrastructure`. The `DbContext` already is Unit of Work + repository: do not wrap it.

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

## Pipeline behaviors (validation, logging, transaction)

Cross-cutting concerns around every handler, without cluttering the logic.

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

A similar `TransactionBehavior` opens `BeginTransactionAsync` before `next()` and
commits/rolls back around it: the UnitOfWork lives here, not in hand-written repos.

## Result pattern for expected failures

Do not throw exceptions for expected business flow (not found, validation, conflict).
Return `Result<T>` (or `ErrorOr<T>`) and map it to HTTP in the endpoint.

```csharp
public readonly record struct Error(string Code, string Message);

public async Task<Result<OrderDto>> Handle(GetOrder q, CancellationToken ct)
{
    var order = await db.Orders.FindAsync([q.Id], ct);
    return order is null
        ? new Error("Order.NotFound", "Order does not exist")
        : order.ToDto();
}
```

## Outbox pattern (DB + event consistency)

To publish events reliably: persist the event in an `Outbox` table
**inside the same transaction** as the data change. A background worker
(`BackgroundService`) reads the table and publishes to the broker; that way the state is never
saved without the event, nor the event without the state.

## TypedResults en minimal API endpoints

The endpoint is thin: it translates HTTP ↔ request and maps the `Result` to a status code.

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

`TypedResults` gives the exact response type (useful for OpenAPI and tests) instead of the
untyped `Results`.

_Ref: https://www.milanjovanovic.tech/blog/internal-vs-public-apis-in-clean-architecture · https://github.com/ardalis/CleanArchitecture · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses_
