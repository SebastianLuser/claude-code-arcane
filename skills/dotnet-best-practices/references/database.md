# 7. Database & EF Core (MEDIUM-HIGH)

## 7.1 Avoid N+1 with Include or Projection — HIGH

Accessing relationships in a loop fires one query per row. Using `Include` or projecting to a DTO with `Select` resolves everything in a single query.

**Incorrect:**
```csharp
var orders = await db.Orders.ToListAsync();
foreach (var o in orders) o.Customer = await db.Customers.FindAsync(o.CustomerId); // N+1
```
**Correct:**
```csharp
var orders = await db.Orders
    .Select(o => new OrderDto(o.Id, o.Customer.Name, o.Total))
    .ToListAsync();
```

## 7.2 AsNoTracking for Read-Only Queries — HIGH

The change tracker adds unnecessary overhead on reads. `AsNoTracking()` skips the snapshots and reduces allocations.

**Correct:**
```csharp
var products = await db.Products.AsNoTracking().Where(p => p.Active).ToListAsync();
```

## 7.3 DbContext is the Unit of Work — MEDIUM-HIGH

`DbContext` already implements Unit of Work + Repository. Wrapping it in a generic repository hides `Include`, projections and `SaveChanges`, adding abstraction with no value.

**Incorrect:**
```csharp
public class GenericRepository<T> { Task<T> GetById(int id); /* wraps DbSet needlessly */ }
```
**Correct:**
```csharp
// Inject AppDbContext (or a domain service that uses it) directly
public sealed class OrderService(AppDbContext db) { /* uses db.Orders, db.SaveChangesAsync */ }
```

## 7.4 Versioned Migrations, Never EnsureCreated in Prod — MEDIUM-HIGH

`EnsureCreated()` does not use migrations and is not upgradeable: migrate the versioned schema with the EF CLI.

**Incorrect:**
```csharp
await db.Database.EnsureCreatedAsync(); // not migratable, loses the schema history
```
**Correct:**
```bash
dotnet ef migrations add AddOrderIndex
dotnet ef database update    # on deploy: db.Database.MigrateAsync()
```

## 7.5 Connection Resiliency & Split Queries — MEDIUM

Enabling retries on transient failures, plus `AsSplitQuery()` for large `Include`s, avoids the cartesian explosion of a single JOIN.

**Correct:**
```csharp
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(conn, npgsql => npgsql.EnableRetryOnFailure()));

var blogs = await db.Blogs.Include(b => b.Posts).Include(b => b.Tags)
    .AsSplitQuery().ToListAsync();
```

_Ref: https://learn.microsoft.com/en-us/ef/core/querying/related-data/eager-loading · https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations · https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency_
