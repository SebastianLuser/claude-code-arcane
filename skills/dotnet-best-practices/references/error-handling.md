# 4. Error Handling (HIGH)

## 4.1 Global IExceptionHandler + ProblemDetails — CRITICAL

Respuestas de error consistentes y estandarizadas (RFC 7807) sin try/catch repetido en cada endpoint. Registrar `AddProblemDetails()` y un `IExceptionHandler`.

**Correcto:**
```csharp
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        logger.LogError(ex, "Unhandled exception on {Path}", ctx.Request.Path);
        await Results.Problem(statusCode: StatusCodes.Status500InternalServerError, title: "An error occurred")
            .ExecuteAsync(ctx);
        return true;
    }
}
// Program.cs
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
app.UseExceptionHandler();
```

## 4.2 Don't Leak Stack Traces — CRITICAL

En producción no exponer `ex.Message`, stack traces ni detalles internos: filtran rutas, versiones y vectores de ataque. Loggear el detalle, devolver un mensaje genérico (ver 4.1).

## 4.3 Result Pattern for Expected Failures — HIGH

Fallos esperados (validación, "not found", reglas de negocio) no son excepciones: las excepciones son caras y para lo excepcional. Devolver un `Result`.

**Incorrecto:**
```csharp
if (order is null) throw new NotFoundException(); // control de flujo con excepciones
```
**Correcto:**
```csharp
public readonly record struct Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Ok(T value) => new(true, value, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}
return order is null ? Result<Order>.Fail("Order not found") : Result<Order>.Ok(order);
```

## 4.4 Validation → ValidationProblemDetails — HIGH

Los errores de validación se devuelven como `ValidationProblemDetails` (400) con el mapa campo→errores, no como 500.

```csharp
return Results.ValidationProblem(new Dictionary<string, string[]>
{
    ["email"] = ["Email is required"]
});
```

## 4.5 No Empty Catch; Log With Context — MEDIUM-HIGH

`catch {}` oculta fallos y vuelve la app indebuggeable. Capturar tipos específicos, loggear con structured logging y re-lanzar o devolver un `Result`.

**Incorrecto:**
```csharp
try { await Pay(ct); } catch { } // se traga el error
```
**Correcto:**
```csharp
try { await Pay(ct); }
catch (PaymentException ex) { logger.LogError(ex, "Payment failed for {OrderId}", orderId); throw; }
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling · https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors_
