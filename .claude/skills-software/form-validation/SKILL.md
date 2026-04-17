---
name: form-validation
description: "Validación de formularios en React/React Native (Educabot) con React Hook Form + Zod. Principio clave — validar SIEMPRE en backend; cliente solo para UX. Cubre schemas compartidos client↔backend TS, validaciones LatAm (DNI/CUIT/RUT, teléfono, menores), async validation, a11y, server errors, multi-step, i18n y testing. Usar cuando se mencione: formulario, validación, form, validar, Zod, React Hook Form, RHF, errores de formulario, schema, input validation."
argument-hint: "[stack: react|rn] [form-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Form Validation — Educabot

## Cuándo usar
- Formularios de login, registro, onboarding, checkout, perfil en React (web Vite+TS) o React Native.
- Definir schemas de validación compartidos entre frontend y backend TS (monorepo).
- Validaciones específicas LatAm: DNI/CUIT (AR), RUT (CL), RUC (PE), CPF (BR), teléfonos con prefijo país.
- Formularios con menores: fecha de nacimiento + consentimiento tutor.
- Multi-step forms, async validation (uniqueness), file uploads con validación.

## Cuándo NO usar
- Validación pura de parámetros HTTP en backend Go → `go-playground/validator` directo.
- Datos no provenientes de usuario (ej. configs internas).
- Búsquedas/filtros triviales (un input sin reglas): overkill.

---

## 1. Principio rector: **backend valida siempre**

El cliente valida para **UX** (feedback inmediato, menos roundtrips). El backend valida para **seguridad e integridad** — jamás confíes en el cliente. Un atacante puede saltarse el JS, mandar `curl` directo, o usar DevTools para borrar `required`.

```
Cliente (RHF + Zod) → UX: errores inmediatos, campos guiados
       ↓
Backend (Zod/validator) → Seguridad: única fuente de verdad
       ↓
DB constraints → Última línea de defensa
```

---

## 2. Stack default Educabot

- **React Hook Form (RHF)** — performance (uncontrolled inputs), excelente DX, integra con cualquier validator.
- **Zod** — schema-first, infiere tipos TypeScript (`z.infer<typeof schema>`).
- **@hookform/resolvers/zod** — bridge entre RHF y Zod.
- **React Native**: mismo stack (RHF + Zod) con `Controller` para inputs no-nativos.

### Alternativas que NO usamos
- **Formik**: más lento (controlled), API más verbosa. Reemplazado por RHF.
- **Yup**: reemplazado por Zod (mejor inferencia TS y ecosistema).
- **Joi**: backend-only Node; no comparte bien con frontend.

---

## 3. Ejemplo completo: Zod + RHF

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  age: z.number().int().min(13, 'Mínimo 13 años').max(120),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // valida al salir del field (menos ruido)
    reValidateMode: 'onChange', // tras primer error, re-valida al tipear
  });

  const onSubmit = async (data: LoginData) => {
    const res = await api.login(data);
    if (!res.ok) {
      // Mapear errores field-specific del backend
      res.fieldErrors?.forEach(({ field, message }) =>
        setError(field as keyof LoginData, { message })
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? 'email-error' : undefined}
        {...register('email')}
      />
      {errors.email && (
        <p id="email-error" role="alert">{errors.email.message}</p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Ingresar'}
      </button>
    </form>
  );
}
```

---

## 4. Schema compartido client ↔ backend TS

En monorepos Educabot (frontend React + backend Node/NestJS/Fastify), definir el schema Zod en un **package compartido**:

```
packages/
  shared-schemas/
    src/auth.ts       ← z.object({...}) exportado
  frontend/           ← importa y usa con RHF
  backend/            ← importa y usa en route handler
```

**Single source of truth**: cambiás el schema una vez, cliente y backend quedan consistentes.

### Backend Go: no hay Zod
Go usa **`go-playground/validator`** con struct tags, o validación manual. Para mantener consistencia:
- Contrato vía **OpenAPI** (generar con `zod-to-openapi` desde el schema Zod del frontend, o vice-versa con `oapi-codegen` del lado Go).
- Tests de contrato en CI que verifiquen que ambos lados cumplen el mismo spec.

```go
type LoginReq struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    Age      int    `json:"age" validate:"required,min=13,max=120"`
}
```

---

## 5. Validaciones comunes Educabot (LatAm + EdTech)

### Email
```ts
z.string().trim().toLowerCase().email('Email inválido')
```

### Password
```ts
z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/[0-9]/, 'Debe incluir al menos un número')
```
**NO** pidas símbolos obligatorios, mayúsculas obligatorias, 14 caracteres, etc. Eso rompe UX y empuja a password reuse. Mínimo 8 + letra + número es suficiente (OWASP lo avala).

### DNI / CUIT / RUT / CPF
Usar libs con check digit real, no solo regex:
- Argentina CUIT: `cuit-validator` o custom con algoritmo módulo 11.
- Chile RUT: `validar-rut`.
- Brasil CPF: `cpf-cnpj-validator`.

```ts
import { validate as validateCuit } from 'cuit-validator';
const cuitSchema = z.string().refine(validateCuit, 'CUIT inválido');
```

### Teléfono
```ts
import { parsePhoneNumber } from 'libphonenumber-js';
const phoneSchema = z.string().refine(
  (val) => parsePhoneNumber(val, 'AR')?.isValid() ?? false,
  'Teléfono inválido'
);
```

### Fechas
```ts
z.coerce.date().min(new Date('1900-01-01')).max(new Date())
```

### Edad mínima (menores)
```ts
const minAge = (years: number) => (d: Date) => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  return d <= cutoff;
};
z.coerce.date().refine(minAge(13), 'Debés tener 13 años o más')
```

---

## 6. Async validation (uniqueness)

Email/username disponibles:

```ts
const checkEmail = async (email: string) => {
  const res = await fetch(`/api/check-availability?email=${email}`);
  return (await res.json()).available;
};

