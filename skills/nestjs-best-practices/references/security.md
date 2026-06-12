# 4. Security (HIGH)

## 4.1 Secure JWT Authentication — CRITICAL

Tokens de vida corta (15m) + refresh tokens. Secreto en env/secret manager. Nunca data sensible en el payload.
```ts
JwtModule.register({
  secret: process.env.JWT_SECRET,        // nunca hardcodeado
  signOptions: { expiresIn: '15m' },
});
// payload: { sub: userId, role }  ← nada de passwords, emails completos, PII
```

## 4.5 Validate All Input with DTOs and Pipes — HIGH

`ValidationPipe` global + DTOs decorados. Rechazar input malformado antes de procesarlo.
```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // descarta props no declaradas
  forbidNonWhitelisted: true, // 400 si vienen props extra
  transform: true,
}));

export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}
```

## 4.4 Use Guards for AuthN/AuthZ — HIGH

Guards declarativos, no checks manuales en cada handler.
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('users') findAll() { /* ... */ }
```

## 4.2 Rate Limiting — HIGH

`@nestjs/throttler`, límites por endpoint (login más estricto que lecturas).
```ts
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5/min en /login
```

## 4.3 Sanitize Output to Prevent XSS — HIGH

Sanitizar contenido generado por usuario antes de almacenar; `Content-Type` correcto en respuestas.

_Ref: https://docs.nestjs.com/security/authentication · https://docs.nestjs.com/security/rate-limiting_
