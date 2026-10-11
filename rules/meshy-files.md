---
paths:
  - "assets/3d/**"
---

# Meshy Files

Como se guardan los assets de Meshy. Los creditos y las reglas de gasto estan en `.claude/rules/meshy-assets.md`, que se carga siempre.

## Master unico, derivados baratos

El GLB refined es la fuente de verdad y es **inmutable**. Ningun target se genera desde el prompt: todos salen del master.

| Target | Como | Creditos |
|---|---|---|
| Unity y UE5 | `meshy_convert` -> `fbx` (un solo archivo sirve para los dos) | 1 |
| Blender | `meshy_convert` -> `blend` | 1 |
| Impresion | `meshy_convert` -> `stl` (`3mf` si es multicolor) | 1 |
| Web / three.js | `npx gltf-transform optimize --simplify` | **0** |

## Estructura en disco

```
assets/3d/<slug>/
  meshy.json           # ledger, ver abajo
  master.glb           # refined, inmutable
  thumb.png
  targets/
    web.glb            # <=15k tris, texturas 1024, KTX2 + draco
    game.fbx           # Unity + UE5
    edit.blend
    print.stl
```

Slugs en kebab-case, sin fechas ni task_ids en el path.

## Ledger: `meshy.json`

Obligatorio por asset. Sin esto cada sesion nueva arranca ciega y se paga dos veces el mismo modelo.

```json
{
  "slug": "rune-pedestal",
  "prompt": "...",
  "ai_model": "meshy-5",
  "tasks": [
    { "id": "...", "op": "text_to_3d_preview", "credits": 5, "at": "2026-08-18T14:02:00Z" },
    { "id": "...", "op": "text_to_3d_refine", "credits": 25, "at": "2026-08-18T14:11:00Z" }
  ],
  "credits_total": 30,
  "derived": ["targets/web.glb", "targets/game.fbx"]
}
```

Actualizar `meshy.json` **en el mismo turno** en que se genera. No dejarlo para despues.

## Ejes y escala

Verificar una vez, anotar en el ledger, no volver a pensarlo.

| Destino | Convencion |
|---|---|
| GLB | Y-up, metros |
| Unity | Y-up, 1 unidad = 1 m |
| UE5 | Z-up, 1 unidad = 1 cm (rotacion + factor 100) |
| Blender | Z-up, metros |

## Impresion 3D

`meshy_resize` a milimetros reales antes de exportar STL.

## Rigging

El esqueleto que devuelve `meshy_rig` **no** es el mannequin de UE5: el retargeting es manual. En UE5 los static meshes van a Nanite y no necesitan decimation; los skeletal meshes si necesitan LODs propios.

## Git

- `*.glb *.fbx *.blend *.stl *.3mf` por **Git LFS**.
- `meshy.json` y `thumb.png` van como archivos normales — son chicos y son lo que hace grepeable el catalogo.

## Integracion con el resto del stack

`asset-spec` define que asset hace falta -> Meshy lo genera -> `asset-audit` valida el resultado. Meshy no reemplaza a ninguno de los dos.
