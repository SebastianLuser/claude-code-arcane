# Reglas por Rol — MFA

| Rol | MFA | Metodos | Step-up maxAge |
|-----|-----|---------|----------------|
| Super-admin | Obligatorio | Passkey + TOTP (2 factores) | 2 min |
| Admin institucion | Obligatorio | Passkey o TOTP | 5 min |
| Docente | Obligatorio | Passkey/TOTP; SMS solo recovery | 10 min |
| Alumno adulto (16+) | Opcional | TOTP o Passkey | 15 min |
| Alumno menor | No obligatorio | TOTP (via tutor); NUNCA SMS | N/A |
