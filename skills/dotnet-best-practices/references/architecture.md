# 1. Architecture (CRITICAL)

## 1.1 Organize by Feature, Not Technical Layers — CRITICAL

Folders per feature (vertical slice) → high cohesion and localized changes; folders per technical layer scatter a change across 5 places.

**Incorrect** — global technical folders:
```csharp
// Controllers/, Services/, Repositories/, Dtos/ ... one change touches 4 folders
```
**Correct** — one slice per feature:
```csharp
// Features/Orders/{ CreateOrder.cs, GetOrder.cs, OrdersEndpoints.cs, OrderDto.cs }
// Features/Users/{ RegisterUser.cs, UsersEndpoints.cs, UserDto.cs }
```

## 1.2 Thin Endpoints — CRITICAL

The endpoint parses, delegates and shapes the response. No business logic: that keeps it testable and reusable from other transports.

**Incorrect:**
```csharp
app.MapPost("/orders", async (CreateOrderDto dto, AppDbContext db) =>
{
    if (dto.Items.Count == 0) return Results.BadRequest();   // business logic in the endpoint
    var total = dto.Items.Sum(i => i.Price * i.Qty);          // business logic in the endpoint
    db.Orders.Add(new Order { Total = total });
    await db.SaveChangesAsync();
    return Results.Ok();
});
```
**Correct:**
```csharp
app.MapPost("/orders", async (CreateOrderRequest req, CreateOrderHandler handler, CancellationToken ct) =>
{
    var result = await handler.HandleAsync(req, ct);
    return result.IsSuccess ? Results.Created($"/orders/{result.Value.Id}", result.Value) : result.ToProblem();
});
```

## 1.3 Dependencies Point Inward / Slices Independent — HIGH

The domain knows nothing about infrastructure (Clean Architecture): the handler depends on an `IOrderRepository` abstraction, not on `AppDbContext`. No direct coupling between slices; coordinate through domain events or a mediator.

## 1.4 Single Responsibility per Handler — HIGH

A handler resolves one use case. `CreateOrderHandler` does not send emails or charge payments: it emits an event and another handler reacts. It improves testability and limits the blast radius of each change.

## 1.5 Program.cs as Composition Root Only — MEDIUM-HIGH

`Program.cs` only registers services and builds the pipeline; no business logic. Moving the wiring into extensions (`builder.Services.AddOrdersFeature()`) keeps the root readable.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOrdersFeature().AddAuthFeature();
var app = builder.Build();
app.UseExceptionHandler().UseAuthorization();
app.MapOrdersEndpoints();
app.Run();
```

_Ref: https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/min-api-filters_
