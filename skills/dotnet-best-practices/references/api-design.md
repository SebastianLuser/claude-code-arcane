# 9. API Design (MEDIUM)

## 9.1 DTOs, Never Expose EF Entities — MEDIUM

Serializing EF entities leaks internal columns, drags in relationships and couples the HTTP contract to the database schema. Use dedicated DTOs/records.

**Incorrect:**
```csharp
app.MapGet("/users/{id}", async (int id, AppDbContext db) => await db.Users.FindAsync(id)); // exposes the entity
```
**Correct:**
```csharp
public record UserDto(int Id, string Email);
app.MapGet("/users/{id}", async (int id, AppDbContext db) =>
    await db.Users.Where(u => u.Id == id).Select(u => new UserDto(u.Id, u.Email)).FirstOrDefaultAsync());
```

## 9.2 API Versioning — MEDIUM

Versioning the API lets the contract evolve without breaking existing clients. `Asp.Versioning` integrates it with minimal APIs and OpenAPI.

**Correct:**
```csharp
builder.Services.AddApiVersioning(o => o.DefaultApiVersion = new ApiVersion(1, 0));
var v1 = app.NewVersionedApi().MapGroup("/api/v{version:apiVersion}").HasApiVersion(1.0);
v1.MapGet("/orders", GetOrders);
```

## 9.3 Consistent Errors with ProblemDetails — MEDIUM

`ProblemDetails` (RFC 9457) gives a standard, machine-readable error format across the whole API.

**Correct:**
```csharp
builder.Services.AddProblemDetails();
app.UseExceptionHandler();
// in a handler:
return TypedResults.Problem(title: "Order not found", statusCode: StatusCodes.Status404NotFound);
```

## 9.4 Correct Status Codes via TypedResults — MEDIUM

`TypedResults` returns the correct status code in a typed way and improves the OpenAPI metadata.

**Correct:**
```csharp
app.MapPost("/orders", async (CreateOrder cmd, IOrderService svc) =>
{
    var order = await svc.CreateAsync(cmd);
    return TypedResults.Created($"/orders/{order.Id}", order); // 201 + Location
});
```

## 9.5 Pagination & Idempotency for Writes — MEDIUM

Paginating collections avoids unbounded responses; an Idempotency-Key makes a repeated POST (network retry) not duplicate the resource.

**Correct:**
```csharp
app.MapGet("/orders", (int page = 1, int pageSize = 20) => /* Skip/Take with limits */ );
app.MapPost("/payments", ([FromHeader(Name = "Idempotency-Key")] string key, Payment p) =>
    /* deduplicate by key before processing */ );
```

## 9.6 Built-in OpenAPI — LOW

`Microsoft.AspNetCore.OpenApi` generates the OpenAPI document with no external dependencies.

**Correct:**
```csharp
builder.Services.AddOpenApi();
app.MapOpenApi(); // /openapi/v1.json
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apiversioning · https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview · https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses_
