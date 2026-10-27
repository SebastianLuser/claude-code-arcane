# 4. Security (HIGH)

## 4.1 Secure JWT Authentication — CRITICAL

Short-lived tokens (15m) + refresh tokens. Secret in env/secret manager. Never sensitive data in the payload.
```ts
JwtModule.register({
  secret: process.env.JWT_SECRET,        // never hardcoded
  signOptions: { expiresIn: '15m' },
});
// payload: { sub: userId, role }  ← no passwords, full emails or PII
```

## 4.5 Validate All Input with DTOs and Pipes — HIGH

Global `ValidationPipe` + decorated DTOs. Reject malformed input before processing it.
```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // drops undeclared props
  forbidNonWhitelisted: true, // 400 if extra props arrive
  transform: true,
}));

export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}
```

## 4.4 Use Guards for AuthN/AuthZ — HIGH

Declarative guards, not manual checks in every handler.
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('users') findAll() { /* ... */ }
```

## 4.2 Rate Limiting — HIGH

`@nestjs/throttler`, per-endpoint limits (login stricter than reads).
```ts
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5/min on /login
```

## 4.3 Sanitize Output to Prevent XSS — HIGH

Sanitize user-generated content before storing it; correct `Content-Type` on responses.

_Ref: https://docs.nestjs.com/security/authentication · https://docs.nestjs.com/security/rate-limiting_
