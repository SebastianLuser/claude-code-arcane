# 8. Testing (MEDIUM-HIGH)

## 8.1 Integration Tests with WebApplicationFactory — HIGH

`WebApplicationFactory<T>` spins up the app in memory with the real pipeline (DI, middleware, routing), testing real behavior instead of mocks.

**Correct:**
```csharp
public class OrdersApiTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetOrders_ReturnsOk()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/orders");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

## 8.2 Real Postgres via Testcontainers — HIGH

The in-memory provider lies about relational behavior (transactions, constraints, SQL). Testcontainers spins up a real, disposable Postgres.

**Incorrect:**
```csharp
options.UseInMemoryDatabase("test"); // does not validate FKs, constraints or real SQL
```
**Correct:**
```csharp
var pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
await pg.StartAsync();
options.UseNpgsql(pg.GetConnectionString());
```

## 8.3 Don't Mock DbContext — MEDIUM-HIGH

Mocking `DbContext` or `IQueryable` reimplements LINQ-to-SQL as LINQ-to-Objects and gives false greens. Test handlers/slices against a real database.

**Incorrect:**
```csharp
var mock = new Mock<AppDbContext>(); // does not translate queries like the real provider
```
**Correct:**
```csharp
var handler = new CreateOrderHandler(realDbContext);
var result = await handler.Handle(command, CancellationToken.None);
```

## 8.4 Arrange-Act-Assert with FluentAssertions — MEDIUM

Structure each test as AAA and use `FluentAssertions` for readable assertions and clear error messages.

**Correct:**
```csharp
[Fact]
public void Discount_AppliesPercentage()
{
    var order = new Order(100m);              // Arrange
    order.ApplyDiscount(0.10m);               // Act
    order.Total.Should().Be(90m);             // Assert
}
```

## 8.5 Deterministic Tests — MEDIUM

Avoid `DateTime.Now`, random GUIDs or order dependencies: inject `TimeProvider` so the tests are reproducible.

**Correct:**
```csharp
var time = new FakeTimeProvider(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
var service = new SubscriptionService(time); // no real clock, stable result
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests · https://learn.microsoft.com/en-us/dotnet/core/testing/ · https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/test-aspnet-core-services-web-apps_