// Con debounce 300ms (lodash.debounce o custom hook)
const debouncedCheck = useMemo(() => debounce(checkEmail, 300), []);
```

Reglas:
- Debounce **300ms** mínimo — no spam al backend por cada keystroke.
- **NO bloquees el submit** si el check async está pendiente; el backend re-valida igual.
- Mostrá spinner inline en el field mientras valida.

---

## 7. Validación on-blur vs on-change

- **Default: `mode: 'onBlur'`** — el usuario termina de escribir, sale, ve el error. Menos ruido.
- **`reValidateMode: 'onChange'`** — tras el primer error, re-valida al tipear para que vea cuando se corrige.
- **Nunca `onChange` desde el arranque**: bombardea al usuario con errores antes de terminar de escribir el email.

---

## 8. Error UX

- **Mensaje al lado del field**, no en un alert al top.
- **`aria-invalid="true"`** y **`aria-describedby`** apuntando al id del mensaje — compliance y lectores de pantalla.
- **`role="alert"`** en el mensaje para que SR lo anuncie.
- **Focus automático al primer error** al submit: RHF lo hace con `shouldFocusError: true` (default).
- **Preserve state**: si falla el submit, NO limpies los inputs. RHF ya lo hace por defecto.

---

## 9. Server errors → RHF

Backend devuelve errores field-specific:
```json
{ "fieldErrors": [{ "field": "email", "message": "Ya existe una cuenta" }] }
```

Mapear con `setError` de RHF (ver ejemplo sección 3). Para errores globales (ej. rate limit), usar un `formState` custom o un banner aparte.

---

## 10. React Native

Mismo stack: RHF + Zod. Usar `Controller` para `TextInput`:

```tsx
<Controller
  control={control}
  name="email"
  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
    <Input
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      error={error?.message}
      keyboardType="email-address"
      autoCapitalize="none"
    />
  )}
