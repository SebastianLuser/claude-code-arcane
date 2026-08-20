---
name: meshy-derive
description: "Deriva targets (FBX para Unity/UE5, GLB web optimizado, blend, STL) desde el master GLB de un asset. Usa convert (1 credito) o gltf-transform (gratis), nunca regenera. Usar para: exportar asset, target unity, target web, optimizar glb, lod web."
category: "gamedev"
argument-hint: "<slug> [game|web|edit|print|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-derive — Master a targets

Todos los targets salen del `master.glb`. **Nunca se regenera desde el prompt** — eso son 20-30 creditos para algo que cuesta 1 o 0.

## Input

- `<slug>` (requerido). Sin argumento → mostrar el uso y parar.
- Target (opcional, default `all`): `game` | `web` | `edit` | `print` | `all`.

---

## Phase 1: Validar el master

- `assets/3d/<slug>/master.glb` tiene que existir. Si no, parar: "Corre `/meshy-generate <slug>` primero."
- Leer `assets/3d/<slug>/meshy.json`. Si el target pedido ya esta en `derived[]` y el archivo existe en disco, **no rehacerlo**: reportarlo y parar.

El master es inmutable. Ninguna fase de esta skill lo escribe.

---

## Phase 2: Elegir la herramienta

| Target | Salida | Como | Creditos |
|---|---|---|---|
| `game` | `targets/game.fbx` | `mcp__meshy__convert` -> `fbx` | 1 |
| `edit` | `targets/edit.blend` | `mcp__meshy__convert` -> `blend` | 1 |
| `print` | `targets/print.stl` (`.3mf` si multicolor) | `mcp__meshy__convert` | 1 |
| `web` | `targets/web.glb` | `npx gltf-transform` | **0** |

Un solo `game.fbx` sirve para Unity y UE5. No generar uno por engine.

**Nunca usar `remesh` (5) donde `convert` (1) alcanza.** `remesh` cambia topologia; no es un conversor de formato. Y nunca usar `remesh` para LODs de web: `gltf-transform` hace decimation, meshopt y KTX2 en local y gratis.

---

## Phase 3A: Web — gratis, local

```bash
npx --yes @gltf-transform/cli optimize \
  assets/3d/<slug>/master.glb \
  assets/3d/<slug>/targets/web.glb \
  --simplify --texture-compress ktx2 --compress draco
```

Presupuesto: ≤15k tris, texturas 1024. Verificar el resultado:

```bash
npx --yes @gltf-transform/cli inspect assets/3d/<slug>/targets/web.glb
```

Reportar tris y tamaño finales. Si queda por encima del presupuesto, bajar con `--simplify-ratio` antes de dar por bueno — no aceptar el default en silencio.

Cero creditos: esta fase no necesita confirmacion de gasto.

## Phase 3B: convert — 1 credito por target

Cada `convert` gasta. Mostrar al usuario **la lista completa de targets y el total** en un solo mensaje y pedir una confirmacion para todo el lote:

> `game` + `edit` = 2 creditos. Balance actual: N.

Con `all`, hacer web primero (gratis) y despues los `convert` — asi el usuario ve un resultado antes de aprobar gasto.

Pollear con `mcp__meshy__get_task_status`, bajar con `mcp__meshy__download_model`.

---

## Phase 4: Ejes y escala

Verificar una vez por asset y **anotarlo en el ledger** para no volver a pensarlo:

| Destino | Convencion |
|---|---|
| GLB | Y-up, metros |
| Unity | Y-up, 1 unidad = 1 m |
| UE5 | Z-up, 1 unidad = 1 cm — rotacion + factor 100 al importar |
| Blender | Z-up, metros |

El FBX se importa igual en los dos engines; lo que cambia es la config de import, no el archivo.

**Rigging**: si el asset esta rigueado, el esqueleto de Meshy no es el mannequin de UE5 — el retargeting es manual. En UE5, los static meshes van a Nanite y no necesitan LODs; los skeletal meshes si.

---

## Phase 5: Actualizar el ledger

Agregar cada target a `derived[]` en `meshy.json`, sumar los creditos de los `convert` a `tasks[]` y a `credits_total`. **En el mismo turno.** Mostrar el diff del ledger y **pedir aprobacion antes de escribir**.

Verificar LFS sobre los archivos nuevos (`git check-attr filter`).

---

## Phase 6: Resumen

Reportar: targets generados, creditos gastados reales (delta de `check_balance`), tris/tamaño del web target, y que quedo sin hacer.

**Verdict:**
- **COMPLETE** — todos los targets pedidos en disco y en el ledger.
- **PARTIAL** — alguno fallo o el usuario no aprobo el gasto. Decir cual y por que.
- **SKIPPED** — ya existian, no se gasto nada.

## Next Steps

- `/asset-audit` para validar naming, budgets y formatos contra los standards
- `/meshy-print <slug>` si ademas va a impresion (tiene su propio flujo de printability)
- `/blender-context` si el derivado `.blend` necesita limpieza: la topologia que sale de Meshy no
  esta pensada para deformar, y las UVs suelen necesitar rehacerse. Ahi siguen `/blender-modeling`,
  `/blender-materials` y `/blender-export` con su validador de glTF

---

> Presupuestos, estructura de `targets/`, formato del ledger y la tabla de creditos completa: `.claude/rules/meshy-assets.md`.
