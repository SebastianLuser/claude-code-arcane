# 5. Security (HIGH)

## 5.1 Short-Lived JWT + Refresh Tokens — CRITICAL

Short access tokens (5-15 min) limit the window if one leaks; the refresh token (revocable, server-side) renews without re-login. Long-lived tokens cannot be invalidated.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new()
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
        ValidateIssuerSigningKey = true, ClockSkew = TimeSpan.FromSeconds(30)
    });
```

## 5.2 Secrets in User-Secrets / Key Vault — CRITICAL

Never keys or connection strings in `appsettings.json` (they end up in the repo). In dev `dotnet user-secrets`; in prod Azure Key Vault or environment variables.

**Incorrect:**
```json
{ "Jwt": { "Key": "super-secret-signing-key" } } // in the repo
```
**Correct:**
```csharp
// dotnet user-secrets set "Jwt:Key" "..." (dev)
builder.Configuration.AddAzureKeyVault(vaultUri, new DefaultAzureCredential()); // prod
```

## 5.3 Authorize by Policies, Not Manual Role Checks — HIGH

Policies centralize the authorization rule; scattered `if (user.Role == "Admin")` checks drift out of sync and get forgotten.

**Incorrect:**
```csharp
if (!ctx.User.IsInRole("Admin")) return Results.Forbid(); // scattered logic
```
**Correct:**
```csharp
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanManageOrders", p => p.RequireRole("Admin").RequireClaim("scope", "orders:write"));
app.MapPost("/orders", Handler).RequireAuthorization("CanManageOrders");
```

## 5.4 HTTPS, HSTS and Rate Limiting — HIGH

Forcing HTTPS + HSTS prevents downgrade/MITM. The built-in `RateLimiter` middleware protects against abuse and brute force.

```csharp
builder.Services.AddRateLimiter(o => o.AddFixedWindowLimiter("api", w =>
    { w.PermitLimit = 100; w.Window = TimeSpan.FromMinutes(1); }));
app.UseHsts();
app.UseHttpsRedirection();
app.UseRateLimiter();
```

## 5.5 Don't Log Sensitive Data; Validate Input — HIGH

Never log passwords, tokens or PII. Validate all input with FluentValidation. EF Core queries are parameterized by default (do not concatenate raw SQL), and use `[ValidateAntiForgeryToken]` wherever there are cookies/forms.

```csharp
public sealed class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
    }
}
// EF Core parameterizes: db.Users.Where(u => u.Email == input) — never string-interpolated FromSqlRaw
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication · https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit_
