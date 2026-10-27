# 2. Dependency Injection (CRITICAL)

## 2.4 Prefer Constructor Injection — CRITICAL

Visibility, type safety and testability. Always.
```ts
@Injectable()
export class OrdersService {
  constructor(private readonly users: UsersService) {}
}
```

## 2.1 Avoid Service Locator Anti-Pattern — HIGH

**Incorrect:**
```ts
const svc = this.moduleRef.get(UsersService); // hidden dependency, not testable
```
**Correct:** inject through the constructor (2.4). `ModuleRef` only for justified dynamic cases.

## 2.5 Understand Provider Scopes — CRITICAL

`DEFAULT` (singleton) by default. `REQUEST` scope has a performance cost (one instance per request) → use it only when real request context is needed.
```ts
@Injectable({ scope: Scope.REQUEST }) // only if necessary
```

## 2.6 Use Injection Tokens for Interfaces — HIGH

TS interfaces do not exist at runtime → they cannot be injected. Use a symbol or an abstract class as the token.
```ts
export const USER_REPO = Symbol('USER_REPO');
@Module({ providers: [{ provide: USER_REPO, useClass: PrismaUserRepository }] })
// constructor(@Inject(USER_REPO) private repo: UserRepository) {}
```

## 2.2 Interface Segregation — HIGH

Small, focused interfaces, not "fat interfaces" that force unused dependencies.

## 2.3 Liskov Substitution — HIGH

Every implementation of an interface honors the identical contract → interchangeable without breaking consumers.

_Ref: https://docs.nestjs.com/fundamentals/custom-providers · https://docs.nestjs.com/fundamentals/injection-scopes_
