---
name: game-audit
description: "Audit assets, docs and cross-document consistency: naming, orphaned assets, doc-vs-code contradictions, balance red flags, entity registry."
category: "gamedev"
argument-hint: "[assets|docs|consistency|full] [path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# game-audit — Assets + Documents

Auditoría diagnóstica read-only. Produce reporte, no modifica archivos.

## 1. Asset Audit

| Directorio | Checks |
|------------|--------|
| Art (textures, sprites, meshes) | Naming, power-of-two, format (PNG UI, compressed 3D), size budget |
| Audio (SFX, music) | Naming, sample rate, format (OGG/MP3), duration |
| Data (JSON, YAML, SO) | Schema compliance, formato válido |

### Checks
- **Naming**: `lowercase_underscores`, patrón `[cat]_[name]_[variant].[ext]`
- **Orphaned**: sin referencias en código/escenas — verificar carga dinámica (Addressables, Resources.Load) antes de flaggear
- **Missing**: referencia en código a asset inexistente
- **Size**: comparar contra budget del art bible

Standards source: art bible > CLAUDE.md > flaggear "no standard defined"

## 2. Document Audit

Args: `gdd`, `spec-docs`, `gdd-vs-code`, `balance`, path específico, o sin arg = full.

| Tipo | Severidad | Qué buscar |
|------|-----------|------------|
| Contradicciones | CRITICAL | Misma mecánica descrita diferente entre docs/código |
| Gaps | HIGH | TBD/vacío, mecánicas sin definir, fórmulas sin números |
| Coherencia | MEDIUM | Edge cases, terminología inconsistente, fórmulas absurdas |
| Balance | MEDIUM | Estrategias dominantes, opciones peores, snowball, economía rota |
| Completitud | HIGH | Scope incompleto, dependencias ocultas |

Gap classification: Bloqueante (no se puede implementar) > Importante (antes del milestone) > Nice to have.

## 3. Consistency Check (entity registry)

Arg: `consistency`, `consistency entity:<name>`, `consistency item:<name>`.

Si existe registry (`design/registry/entities.yaml`): cargar lookup tables → grep nombres en GDDs → extraer valores cercanos → comparar.

| Tipo | Acción |
|------|--------|
| CONFLICT | Mismo nombre, valores diferentes — resolver antes de avanzar |
| STALE REGISTRY | Source GDD cambió, registry no actualizado |
| UNVERIFIABLE | Sin atributos comparables — solo informativo |

Resolución: GDD source es autoritativo. Si no existe registry → informar que se requiere uno.

## Formato del reporte

Estado general: SALUDABLE / NECESITA ATENCIÓN / CRÍTICO. Resumen ejecutivo (2-3 oraciones). Hallazgos en formato PAS condensado (≤5 líneas c/u) con severity. Asset compliance table. Sección "lo que está bien". Action items priorizados.

## Anti-patterns

- Auditar sin leer art bible primero
- Orphaned sin verificar carga dinámica
- Mezclar severidades sin priorizar
- Solo criticar sin reconocer buen diseño
