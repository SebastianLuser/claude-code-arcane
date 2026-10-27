# 6. Testing (MEDIUM-HIGH)

## 6.3 Use Testing Module for Unit Tests — HIGH

An isolated environment with `Test.createTestingModule` and mocked dependencies.
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

Never call real APIs or DBs in tests. Mock every external dependency with realistic scenarios (success, error, timeout).

## 6.1 Use Supertest for E2E Testing — HIGH

Test the full request/response cycle including middleware, guards and pipes. Proper setup/teardown.
```ts
const app = moduleRef.createNestApplication();
await app.init();
await request(app.getHttpServer())
  .post('/users').send({ email: 'a@b.com', password: 'secret123' })
  .expect(201);
await app.close();
```

_Ref: https://docs.nestjs.com/fundamentals/testing_
