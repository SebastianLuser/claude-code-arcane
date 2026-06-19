# 1. Architecture (CRITICAL)

## 1.1 Organize by Feature, Not Technical Layers — CRITICAL

Carpetas por feature (vertical slice) → cohesión alta y cambios localizados; las carpetas por capa técnica dispersan un cambio en 5 sitios.

**Incorrecto** — carpetas técnicas globales:
```csharp
// Controllers/, Services/, Repositories/, Dtos/ ... un cambio toca 4 carpetas
```
**Correcto** — un slice por feature:
```csharp
// Features/Orders/{ CreateOrder.cs, GetOrder.cs, OrdersEndpoints.cs, OrderDto.cs }
// Features/Users/{ RegisterUser.cs, UsersEndpoints.cs, UserDto.cs }
```

## 1.2 Thin Endpoints — CRITICAL

El endpoint parsea, delega y forma la respuesta. Sin lógica de negocio: así es testeable y reutilizable desde otros transportes.

**Incorrecto:**
```csharp
app.MapPost("/orders", async (CreateOrderDto dto, AppDbContext db) =>
{
    if (dto.Items.Count == 0) return Results.BadRequest();   // negocio en el endpoint
    var total = dto.Items.Sum(i => i.Price * i.Qty);          // negocio en el endpoint
    db.Orders.Add(new Order { Total = total });
    await db.SaveChangesAsync();
    return Results.Ok();
});
```
**Correcto:**
```csharp
app.MapPost("/orders", async (CreateOrderRequest req, CreateOrderHandler handler, CancellationToken ct) =>
{
    var result = await handler.HandleAsync(req, ct);
    return result.IsSuccess ? Results.Created($"/orders/{result.Value.Id}", result.Value) : result.ToProblem();
});
```

## 1.3 Dependencies Point Inward / Slices Independent — HIGH

El dominio no conoce infraestructura (Clean Architecture): el handler depende de una abstracción `IOrderRepository`, no de `AppDbContext`. Entre slices, sin acoplamiento directo; coordinar vía eventos de dominio o un mediador.

## 1.4 Single Responsibility per Handler — HIGH

Un handler resuelve un caso de uso. `CreateOrderHandler` no envía emails ni cobra: emite un evento y otro handler reacciona. Mejora testabilidad y limita el blast radius de cada cambio.

## 1.5 Program.cs as Composition Root Only — MEDIUM-HIGH

`Program.cs` solo registra servicios y arma el pipeline; nada de lógica de negocio. Mover el wiring a extensiones (`builder.Services.AddOrdersFeature()`) mantiene el root legible.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOrdersFeature().AddAuthFeature();
var app = builder.Build();
app.UseExceptionHandler().UseAuthorization();
app.MapOrdersEndpoints();
app.Run();
```

_Ref: https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/min-api-filters_