/>
```

Tener un componente `<Input />` custom con prop `error` que renderiza el mensaje debajo.

---

## 11. File upload validation

```ts
const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, 'Máximo 5MB')
  .refine(
    (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
    'Formato no permitido (JPG, PNG, WebP)'
  );
```

Esto es validación básica client-side. Para scan real de malware, magic bytes verification, etc. → ver skill `/file-uploads`.

---

## 12. Multi-step forms

- Un schema Zod **por step** + un schema total para el submit final.
- Usar `FormProvider` de RHF para compartir el estado entre steps:

```tsx
<FormProvider {...methods}>
  {step === 1 && <Step1 />}
  {step === 2 && <Step2 />}
  {step === 3 && <Step3 />}
</FormProvider>
```

- Al avanzar step: `trigger(['field1', 'field2'])` para validar solo los fields del step actual.
- Persistir draft en `localStorage` / `AsyncStorage` si el flujo es largo.

---

## 13. Internacionalización (i18n)

Parametrizar mensajes por locale (es-AR, pt-BR):

```ts
const t = useTranslation();
const schema = z.object({
  email: z.string().email(t('errors.email_invalid')),
  password: z.string().min(8, t('errors.password_min', { n: 8 })),
});
```

Recrear el schema cuando cambia el locale (o usar `z.setErrorMap` global).

---

## 14. Honeypot + rate limit

- **Honeypot field**: input oculto con CSS (no `display:none`, usar `tabindex="-1"` + off-screen). Si viene con valor → es un bot, rechazar silenciosamente.
- **Rate limit** en backend (login, signup, forgot-password) → ver skill `/rate-limiting`.

```tsx
<input
  type="text"
  name="website"
  tabIndex={-1}
  autoComplete="off"
  style={{ position: 'absolute', left: '-9999px' }}
  {...register('website')}
/>
```

En el schema: `website: z.string().max(0, 'bot detected').optional()`.

---

## 15. Testing

### Unit (schemas)
```ts
import { loginSchema } from './schemas';

test('rechaza email inválido', () => {
  const result = loginSchema.safeParse({ email: 'foo', password: '12345678', age: 20 });
  expect(result.success).toBe(false);
});
```

### E2E (Playwright)
```ts
test('muestra error de email inválido', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', 'foo');
  await page.locator('input[name=email]').blur();
  await expect(page.locator('#email-error')).toHaveText('Email inválido');
});
```

---

## 16. Menores Educabot

Si el form tiene campo `edad` o `fechaNacimiento` y el usuario declara ser menor de edad (típicamente <18 o <13 COPPA), gatillar **flujo de consentimiento del tutor** antes de crear cuenta — ver skill `/consent-cookies`.

Schema ejemplo:
```ts
const signupSchema = z.object({
  fechaNacimiento: z.coerce.date(),
  // ...
}).superRefine((data, ctx) => {
  if (isMenorDeEdad(data.fechaNacimiento) && !data.tutorEmail) {
    ctx.addIssue({
      path: ['tutorEmail'],
      code: 'custom',
      message: 'Menores requieren email del tutor',
    });
  }
});
```

---

## Anti-patterns

- ❌ **Validar solo client-side** — el backend TIENE que re-validar. Cliente es UX, no seguridad.
- ❌ **Regex imposibles para password** (10+ requisitos cruzados, símbolos obligatorios). Rompe UX, genera password reuse.
- ❌ **Mostrar errores antes de que el usuario interactúe con el field** — ruido visual, frustración.
- ❌ **`alert()` para mostrar errores** — bloquea UI, horrible a11y.
- ❌ **Validación `onChange` agresiva desde el primer keystroke** — bombardea al usuario mientras tipea el email.
- ❌ **Mensajes genéricos** ("Campo inválido", "Error") sin decir QUÉ está mal.
- ❌ **Schemas duplicados** cliente vs backend TS — usa package compartido.
- ❌ **Perder datos ingresados al fallar submit** — RHF los preserva, no los resetees manualmente.
- ❌ **Sin `aria-invalid` / `aria-describedby`** — rompe accesibilidad, incumple WCAG.
- ❌ **Async validation sin debounce** — spam al backend, DDoS auto-inflingido.
- ❌ **Bloquear el submit si async validation está pending** — backend re-valida, no bloquees.
- ❌ **Confiar en `required` del HTML** como única validación — se salta con DevTools.

---

## Checklist

- [ ] Stack: RHF + Zod + `@hookform/resolvers/zod` instalado.
- [ ] Schema definido con Zod, tipo inferido con `z.infer`.
- [ ] Schema compartido (package monorepo) si el backend es TS.
- [ ] Backend valida TODO lo que valida el cliente (y más).
- [ ] `mode: 'onBlur'` + `reValidateMode: 'onChange'`.
- [ ] `aria-invalid` y `aria-describedby` en cada input.
- [ ] Mensajes de error específicos (qué está mal, no solo "inválido").
- [ ] Async validation con debounce 300ms, no bloqueante.
- [ ] Server errors mapeados a `setError` por field.
- [ ] Focus automático al primer error (default RHF).
- [ ] Honeypot + rate limit para forms públicos (login/signup).
- [ ] Tests unit de schemas (safeParse) + E2E de flujo (Playwright).
- [ ] Validaciones LatAm con libs correctas (CUIT, RUT, CPF, phone).
- [ ] Si hay campo edad/nacimiento → flujo tutor para menores.
- [ ] File upload: tamaño + MIME validados cliente Y servidor.
- [ ] Multi-step: schema por step, `FormProvider`, draft persistence.
- [ ] i18n si el producto tiene es/pt.

---

## Output esperado ✅

- Formulario con feedback claro y accesible.
- Schema Zod único, reutilizado en cliente y (si TS) backend.
- Tipos TS inferidos automáticamente, sin duplicación.
- Errores de servidor mapeados a los fields correctos.
- A11y WCAG AA: `aria-invalid`, `role=alert`, focus management.
- Performance: inputs uncontrolled, sin re-renders innecesarios.
- Tests unit de schemas + E2E del happy path y error paths.

---

## Delegación (links a otros skills)

- `/file-uploads` — validación real de archivos (MIME magic bytes, malware scan).
- `/rate-limiting` — backend rate limit para endpoints de auth / forms públicos.
- `/consent-cookies` — flujo de consentimiento tutor para menores (COPPA/GDPR-K).
- `/audit-dev` — revisión completa de seguridad incluyendo forms.
- `/api-docs` — generar OpenAPI desde schemas Zod (contract con backend Go).
