# 5. Security (HIGH)

## 5.1 Short-Lived JWT + Refresh Tokens — CRITICAL

Access tokens cortos (5-15 min) limitan la ventana si se filtra uno; el refresh token (revocable, server-side) renueva sin re-login. Tokens de larga vida no se pueden invalidar.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new()
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
        ValidateIssuerSigningKey = true, ClockSkew = TimeSpan.FromSeconds(30)
    });
```

## 5.2 Secrets in User-Secrets / Key Vault — CRITICAL

Nunca claves ni connection strings en `appsettings.json` (van al repo). En dev `dotnet user-secrets`; en prod Azure Key Vault o variables de entorno.

**Incorrecto:**
```json
{ "Jwt": { "Key": "super-secret-signing-key" } } // en el repo
```
**Correcto:**
```csharp
// dotnet user-secrets set "Jwt:Key" "..." (dev)
builder.Configuration.AddAzureKeyVault(vaultUri, new DefaultAzureCredential()); // prod
```

## 5.3 Authorize by Policies, Not Manual Role Checks — HIGH

Las policies centralizan la regla de autorización; los `if (user.Role == "Admin")` dispersos se desincronizan y se olvidan.

**Incorrecto:**
```csharp
if (!ctx.User.IsInRole("Admin")) return Results.Forbid(); // lógica esparcida
```
**Correcto:**
```csharp
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanManageOrders", p => p.RequireRole("Admin").RequireClaim("scope", "orders:write"));
app.MapPost("/orders", Handler).RequireAuthorization("CanManageOrders");
```

## 5.4 HTTPS, HSTS and Rate Limiting — HIGH

Forzar HTTPS + HSTS evita downgrade/MITM. El middleware `RateLimiter` integrado protege de abuso y brute-force.

```csharp
builder.Services.AddRateLimiter(o => o.AddFixedWindowLimiter("api", w =>
    { w.PermitLimit = 100; w.Window = TimeSpan.FromMinutes(1); }));
app.UseHsts();
app.UseHttpsRedirection();
app.UseRateLimiter();
```

## 5.5 Don't Log Sensitive Data; Validate Input — HIGH

Nunca loggear passwords, tokens ni PII. Validar todo input con FluentValidation. Las queries de EF Core son parametrizadas por defecto (no concatenar SQL crudo) y `[ValidateAntiForgeryToken]` donde haya cookies/formularios.

```csharp
public sealed class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
    }
}
// EF Core parametriza: db.Users.Where(u => u.Email == input) — nunca string-interpolated FromSqlRaw
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication · https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit_
