---
name: vault-audit
description: "Reporte de salud del vault de Obsidian via script Python: huerfanas, links roto, notas stale, tag sprawl, nombres duplicados y frontmatter fuera de contrato. Read-only, no escribe nada. Triggers: auditar el vault, salud del vault, notas huerfanas, links roto, vault audit, que tan sano esta mi vault."
argument-hint: "[--vault <path>] [--stale-days N] [--seed-days N] [--exempt <dir>] [-n 0]"
category: "pkm"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Vault Audit - Salud del vault

Medís el estado real del vault y explicás qué significan los números. **Este skill es read-only:** no escribe ni una línea en el vault. Los arreglos necesitan approval del usuario y los aplica `/vault-tidy`.

Flags: `$ARGUMENTS`

## Fase 1 - Correr el script

El conteo lo hace Python, no vos: leer nota por nota para contar links cuesta cientos de miles de tokens en un vault real y da números peores.

```bash
python .claude/skills/vault-audit/scripts/vault_audit.py "<vault>" --format json
```

Flags útiles: `--stale-days N` (default 180), `--hollow-words N` (default 30), `--task-days N` (default 7), `--seed-days N` (default 30), `--require <campo>` (repetible, default `created` y `type`), `--exempt <carpeta>` (repetible, default `Templates` y `04_Archive`), `-n 0` para no truncar listas, `--audit-all` para auditar también las carpetas exentas.

El script solo lee el filesystem: sin dependencias, corre sobre miles de notas en segundos.

**Los defaults no son la verdad del vault: el `CLAUDE.md` lo es.** Antes de correr, leer su contrato y traducirlo a flags: los campos de frontmatter a `--require`, y los roles `templates` y `archive` a `--exempt`. Auditar un vault adoptado con los defaults produce hallazgos falsos (sus plantillas aparecen como huérfanas huecas) y esconde los reales.

## Fase 2 - Interpretar

Un hallazgo no es un problema hasta que sabés por qué está ahí. Las lecturas que importan:

| Hallazgo | Qué suele significar | Cuándo NO es un problema |
|---|---|---|
| `orphans` | Notas que nadie linkea y que no linkean nada: el síntoma del vault-cementerio | Casi nunca. Es el hallazgo que más vale atacar. |
| `no_backlinks` | Nada apunta a la nota, aunque ella sí apunta a otras | Notas de entrada (dashboards, hubs de primer nivel) |
| `broken_links` | Link a una nota que no existe. Los `aliases` del frontmatter ya se resuelven, igual que en Obsidian, así que un `[[Nacho]]` que apunta al hub "Ignacio Martinez" no aparece acá | **Un link roto es muchas veces una intención, no un error:** es la nota que el usuario todavía no escribió. Distinguí typo de intención antes de proponer nada. |
| `ambiguous_names` | Dos archivos con el mismo nombre en carpetas distintas | Nunca: hace que todo `[[link corto]]` a ese nombre resuelva de forma impredecible. Es el hallazgo más urgente aunque parezca menor. |
| `stale` | Sin tocar en 180 días o más. Las `evergreen` **no** aparecen acá: ya dijeron lo que tenían que decir | Referencia que ya hizo su trabajo pero que nadie marcó `evergreen` todavía |
| `stale_seeds` | Notas en `seed` hace más de 30 días | Casi nunca. Es la falla clásica del vault: las semillas nunca maduran. Es más grave que una huérfana porque no se ve. |
| `contested` | Notas marcadas como contradictorias y sin resolver | Nunca es un error del vault: es el vault haciendo su trabajo. Va al `/review-monthly`, no a `/vault-tidy`. |
| `hollow` | Menos de 30 palabras | Semilla reciente. Dejala crecer. |
| `single_use_tags` | Tags usados una sola vez | Inocuo salvo que sean cientos: ahí hay confusión de vocabulario, no organización. |
| `stale_open_tasks` | Tareas abiertas en un día que ya cerró | Es la regla de arrastre incumplida: había que cancelarlas en su día. |
| `missing_frontmatter` | Campos del contrato ausentes | Notas viejas anteriores al contrato |
| `orphan_attachments` | Imágenes y PDFs que nadie embebe | Ocupan espacio, no rompen nada |

El campo `status` del contrato (`seed | provisional | evergreen | contested | archived`) es lo que hace accionables a `stale` y `hollow`: sin él, una nota de referencia que ya cumplió y un stub abandonado se reportan igual. `counts.by_status` te dice cuánto del vault está declarado y cuánto no.

Dos métricas de tendencia valen más que cualquier lista: **`avg_links_per_note`** (si es baja, el vault es un archivo de documentos, no una red de ideas) y **`orphan_rate`**. Compará contra el monthly anterior si existe.

## Fase 3 - Reportar

1. Los conteos primero, en una tabla corta. Sin adornos.
2. Los 3 a 5 hallazgos que valen la pena, ordenados por impacto real: `ambiguous_names` y `orphans` arriba, `hollow` y `single_use_tags` abajo o directamente omitidos si son ruido.
3. **Si el reporte trae `truncated`, decirlo con el total real.** Un reporte truncado que no se anuncia se lee como un vault sano, y esa es la única mentira que este skill no puede cometer.
4. Cerrar con una recomendación concreta: qué arreglaría primero y por qué.

Audit COMPLETE cuando el usuario sabe los números, cuáles importan y cuál es el primer arreglo.

## Reglas

- No escribir en el vault. Ni una nota, ni un frontmatter, ni un link. Para eso está `/vault-tidy`.
- No dramatizar los números: un vault de 2000 notas con 40 huérfanas está sano.
- No proponer plugins como solución a un problema de higiene: menos plugins es más sano.
- No sugerir borrar nada. El vocabulario es archivar.
- Sin guiones largos en el reporte.

## Handoff

Con el reporte listo, el siguiente paso es `/vault-tidy` para aplicar los arreglos elegidos con approval item por item. Si el audit muestra muchas huérfanas del mismo tema, el arreglo real es `/hub-note` para el hub que falta. `/review-monthly` corre este audit como parte del cierre del mes.
