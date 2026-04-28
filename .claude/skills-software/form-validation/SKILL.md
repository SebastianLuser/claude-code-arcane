---
name: form-validation
description: "Form validation decision guide: RHF + Zod, client vs server strategy, schema design, error UX, LatAm fields, anti-patterns."
argument-hint: "[stack: react|rn] [form-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# Form Validation — Decision Guide

**Core principle:** Backend validates for security (sole authority). Client validates for UX only.
Use when: forms in React/RN, shared schemas in TS monorepo, LatAm fields, multi-step or async validation.
Skip when: Go backend param validation (`go-playground/validator`), non-user data, trivial filters.

## Stack

**React Hook Form** (uncontrolled, performant) + **Zod** (schema-first, `z.infer` for TS types) + **@hookform/resolvers/zod**.
Rejected: Formik (slower), Yup (weaker TS), Joi (backend-only). RN: same stack with `Controller`.

## Validation Strategy

| Concern | Where |
|---|---|
| Field format/required | Client (Zod) + backend |
| Business rules | Backend only |
| Uniqueness (email, username) | Client async (debounce 300ms) + backend |
| File validation | Client (size/MIME via Zod refine) + backend (magic bytes) |

**Monorepo TS:** single Zod schema in shared package for both layers.
**Backend Go:** struct tags + OpenAPI contract (`zod-to-openapi` / `oapi-codegen`). CI contract tests.

## Schema Design

- Extract common fields (email, phone, password) into reusable modules
- Compose with `.merge()` / `.extend()`, cross-field logic with `.refine()` / `.superRefine()`
- Multi-step: one schema per step + combined for final submit
- Password: min 8 + letter + number — no symbols/uppercase (OWASP-aligned)

## Error UX

- Mode: `onBlur` + `reValidateMode: 'onChange'` — never onChange from first keystroke
- Inline errors adjacent to field, never `alert()` or top-level banners for field errors
- A11y: `aria-invalid` + `aria-describedby` → error with `role="alert"`, auto-focus first error
- Never clear inputs on failed submit. Map server field errors via `setError()`

## LatAm Fields

Use check-digit libraries, not just regex: **CUIT/CUIL** (AR) → `cuit-validator`, **RUT** (CL) → `validar-rut`, **CPF/CNPJ** (BR) → `cpf-cnpj-validator`, **Phone** → `libphonenumber-js`, **DNI** (AR) → regex 7-8 digits.

## Additional Patterns

- **Async:** debounce 300ms, inline spinner, do NOT block submit
- **Honeypot:** hidden off-screen input, reject silently if filled
- **Multi-step:** `FormProvider`, `trigger()` per step, persist draft in storage
- **i18n:** parameterize messages, recreate schema on locale change or `z.setErrorMap`
- **Minors:** age <13 COPPA / <18 triggers guardian consent flow

## Anti-patterns

- Validating only client-side — backend MUST re-validate
- Impossible password regex (10+ requirements) — causes reuse
- Errors before user interacts with field
- Generic messages ("Invalid") without specifics
- Duplicated schemas client vs backend TS — use shared package
- Missing `aria-invalid` / `aria-describedby` — breaks WCAG
- Async validation without debounce

## Checklist

- [ ] RHF + Zod + resolver installed
- [ ] Schema shared (monorepo TS) or contract-tested (Go)
- [ ] Backend validates everything client does (and more)
- [ ] `onBlur` mode, a11y attributes on every input
- [ ] Server errors mapped via `setError`, LatAm fields use check-digit libs
- [ ] Honeypot + rate limit on public forms
