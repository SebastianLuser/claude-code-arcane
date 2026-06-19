# 7. Database & EF Core (MEDIUM-HIGH)

## 7.1 Avoid N+1 with Include or Projection — HIGH

Acceder a relaciones en un loop dispara una query por fila. Usar `Include` o proyectar a un DTO con `Select` resuelve todo en una sola query.

**Incorrecto:**
```csharp
var orders = await db.Orders.ToListAsync();
foreach (var o in orders) o.Customer = await db.Customers.FindAsync(o.CustomerId); // N+1
```
**Correcto:**
```csharp
var orders = await db.Orders
    .Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total))
    .ToListAsync();
```

## 7.2 AsNoTracking for Read-Only Queries — HIGH

El change tracker añade overhead innecesario en lecturas. `AsNoTracking()` evita las snapshots y reduce allocations.

**Correcto:**
```csharp
var products = await db.Products.AsNoTracking().Where(p => p.Active).ToListAsync();
```

## 7.3 DbContext is the Unit of Work — MEDIUM-HIGH

`DbContext` ya implementa Unit of Work + Repository. Envolverlo en un repositorio genérico oculta `Include`, proyecciones y `SaveChanges`, añadiendo abstracción sin valor.

**Incorrecto:**
```csharp
public class GenericRepository<T> { Task<T> GetById(int id); /* envuelve DbSet sin necesidad */ }
```
**Correcto:**
```csharp
// Inyectar AppDbContext (o un servicio de dominio que lo use) directamente
public sealed class OrderService(AppDbContext db) { /* usa db.Orders, db.SaveChangesAsync */ }
```

## 7.4 Versioned Migrations, Never EnsureCreated in Prod — MEDIUM-HIGH

`EnsureCreated()` no usa migraciones y no es upgradeable: hay que migrar el schema versionado con la CLI de EF.

**Incorrecto:**
```csharp
await db.Database.EnsureCreatedAsync(); // no migrable, pierde historial de schema
```
**Correcto:**
```bash
dotnet ef migrations add AddOrderIndex
dotnet ef database update    # en deploy: db.Database.MigrateAsync()
```

## 7.5 Connection Resiliency & Split Queries — MEDIUM

Habilitar reintentos ante fallos transitorios y `AsSplitQuery()` para `Include` grandes evita la explosión cartesiana de un único JOIN.

**Correcto:**
```csharp
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(conn, npgsql => npgsql.EnableRetryOnFailure()));

var blogs = await db.Blogs.Include(b => b.Posts).Include(b => b.Tags)
    .AsSplitQuery().ToListAsync();
```

_Ref: https://learn.microsoft.com/en-us/ef/core/querying/related-data/eager-loading · https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations · https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency_
