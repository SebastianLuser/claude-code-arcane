# 2. Dependency Injection (CRITICAL)

## 2.4 Prefer Constructor Injection — CRITICAL

Visibilidad, type safety y testabilidad. Siempre.
```ts
@Injectable()
export class OrdersService {
  constructor(private readonly users: UsersService) {}
}
```

## 2.1 Avoid Service Locator Anti-Pattern — HIGH

**Incorrecto:**
```ts
const svc = this.moduleRef.get(UsersService); // dependencia oculta, no testeable
```
**Correcto:** inyectar por constructor (2.4). `ModuleRef` solo para casos dinámicos justificados.

## 2.5 Understand Provider Scopes — CRITICAL

`DEFAULT` (singleton) por defecto. `REQUEST` scope tiene costo de performance (instancia por request) → usar solo cuando se necesita contexto de request real.
```ts
@Injectable({ scope: Scope.REQUEST }) // solo si es necesario
```

## 2.6 Use Injection Tokens for Interfaces — HIGH

Las interfaces de TS no existen en runtime → no se pueden inyectar. Usar símbolo o abstract class como token.
```ts
export const USER_REPO = Symbol('USER_REPO');
@Module({ providers: [{ provide: USER_REPO, useClass: PrismaUserRepository }] })
// constructor(@Inject(USER_REPO) private repo: UserRepository) {}
```

## 2.2 Interface Segregation — HIGH

Interfaces chicas y enfocadas, no "fat interfaces" que fuerzan dependencias sin usar.

## 2.3 Liskov Substitution — HIGH

Toda implementación de una interfaz honra el contrato idéntico → intercambiables sin romper consumidores.

_Ref: https://docs.nestjs.com/fundamentals/custom-providers · https://docs.nestjs.com/fundamentals/injection-scopes_
