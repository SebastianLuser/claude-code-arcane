---
name: meshy-generate
description: "Genera un asset 3D con Meshy: preview -> aprobacion -> refine, con gate de creditos, dedupe contra el ledger y escritura de meshy.json. Usar para: generar modelo 3D, text to 3d, image to 3d, crear asset con meshy."
category: "gamedev"
argument-hint: "<slug> [--from-image <path>] [--spec <path>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-generate — Generar un asset 3D

Un asset por corrida. **Nunca en batch.** Cada llamada de generacion cuesta 20-30 creditos reales.

## Input

- `<slug>` (requerido): kebab-case, sin fechas ni task_ids. Es el nombre de la carpeta. Sin argumento → mostrar el uso y parar.
- `--from-image <path>` (opcional): usa `image_to_3d` en vez de `text_to_3d`. Con varias imagenes, `multi_image_to_3d`.
- `--spec <path>` (opcional): spec de `asset-spec` de donde sale el prompt.

---

## Phase 1: Dedupe — antes de gastar

```bash
grep -rl "<termino>" assets/3d/*/meshy.json 2>/dev/null
```

Buscar por slug y por palabras clave del prompt. **Si hay un asset equivalente, parar**: mostrarlo al usuario, con su `credits_total`, y preguntar si quiere reusarlo, derivar un target nuevo con `/meshy-derive`, o generar igual.

Si `assets/3d/<slug>/` ya existe, no pisarlo. Parar y preguntar.

---

## Phase 2: Prompt

- **Con `--spec`**: el prompt sale del spec, textual.
- **Sin spec**: si existe art bible (`design/art/art-bible.md` o equivalente), derivar el prompt de ahi — estilo, paleta, nivel de detalle. Si no existe, redactarlo con el usuario.
- Nunca inventar un estilo que contradiga el art bible.

Mostrar el prompt final y pedir aprobacion. El prompt aprobado va al ledger textual: es lo que hace que el dedupe de la proxima sesion funcione.

---

## Phase 3: Gate de creditos

Antes de la primera llamada que gasta:

```
mcp__meshy__check_balance
```

Presentar al usuario, en un solo mensaje:

| | |
|---|---|
| Operacion | `text_to_3d` preview |
| Costo estimado | 20-30 creditos (preview + refine) |
| Balance actual | (de `check_balance`) |

**Esperar confirmacion explicita.** No generar con un "dale" ambiguo sobre otra cosa — la confirmacion tiene que ser sobre el costo mostrado.

---

## Phase 4: Preview

Llamar `mcp__meshy__text_to_3d` (o `image_to_3d` / `multi_image_to_3d`) en modo preview. Pollear con `mcp__meshy__get_task_status` — es gratis, no hay razon para adivinar.

Bajar el preview con `mcp__meshy__download_model` y **mostrarselo al usuario**. Anotar el `task_id` y los creditos del preview en el ledger ya en este punto: si el refine se cancela, el gasto del preview igual ocurrio y tiene que quedar registrado.

---

## Phase 5: Refine — solo con el preview aprobado

Si el preview no convence: **no refinar**. Opciones, en orden de costo:
1. Ajustar el prompt y volver a preview.
2. `retexture` (10) si la geometria sirve y el problema es la textura.
3. Descartar.

Con el preview aprobado, llamar `mcp__meshy__text_to_3d_refine`. El GLB resultante es el **master** y es inmutable — nada lo edita despues.

---

## Phase 6: Escribir en disco

```
assets/3d/<slug>/
  meshy.json
  master.glb
  thumb.png
```

Mostrar el contenido de `meshy.json` y **pedir aprobacion antes de escribir**. Se escribe **en este mismo turno**, con el prompt textual, `ai_model`, un entry por task con sus creditos, y `credits_total`. El formato exacto esta en la rule.

Verificar que `master.glb` este cubierto por Git LFS (`git check-attr filter assets/3d/<slug>/master.glb`). Si no lo esta, avisar — commitear un GLB sin LFS ensucia el repo de forma dificil de revertir.

---

## Phase 7: Resumen

Reportar:
- Slug, prompt usado y de donde salio (spec / art bible / redactado).
- Task ids y **creditos gastados reales** (correr `check_balance` de nuevo y reportar el delta contra Phase 3).
- Archivos escritos.
- Estado de LFS.

**Verdict:**
- **COMPLETE** — master en disco, ledger escrito, LFS ok.
- **PARTIAL** — se gasto en preview pero no hubo refine. El ledger tiene que reflejarlo igual. Decir cuanto se gasto.
- **ABORTED** — no se gasto nada. Decir por que.

## Next Steps

- `/meshy-derive <slug>` para los targets (FBX, web, blend) — el master no se toca
- `/meshy-print <slug>` si va a impresion
- `/asset-audit` para validar contra los standards del proyecto

---

> Tabla de creditos completa, reglas de gasto, formato del ledger y convenciones de ejes/escala: `.claude/rules/meshy-assets.md`. Leerla antes de la Phase 3.
