# 3. Error Handling (HIGH)

## 3.2 Throw HTTP Exceptions from Services — HIGH

Los servicios lanzan excepciones, no retornan objetos de error.

**Incorrecto:**
```ts
return { error: 'not found' }; // el controller tiene que adivinar
```
**Correcto:**
```ts
throw new NotFoundException(`User ${id} not found`);
```

## 3.1 Handle Async Errors Properly — HIGH

Fire-and-forget y background tasks deben atrapar errores → si no, unhandled rejection puede tumbar el proceso.

**Incorrecto:**
```ts
this.mailer.send(email); // floating promise, error perdido
```
**Correcto:**
```ts
void this.mailer.send(email).catch(err => this.logger.error('mail failed', err));
```

## 3.3 Use Exception Filters — HIGH

Filtro global para formato de respuesta de error consistente y centralizado.
```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // shape único: { statusCode, message, timestamp, path }
  }
}
// app.useGlobalFilters(new AllExceptionsFilter());
```
Nunca filtrar stack traces crudos al cliente en producción.

_Ref: https://docs.nestjs.com/exception-filters_
