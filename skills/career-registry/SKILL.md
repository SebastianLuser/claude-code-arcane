---
name: career-registry
description: "Traceability across the whole career workspace: check whether you already applied somewhere before spending another application, export everything to CSV, and audit the registry for gaps and drift. Covers job applications, freelance proposals and contracts. Triggers: ya me postule a, ya aplique aca, exportar postulaciones a csv, registro de aplicaciones, trazabilidad, historial de postulaciones, cuantas mande, planilla de postulaciones, auditar el registro."
argument-hint: "[check <empresa|url> | export | stats | audit]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Career Registry - Trazabilidad y registro

Contestás la pregunta que grepear a mano contesta mal: **¿ya me postulé acá?** Y das el registro completo en CSV para mirarlo en una planilla.

Sirve a los dos perfiles: `+job-hunt` (empleo) y `+freelance` (proyectos). Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Modo: `$ARGUMENTS`

## La regla que sostiene todo esto

**Las notas son la fuente de verdad. El CSV se deriva de ellas, siempre.**

No hay una segunda base que mantener sincronizada, y no la va a haber: una segunda base diverge en dos semanas y después nadie sabe cuál miente. Es el mismo flujo unidireccional que el dedup de `/job-scrape` (`seen_jobs` → nota → vista, nunca de vuelta).

Consecuencia práctica: si el CSV está mal, se arregla la nota, no el CSV. Y si el usuario pide "guardame el CSV para editarlo a mano", avisale que en la próxima corrida se pisa.

## Los cuatro modos

```bash
python .claude/skills/career-registry/scripts/career_registry.py check "Acme"
python .claude/skills/career-registry/scripts/career_registry.py check "https://www.linkedin.com/jobs/view/123"
python .claude/skills/career-registry/scripts/career_registry.py export --csv registro.csv
python .claude/skills/career-registry/scripts/career_registry.py stats
python .claude/skills/career-registry/scripts/career_registry.py audit
```

### `check` - antes de gastar otra postulación

Busca por **tres claves** porque el usuario pega cualquiera de las tres: nombre de la contraparte, URL de la oferta, o título de la nota.

Es tolerante donde importa: `acme` encuentra a "Acme Inc" (ignora sufijos legales), `tecnologia latam` encuentra a "Tecnología Latam SA" (ignora acentos), y una URL con `?utm_source=...` distinto encuentra la misma oferta (canoniza el link, igual que el dedup).

Devuelve un veredicto de tres valores, y la diferencia entre los dos primeros importa:

| Veredicto | Qué significa |
|---|---|
| `YA TE POSTULASTE` | Hay una nota en estado enviado. No repitas |
| `YA LO VISTE, NO TE POSTULASTE` | Hay nota o entrada de dedup, pero nunca se envió. Vale revisarla antes de descartarla de nuevo |
| `SIN REGISTRO` | Nunca apareció |

Cuándo correrlo: **antes de `/client-screen` o `/job-aplicar`**, cuando el nombre suena conocido. Un screen sobre algo que ya descartaste hace tres meses es trabajo repetido, y peor, te hace repetir el descarte sin recordar por qué.

### `export` - el CSV

Una fila por nota, con `tipo` discriminando empleo / freelance / contrato. Columnas: contraparte, título, estado, si está abierta, plataforma, `match_score`, riesgo del cliente, perfil usado, bid o monto, costo de postularse, fechas, **días sin movimiento**, link y la ruta de la nota.

Sin `--csv` va a stdout; con `--csv <archivo>` lo escribe en UTF-8 con BOM para que Excel no rompa los acentos. `--tipo` filtra a un solo tipo.

`dias_sin_movimiento` es la columna más útil de la planilla: ordenando por ahí aparece lo que quedó colgado.

### `stats` - conteos

Total y abiertas por tipo, desglose por estado, cuántas se enviaron y el costo de postulaciones registrado.

Trae `muestra_suficiente_para_tasas`: **con menos de 10 enviadas es `false`, y ahí no hay que calcular tasas de conversión**. Diez rechazos no son un patrón, y tratarlos como tal manda al usuario a arreglar lo que no estaba roto.

### `audit` - las divergencias

Lo que hace que la trazabilidad sea real y no una intención:

- Notas sin `estado` o sin contraparte
- Enviadas sin fecha de envío (rompe cualquier cálculo de tiempos)
- **Abiertas frenadas hace 21+ días** - candidatas a follow-up con `/cold-outreach` o a cerrar como `sin_respuesta`
- Posibles duplicados: misma contraparte, mismo título, dos notas
- **Contratos con horas reales arriba de lo estimado**, con el exceso en horas y en porcentaje. Cada uno es trabajo regalado si no hubo change order
- Punteros del dedup que apuntan a notas que ya no existen

## Proceso

1. Correr el modo pedido. Si el workspace no existe, el script lo dice y sugiere `/freelance-hunt setup` o `/job-hunt setup`.
2. **Mostrar el resultado en el chat, no solo el JSON crudo.** Para `check`, el veredicto y una línea por coincidencia con su estado. Para `audit`, agrupado por severidad: primero lo que cuesta plata (horas de más, enviadas sin fecha), después lo cosmético.
3. Para cada hallazgo de `audit`, ofrecer la acción concreta: follow-up, cerrar como `sin_respuesta`, change order, o completar el campo que falta.
4. Los arreglos se hacen **en la nota** con approval del usuario, una por una. Nunca en masa.

## Reglas

- **Nunca editar el CSV como si fuera la fuente de verdad.** Se regenera; los cambios van a la nota.
- **No editar notas en masa.** Cada arreglo se muestra y se aprueba.
- Nunca inventar un dato que falta: si una nota no tiene fecha de envío, se pregunta o se deja el hueco reportado.
- No cambiar `estado`: eso lo hace `/job-outcome`, que es el único que mueve el pipeline.
- El CSV puede tener nombres de clientes y montos: **no commitearlo a un remoto sin confirmación explícita**.
- Sin guiones largos en el texto agregado a las notas.

## Handoff

Pedí aprobación (approval) antes de escribir el CSV o tocar una nota. Registro COMPLETE cuando el modo corrió y el usuario sabe qué hacer con cada hallazgo. Según el caso, el siguiente paso es `/cold-outreach` (follow-up de lo frenado), `/job-outcome` (cerrar lo que no va a responder), `/contract-and-proposal-writer` (change order de las horas de más) o `/freelance-pipeline` (si hay 10+ resueltas y querés el diagnóstico del embudo).
