# 6. Testing (MEDIUM-HIGH)

## 6.3 Use Testing Module for Unit Tests — HIGH

Entorno aislado con `Test.createTestingModule` y dependencias mockeadas.
```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    OrdersService,
    { provide: UserRepository, useValue: mockUserRepo },
  ],
}).compile();
const service = moduleRef.get(OrdersService);
```

## 6.2 Mock External Services in Tests — HIGH

Nunca llamar APIs o DBs reales en tests. Mockear todas las dependencias externas con escenarios realistas (éxito, error, timeout).

## 6.1 Use Supertest for E2E Testing — HIGH

Probar el ciclo completo request/response incluyendo middleware, guards y pipes. Setup/teardown apropiados.
```ts
const app = moduleRef.createNestApplication();
await app.init();
await request(app.getHttpServer())
  .post('/users').send({ email: 'a@b.com', password: 'secret123' })
  .expect(201);
await app.close();
```

_Ref: https://docs.nestjs.com/fundamentals/testing_
