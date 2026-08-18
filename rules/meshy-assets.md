# Meshy Assets

Reglas para produccion de assets 3D con Meshy. Aplican a cualquier operacion que toque `assets/3d/`.

## Creditos — cada llamada cuesta plata real

| Operacion | Creditos |
|---|---|
| `meshy_analyze_printability` | **0** |
| `meshy_check_balance`, `meshy_get_task_status`, `meshy_list_tasks`, `meshy_download_model` | **0** |
| `meshy_convert`, `meshy_resize` | 1 |
| `meshy_animate` | 3 |
| `meshy_text_to_image` | 3-9 |
| `meshy_image_to_image` | 3-12 |
| `meshy_remesh`, `meshy_rig`, `meshy_uv_unwrap` | 5 |
| `meshy_retexture`, `meshy_repair_printability` | 10 |
| `meshy_text_to_3d`, `meshy_image_to_3d`, `meshy_multi_image_to_3d` | 20-30 |
| Print white model | 20 |
| `meshy_creative_lab` | 36 |
| Print multicolor | 40 |

### Reglas duras

1. **Nunca generar sin confirmacion explicita.** Preguntar siempre, incluso si el pedido parece obvio. Informar el costo estimado **antes** de la llamada.
2. **Preview primero.** `meshy_text_to_3d_refine` solo con el preview aprobado por el usuario.
3. **Nunca en batch.** Un asset por vez, con confirmacion por asset.
4. **Chequear el ledger antes de generar.** Grepear `assets/3d/*/meshy.json` buscando un prompt equivalente. Si existe, avisar y **no** generar.
5. **Las operaciones de 0 creditos no necesitan confirmacion.** `analyze_printability`, `check_balance`, `get_task_status`, `list_tasks`, `download_model` corren libres.

Ante cualquier duda sobre si una operacion gasta, correr `meshy_check_balance` antes y despues y reportar el delta real.

## Master unico, derivados baratos

El GLB refined es la fuente de verdad y es **inmutable**. Ningun target se genera desde el prompt: todos salen del master.

| Target | Como | Creditos |
|---|---|---|
| Unity y UE5 | `meshy_convert` -> `fbx` (un solo archivo sirve para los dos) | 1 |
| Blender | `meshy_convert` -> `blend` | 1 |
| Impresion | `meshy_convert` -> `stl` (`3mf` si es multicolor) | 1 |
| Web / three.js | `npx gltf-transform optimize --simplify` | **0** |

- Nunca usar `remesh` (5) cuando `convert` (1) alcanza. `remesh` es para cambiar topologia de verdad, no para cambiar de formato.
- Nunca usar `remesh` para LODs de web: `gltf-transform` hace decimation, meshopt y KTX2 en local y gratis.

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

Correr `meshy_analyze_printability` (gratis) **siempre** antes de `meshy_repair_printability` (10). `meshy_resize` a milimetros reales antes de exportar STL. Las operaciones de print (20 white / 40 multicolor) son las mas caras del catalogo: doble confirmacion.

## Rigging

`meshy_rig` es solo humanoides. El esqueleto que devuelve **no** es el mannequin de UE5: el retargeting es manual. En UE5 los static meshes van a Nanite y no necesitan decimation; los skeletal meshes si necesitan LODs propios.

## Git y secretos

- `*.glb *.fbx *.blend *.stl *.3mf` por **Git LFS**.
- `meshy.json` y `thumb.png` van como archivos normales — son chicos y son lo que hace grepeable el catalogo.
- `MESHY_API_KEY` (formato `msy_...`) va en `.env`, **nunca** en el repo ni en un SKILL.md.

## Integracion con el resto del stack

`asset-spec` define que asset hace falta -> Meshy lo genera -> `asset-audit` valida el resultado. Meshy no reemplaza a ninguno de los dos.

Si existe un art bible en el proyecto, el prompt de generacion se deriva de ahi, no se inventa.
