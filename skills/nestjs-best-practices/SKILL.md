---
name: nestjs-best-practices
description: "NestJS production best practices: 40 reglas en 10 categorías (arquitectura, DI, errores, seguridad, performance, testing, DB/ORM, API, microservicios, devops) priorizadas por impacto. Usar al escribir/revisar código NestJS."
category: "backend"
argument-hint: "[architecture|di|security|performance|testing|database|api|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# nestjs-best-practices — Guía priorizada por impacto

40 reglas para aplicaciones NestJS production-ready, organizadas en 10 categorías y priorizadas de **CRITICAL** a **LOW-MEDIUM**. Cada regla del catálogo (en `references/`) trae impacto, ejemplo incorrecto, ejemplo correcto y link a docs.

## MANDATORY WORKFLOW

**No aplicar las 40 reglas a ciegas. Diagnosticar primero, priorizar por impacto.**

### Step 0: Determinar scope

1. **¿Código nuevo o auditoría de existente?** Si es auditoría, leer primero el módulo/servicio objetivo.
2. **¿Qué categoría aplica?** Mapear el área del problema (ver tabla) o usar `all` para review completa.
3. **¿Hay síntomas concretos?** (crashes, lentitud, N+1, leaks) → ir directo a la categoría relevante.

### Step 1: Priorizar por impacto

Aplicar en este orden — no bajar de nivel hasta resolver el anterior:

| Prioridad | Categoría | Impacto | Reference |
|-----------|-----------|---------|-----------|
| 1 | Architecture | CRITICAL | `references/architecture.md` |
| 2 | Dependency Injection | CRITICAL | `references/dependency-injection.md` |
| 3 | Error Handling | HIGH | `references/error-handling.md` |
| 4 | Security | HIGH | `references/security.md` |
| 5 | Performance | HIGH | `references/performance.md` |
| 6 | Database & ORM | MEDIUM-HIGH | `references/database.md` |
| 7 | Testing | MEDIUM-HIGH | `references/testing.md` |
| 8 | API Design | MEDIUM | `references/api-design.md` |
| 9 | Microservices | MEDIUM | `references/microservices-devops.md` |
| 10 | DevOps & Deployment | LOW-MEDIUM | `references/microservices-devops.md` |

### Step 2: Aplicar + verificar

Para cada regla relevante: leer el ejemplo correcto en el reference, aplicarlo, y verificar contra el checklist de cierre.

### Step 3: Checklist de cierre

- [ ] Sin dependencias circulares (`madge --circular` o equivalente)
- [ ] Constructor injection en todos los providers; cero `ModuleRef.get()` en runtime
- [ ] `ValidationPipe` global + DTOs decorados en todos los endpoints
- [ ] Guards declarativos para auth/authz (no checks manuales)
- [ ] Sin N+1 (eager loading / joins donde corresponde)
- [ ] Migraciones versionadas, `synchronize: false` en prod
- [ ] Graceful shutdown (SIGTERM) + health checks
- [ ] Structured logging (JSON)

Si todo el checklist pasa → código **COMPLIANT**. Antes de escribir cambios significativos, confirmar el approach con el usuario (Question → Decision → Approval).

## Tabla de mapeo síntoma → categoría

| Síntoma | Categoría |
|---------|-----------|
| Crash al arrancar / módulos no resuelven | Architecture, DI |
| Lentitud en endpoints, muchas queries | Performance, Database |
| Errores 500 inconsistentes / leaks de stack traces | Error Handling |
| Endpoints expuestos / brute force / data sensible | Security |
| Tests frágiles o que llaman servicios reales | Testing |
| Respuestas inconsistentes / circular refs | API Design |

---

_Adaptado de [kadajett/agent-nestjs-skills](https://github.com/kadajett/agent-nestjs-skills). El repo original compila reglas atómicas (`rules/*.md`) a un `AGENTS.md` vía build script; acá se reorganizó al formato skill+references de Arcane._
