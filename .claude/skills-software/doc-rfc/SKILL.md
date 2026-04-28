---
name: doc-rfc
description: "Genera documentación técnica RFC: épicas, historias de usuario (HU) y tareas (T) siguiendo el formato de Alizia-BE. Estructura jerárquica con decisiones, specs y acceptance criteria. Usar cuando se mencione: RFC, documentación técnica, épica, historia de usuario, spec, desglose técnico."
argument-hint: "[rfc-title or feature-name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---
# RFC Documentation Generator — Estilo Alizia-BE

Genera documentación técnica estructurada: Épicas → Historias de Usuario → Tareas.

## Input

1. **Qué documentar** (nueva feature, sistema, refactor, migración)
2. **Nombre del proyecto** (para `docs/rfc-{proyecto}/`)
3. **Nivel de detalle** — `epic` (solo épica), `stories` (épica + HUs), `full` (épica + HUs + tareas)
4. **Contexto técnico** (stack, dependencias, restricciones)

## Estructura de carpetas

```
docs/rfc-{proyecto}/
├── decisiones/                    # Decision logs, comparativas técnicas
├── epicas/{NN}-{slug}/
│   ├── {NN}-{slug}.md             # Épica overview
│   └── HU-{N}.{M}-{slug}/
│       ├── HU-{N}.{M}-{slug}.md  # Historia de usuario
│       └── tareas/T-{N}.{M}.{P}-{slug}.md
└── operaciones/                   # Guides operativos
```

## Templates

### Épica
Secciones: título + one-liner, estado (Pendiente/En progreso/Completada), fase, proyecto. Problema (contexto + pain point), objetivos (medibles), alcance MVP (incluye/no incluye), stack tecnológico (tabla componente/tech/justificación), arquitectura (diagrama), tabla HUs (ID/título/descripción/fase/tareas), decisiones técnicas (opción+razón), principios diseño, épicas relacionadas, test cases.

### Historia de Usuario
"Como {rol}, necesito {feature}, para {beneficio}". Link a épica, fase, prioridad, estimación. Criterios aceptación (verificables, checkboxes). Diseño técnico: endpoints (tabla método/ruta/desc), modelos datos, flujo. Tabla tareas (ID/título/archivos/estado). Dependencias. Test cases. Notas implementador.

### Tarea
One-liner, link a HU, criterio aceptación (1 oración), archivos afectados. Pasos accionables. Código referencia. Tests (unitarios + integración checkboxes). Notas/edge cases.

### Decisión técnica
Fecha, estado, contexto. Tabla por opción: pros/contras/costo/ejemplo. Decisión elegida + razón. Consecuencias.

## Numeración

- Épicas: `00`, `01`, `02` (2 dígitos, cronológico)
- Historias: `HU-{épica}.{secuencial}` → `HU-0.1`, `HU-1.2`
- Tareas: `T-{épica}.{HU}.{secuencial}` → `T-0.1.1`, `T-1.2.3`

## Rules

- Siempre en español
- Criterios aceptación verificables (si/no, no ambiguos)
- Tareas lo suficientemente pequeñas para 1 PR
- Incluir paths de archivos cuando sea posible
- Tests aceptación en HU, tests unitarios en tarea
- Decisiones técnicas con ≥2 opciones comparadas
- Links relativos entre documentos
- Si el proyecto ya tiene épicas → numerar secuencialmente
