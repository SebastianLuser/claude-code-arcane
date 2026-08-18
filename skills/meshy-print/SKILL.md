---
name: meshy-print
description: "Prepara un asset para impresion 3D con Meshy: analyze printability (gratis) -> repair -> resize a mm reales -> STL/3MF. Usar para: imprimir 3d, printability, stl, resize mm, reparar malla para impresion."
category: "gamedev"
argument-hint: "<slug> [--height-mm <n>] [--multicolor]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-print — Preparar para impresion 3D

El flujo esta ordenado por costo a proposito: lo gratis primero, y lo caro solo si el diagnostico lo justifica.

## Input

- `<slug>` (requerido). Sin argumento → mostrar el uso y parar.
- `--height-mm <n>` (opcional): altura real de la pieza. Sin esto no se puede escalar bien.
- `--multicolor` (opcional): salida `3mf` en vez de `stl`.

Requiere `assets/3d/<slug>/master.glb`. Si no existe, parar: "Corre `/meshy-generate <slug>` primero."

---

## Phase 1: Analyze — gratis, siempre

```
mcp__meshy__analyze_printability
```

Cuesta **0 creditos**. Correrlo siempre, sin pedir confirmacion, antes que cualquier otra cosa.

Reportar el diagnostico al usuario en concreto: non-manifold, normals invertidas, paredes finas, geometria flotante, self-intersections. Este reporte es el que decide si vale la pena gastar en repair.

**Si el analisis sale limpio, saltar la Phase 2 entera.** Diez creditos de `repair` sobre una malla sana son diez creditos tirados.

---

## Phase 2: Repair — 10 creditos, solo si hace falta

Presentar el gate antes de llamar:

| | |
|---|---|
| Operacion | `repair_printability` |
| Costo | 10 creditos |
| Problemas que resuelve | (los que listo la Phase 1) |
| Balance actual | (de `check_balance`) |

Con confirmacion explicita, llamar `mcp__meshy__repair_printability` y pollear con `get_task_status`.

Despues del repair, **volver a correr `analyze_printability`** (gratis) para confirmar que quedo resuelto. No asumir que el repair funciono.

Si hay problemas que el repair no arregla, decirlo: algunos requieren edicion manual en Blender y no tiene sentido gastar dos veces.

---

## Phase 3: Escala real — 1 credito

Los modelos de Meshy vienen en unidades arbitrarias. Sin escalar, el slicer imprime cualquier cosa.

- **Con `--height-mm`**: `mcp__meshy__resize` a esa altura.
- **Sin `--height-mm`**: preguntar la altura antes de seguir. No adivinar.

Anotar la altura final en el ledger — es lo que evita reimprimir a la escala equivocada.

Chequear la altura contra el volumen de la impresora del usuario si lo sabemos; si no, avisar que lo verifique en el slicer.

---

## Phase 4: Exportar — 1 credito

`mcp__meshy__convert` a `stl` (o `3mf` con `--multicolor`, que preserva color por cara). Salida: `assets/3d/<slug>/targets/print.stl` (o `.3mf`).

`mcp__meshy__send_to_slicer` esta disponible si el usuario lo pide explicitamente.

---

## Phase 5: Print via Meshy — solo si lo piden

Meshy puede imprimir y enviar la pieza fisica. Es lo mas caro del catalogo:

| | Creditos |
|---|---|
| White model | 20 |
| Multicolor (`process_multicolor`) | 40 |

**Doble confirmacion**: mostrar el costo, esperar confirmacion, repetir el costo y el destino, esperar de nuevo. No entrar a esta fase por iniciativa propia — solo si el usuario la pidio.

---

## Phase 6: Ledger y resumen

Agregar cada task a `meshy.json` con sus creditos, sumar a `credits_total`, agregar el STL/3MF a `derived[]`, anotar la altura en mm. Mostrar el diff y **pedir aprobacion antes de escribir**.

Reportar: veredicto del analisis inicial, si hubo repair y si el re-analisis quedo limpio, altura final, archivo generado, y **creditos gastados reales** (delta de `check_balance`).

**Verdict:**
- **PRINT-READY** — analisis limpio, escala aplicada, archivo en disco.
- **NEEDS-MANUAL** — quedan defectos que el repair no resuelve. Listarlos y decir que hace falta en Blender.
- **BLOCKED** — falta el master, o falta la altura y el usuario no la dio.

## Next Steps

- Verificar la pieza en el slicer antes de imprimir: soportes, orientacion, volumen
- `/meshy-derive <slug> game` si el mismo asset ademas va al juego — el master es el mismo, los targets son independientes

---

> Tabla de creditos completa y reglas de gasto: `.claude/rules/meshy-assets.md`. La regla de "gratis antes que pago" de este flujo esta ahi tambien.
