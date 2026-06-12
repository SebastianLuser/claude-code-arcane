# 8. API Design (MEDIUM)

## 8.1 Use DTOs and Serialization for Responses — MEDIUM

Transformar entidades antes de retornar → controlar exposición, evitar referencias circulares, consistencia.
```ts
export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Exclude() password: string; // nunca sale
}
// @UseInterceptors(ClassSerializerInterceptor)
```

## 8.2 Use Interceptors for Cross-Cutting Concerns — MEDIUM

Logging, transformación, formato de respuesta uniforme (`{ data, meta }`) vía interceptors, no repetido en cada handler.

## 8.3 Use Pipes for Input Transformation — MEDIUM

Pipes built-in (`ParseIntPipe`, `ParseUUIDPipe`) y custom para validar/transformar input.
```ts
@Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {}
```

## 8.4 Use API Versioning for Breaking Changes — MEDIUM

Versionar endpoints para mantener compatibilidad.
```ts
app.enableVersioning({ type: VersioningType.URI }); // /v1/users
@Controller({ path: 'users', version: '1' })
```

_Ref: https://docs.nestjs.com/techniques/serialization · https://docs.nestjs.com/techniques/versioning_
