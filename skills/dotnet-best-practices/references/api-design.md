# 9. API Design (MEDIUM)

## 9.1 DTOs, Never Expose EF Entities — MEDIUM

Serializar entidades de EF filtra columnas internas, arrastra relaciones y acopla el contrato HTTP al schema de la base. Usar DTOs/records dedicados.

**Incorrecto:**
```csharp
app.MapGet("/users/{id}", async (int id, AppDbContext db) => await db.Users.FindAsync(id)); // expone la entidad
```
**Correcto:**
```csharp
public record UserDto(int Id, string Email);
app.MapGet("/users/{id}", async (int id, AppDbContext db) =>
    await db.Users.Where(u => u.Id == id).Select(u => new UserDto(u.Id, u.Email)).FirstOrDefaultAsync());
```

## 9.2 API Versioning — MEDIUM

Versionar la API permite evolucionar el contrato sin romper clientes existentes. `Asp.Versioning` lo integra con minimal APIs y OpenAPI.

**Correcto:**
```csharp
builder.Services.AddApiVersioning(o => o.DefaultApiVersion = new ApiVersion(1, 0));
var v1 = app.NewVersionedApi().MapGroup("/api/v{version:apiVersion}").HasApiVersion(1.0);
v1.MapGet("/orders", GetOrders);
```

## 9.3 Consistent Errors with ProblemDetails — MEDIUM

`ProblemDetails` (RFC 9457) da un formato de error estándar y machine-readable en toda la API.

**Correcto:**
```csharp
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
// en un handler:
return TypedResults.Problem(title: "Order not found", statusCode: StatusCodes.Status404NotFound);
```

## 9.4 Correct Status Codes via TypedResults — MEDIUM

`TypedResults` devuelve el status code correcto de forma tipada y mejora los metadatos de OpenAPI.

**Correcto:**
```csharp
app.MapPost("/orders", async (CreateOrder cmd, IOrderService svc) =>
{
    var order = await svc.CreateAsync(cmd);
    return TypedResults.Created($"/orders/{order.Id}", order); // 201 + Location
});
```

## 9.5 Pagination & Idempotency for Writes — MEDIUM

Paginar colecciones evita respuestas ilimitadas; una Idempotency-Key hace que un POST repetido (reintento de red) no duplique el recurso.

**Correcto:**
```csharp
app.MapGet("/orders", (int page = 1, int pageSize = 20) => /* Skip/Take con límites */ );
app.MapPost("/payments", ([FromHeader(Name = "Idempotency-Key")] string key, Payment p) =>
    /* deduplicar por key antes de procesar */ );
```

## 9.6 Built-in OpenAPI — LOW

`Microsoft.AspNetCore.OpenApi` genera el documento OpenAPI sin dependencias externas.

**Correcto:**
```csharp
builder.Services.AddOpenApi();
app.MapOpenApi(); // /openapi/v1.json
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apiversioning · https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses_
