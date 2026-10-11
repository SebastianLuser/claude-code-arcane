# Meshy Assets

Reglas que tienen que estar presentes antes de cualquier llamada a Meshy, aunque no se toque ningun archivo: cada llamada gasta creditos. Estructura en disco, ledger, ejes, rigging y Git estan en `.claude/rules/meshy-files.md`, que se carga al tocar `assets/3d/`.

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

## Antes de gastar

- Ningun target se genera desde el prompt: todos salen del master con `meshy_convert` (1).
- Nunca usar `remesh` (5) cuando `convert` (1) alcanza, ni para LODs de web: `gltf-transform` los hace gratis.
- `meshy_rig` (5) es solo para humanoides: con otro modelo se gastan los creditos y no sirve.
- Si existe un art bible en el proyecto, el prompt de generacion se deriva de ahi, no se inventa.
- `meshy_analyze_printability` (gratis) **siempre** antes de `meshy_repair_printability` (10). Print (20 white / 40 multicolor): doble confirmacion.

## Secretos

`MESHY_API_KEY` (formato `msy_...`) va en `.env`, **nunca** en el repo ni en un SKILL.md.
