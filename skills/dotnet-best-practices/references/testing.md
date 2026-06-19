# 8. Testing (MEDIUM-HIGH)

## 8.1 Integration Tests with WebApplicationFactory — HIGH

`WebApplicationFactory<T>` levanta la app en memoria con el pipeline real (DI, middleware, routing), probando el comportamiento de verdad y no mocks.

**Correcto:**
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

El provider in-memory miente sobre el comportamiento relacional (transacciones, constraints, SQL). Testcontainers levanta un Postgres real y desechable.

**Incorrecto:**
```csharp
options.UseInMemoryDatabase("test"); // no valida FKs, constraints ni SQL real
```
**Correcto:**
```csharp
var pg = new PostgreSqlBuilder().WithImage("postgres:17").Build();
await pg.StartAsync();
options.UseNpgsql(pg.GetConnectionString());
```

## 8.3 Don't Mock DbContext — MEDIUM-HIGH

Mockear `DbContext` o `IQueryable` reimplementa LINQ-to-SQL en LINQ-to-Objects y da falsos verdes. Probar handlers/slices contra una base real.

**Incorrecto:**
```csharp
var mock = new Mock<AppDbContext>(); // no traduce queries como el provider real
```
**Correcto:**
```csharp
var handler = new CreateOrderHandler(realDbContext);
var result = await handler.Handle(command, CancellationToken.None);
```

## 8.4 Arrange-Act-Assert with FluentAssertions — MEDIUM

Estructurar cada test en AAA y usar `FluentAssertions` para aserciones legibles y mensajes de error claros.

**Correcto:**
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

Evitar `DateTime.Now`, GUIDs aleatorios o dependencias de orden: inyectar `TimeProvider` para que los tests sean reproducibles.

**Correcto:**
```csharp
var time = new FakeTimeProvider(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
var service = new SubscriptionService(time); // sin reloj real, resultado estable
```

_Ref: https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests · https://learn.microsoft.com/en-us/dotnet/core/testing/ · https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/test-aspnet-core-services-web-apps_
