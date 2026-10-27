# 8. API Design (MEDIUM)

## 8.1 Use DTOs and Serialization for Responses — MEDIUM

Transform entities before returning them → control exposure, avoid circular references, consistency.
```ts
export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Exclude() password: string; // never goes out
}
// @UseInterceptors(ClassSerializerInterceptor)
```

## 8.2 Use Interceptors for Cross-Cutting Concerns — MEDIUM

Logging, transformation, uniform response format (`{ data, meta }`) via interceptors, not repeated in every handler.

## 8.3 Use Pipes for Input Transformation — MEDIUM

Built-in (`ParseIntPipe`, `ParseUUIDPipe`) and custom pipes to validate/transform input.
```ts
@Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {}
```

## 8.4 Use API Versioning for Breaking Changes — MEDIUM

Version endpoints to keep compatibility.
```ts
app.enableVersioning({ type: VersioningType.URI }); // /v1/users
@Controller({ path: 'users', version: '1' })
```

_Ref: https://docs.nestjs.com/techniques/serialization · https://docs.nestjs.com/techniques/versioning_
