---
name: upwork-scan
description: "Find and score Upwork job posts against your profile and floor rate, with dedup across runs so you never re-triage the same offer. Works manually by pasting a post; the GraphQL API is an optional accelerator. Triggers: buscar proyectos en upwork, scan de ofertas freelance, scorear ofertas, corrida de busqueda freelance, que ofertas me convienen."
argument-hint: "[búsqueda | job-url | post pegado]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, WebSearch
---

# Upwork Scan - Encontrar y scorear ofertas

Producís una **cola triageada** de ofertas: scoreadas contra el perfil y el piso de tarifa, sin repetir lo que ya viste en corridas anteriores. No postulás nada acá - el objetivo es decidir en qué gastar el screen y los Connects.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Búsqueda indicada: `$ARGUMENTS`

## Los dos modos de obtener ofertas

### Manual (default, siempre funciona)

El usuario pega la URL o el texto de una o varias ofertas, o describe la búsqueda y las trae él. Vos scoreás, dedupeás y triageás.

Este es el modo principal, no un fallback degradado: la decisión de a qué postularse es el trabajo, y traer 10 ofertas a mano cuesta minutos.

### API GraphQL (opcional, si hay key)

Upwork tiene API de lectura para búsqueda de ofertas, con OAuth2. Requiere pedir una API key desde la cuenta (respuesta por mail en hasta 2 semanas). Detalle de la query, autenticación y límites: `references/upwork-api.md`.

**Dos cosas que hay que saber antes de contar con esto:**

- **Los RSS feeds están discontinuados** desde el 20 de agosto de 2024. Cualquier tutorial que los mencione está viejo.
- **La API no tiene mutation para postularse ni gastar Connects.** Es de lectura para este propósito. Eso está así a propósito para frenar auto-bidding, y este skill no intenta rodearlo.

**Scrapear no es una alternativa.** Va contra los ToS de Upwork y es exactamente lo que la plataforma cerró. Si no hay API key, se usa el modo manual.

## Scoring

Cada oferta recibe un `match_score` 0-100. Tres componentes, y el tercero es el que la mayoría ignora:

### 1. Fit técnico (0-40)

Cuánto de lo que piden cubrís con evidencia real del perfil. Must-haves cubiertos pesan; nice-to-haves suman poco. Un must-have que no cubrís no se compensa con tres nice-to-haves.

### 2. Viabilidad económica (0-40)

El presupuesto contra tu piso neto, estimando el esfuerzo real del alcance descrito.

- Presupuesto que no llega al piso → **máximo 10 en este componente**, sin importar lo lindo que sea el proyecto.
- Presupuesto sin especificar → no asumas que es bueno. Puntuá con la incertidumbre y marcalo.

### 3. Probabilidad de que exista de verdad (0-20)

La mitad de las ofertas de un marketplace no terminan contratando a nadie. Señales de que esta sí:

- Cliente con payment verificado y contrataciones previas
- Oferta reciente y con pocas propuestas todavía
- Post específico y escrito por alguien que sabe lo que pide
- Cliente que respondió preguntas en el propio post

Señales contrarias: hire rate bajo con muchos posts, oferta vieja con 50+ propuestas, post genérico reutilizado.

### Umbrales

| Score | Acción |
|---|---|
| 70+ | Cola de screen: correr `/client-screen` |
| 50-69 | Segunda vuelta: solo si la cola alta está vacía |
| < 50 | Descartar y registrar el motivo en el estado de dedup |

Los umbrales se documentan en la corrida. Si el usuario los quiere mover, se mueven - pero explícitamente, no por acomodo.

## Dedup entre corridas

Mismo mecanismo y mismo archivo que `/job-scrape`: `<workspace>/tools/job_scraper/seen_jobs.json`. Si `+job-hunt` está instalado, el estado es compartido y no hay dos archivos.

Claves: URL canónica sin parámetros de tracking, y `job_key` = `slug(cliente)|slug(titulo)`. Matching blando (mismo cliente + títulos parecidos) es **warning**, nunca dedup automático.

Flujo unidireccional: `seen_jobs` → nota → dashboard, nunca de vuelta. Playbook completo, incluido el mantenimiento de punteros rotos: `../job-scrape/references/dedup-playbook.md` si está instalado, o `references/dedup.md`.

Reposteos: en Upwork es común que un cliente cierre y republique la misma oferta. Si el `job_key` matchea una entrada `descartado`, avisar que ya se descartó antes y por qué, en vez de volver a triagearla de cero.

## Proceso

1. **Cargar el estado de dedup.** Validar que las entradas `nota_creada` apunten a notas existentes; reportar las rotas.
2. **Obtener las ofertas** (manual o API).
3. **Dedupear** contra `seen_jobs.json`. Reportar cuántas se filtraron para que el usuario vea que el mecanismo trabaja.
4. **Scorear** las nuevas con los tres componentes. Mostrar la tabla en el chat: título, cliente, presupuesto, score y los tres subscores.
5. **Triagear** con approval del usuario: qué pasa a screen, qué queda en segunda vuelta, qué se descarta y por qué.
6. **Registrar** en `seen_jobs.json`. Crear nota en `03-Aplicaciones/` (template `Propuesta`, `tipo: freelance`, `estado: interesado`) solo para las que pasan a screen - no llenar el workspace de notas de ofertas descartadas; el motivo del descarte vive en el estado de dedup.

## Reglas

- **Nunca inventar ofertas, presupuestos ni datos de clientes.** Todo sale del post real.
- **No scrapear Upwork** ni sugerir herramientas que lo hagan.
- Un presupuesto abajo del piso no se "compensa" con entusiasmo por el proyecto.
- Sin guiones largos en las notas.
- No crear notas para ofertas que no pasan el umbral.

## Handoff

Corrida COMPLETE cuando la cola quedó triageada y el estado de dedup actualizado. El siguiente paso es `/client-screen` sobre la primera de la cola alta. Si la corrida trajo poco o nada usable varias veces seguidas, el problema es el targeting: corré `/freelance-pipeline`.
