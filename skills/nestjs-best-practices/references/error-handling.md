# 3. Error Handling (HIGH)

## 3.2 Throw HTTP Exceptions from Services — HIGH

Services throw exceptions, they do not return error objects.

**Incorrect:**
```ts
return { error: 'not found' }; // the controller has to guess
```
**Correct:**
```ts
throw new NotFoundException(`User ${id} not found`);
```

## 3.1 Handle Async Errors Properly — HIGH

Fire-and-forget and background tasks must catch errors → otherwise an unhandled rejection can take the process down.

**Incorrect:**
```ts
this.mailer.send(email); // floating promise, error lost
```
**Correct:**
```ts
void this.mailer.send(email).catch(err => this.logger.error('mail failed', err));
```

## 3.3 Use Exception Filters — HIGH

A global filter for a consistent, centralized error response format.
```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // single shape: { statusCode, message, timestamp, path }
  }
}
// app.useGlobalFilters(new AllExceptionsFilter());
```
Never leak raw stack traces to the client in production.

_Ref: https://docs.nestjs.com/exception-filters_
