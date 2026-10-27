# 4. Error Handling (HIGH)

## 4.1 Global IExceptionHandler + ProblemDetails — CRITICAL

Consistent, standardized error responses (RFC 7807) without a repeated try/catch in every endpoint. Register `AddProblemDetails()` and an `IExceptionHandler`.

**Correct:**
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

In production do not expose `ex.Message`, stack traces or internal details: they leak paths, versions and attack vectors. Log the detail, return a generic message (see 4.1).

## 4.3 Result Pattern for Expected Failures — HIGH

Expected failures (validation, "not found", business rules) are not exceptions: exceptions are expensive and meant for the exceptional. Return a `Result`.

**Incorrect:**
```csharp
if (order is null) throw new NotFoundException(); // control flow with exceptions
```
**Correct:**
```csharp
public readonly record struct Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Ok(T value) => new(true, value, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}
return order is null ? Result<Order>.Fail("Order not found") : Result<Order>.Ok(order);
```

## 4.4 Validation → ValidationProblemDetails — HIGH

Validation errors are returned as `ValidationProblemDetails` (400) with the field→errors map, not as a 500.

```csharp
return Results.ValidationProblem(new Dictionary<string, string[]>
{
    ["email"] = ["Email is required"]
});
```

## 4.5 No Empty Catch; Log With Context — MEDIUM-HIGH

`catch {}` hides failures and makes the app undebuggable. Catch specific types, log with structured logging and rethrow or return a `Result`.

**Incorrect:**
```csharp
try { await Pay(ct); } catch { } // swallows the error
```
**Correct:**
```csharp
try { await Pay(ct); }
catch (PaymentException ex) { logger.LogError(ex, "Payment failed for {OrderId}", orderId); throw; }
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling · https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors_
