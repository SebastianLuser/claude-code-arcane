---
name: blender-export
description: "Exporta desde Blender al engine y valida el resultado: eleccion de formato (glTF/GLB, FBX, .blend), settings que importan, export headless reproducible y validacion automatica de tris, UVs, escala, texturas y clips con validate_gltf.py. Usar para: exportar de blender, glb, fbx, validar export, blender a unity, blender a ue5."
category: "gamedev"
argument-hint: "[asset-slug] [--target unity|ue5|web] [--budget-tris <n>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-export — Salida al engine

Saca el asset de Blender y **verifica que lo que salio es lo que se esperaba**. Este skill cierra
el pipeline: `asset-spec` → Meshy o modelado → Blender → **export validado** → `asset-audit`.

> Requiere `/blender-context` (destino y escala definidos). Si el asset tiene rig, requiere el bake
> de `/blender-animation` hecho: los constraints no viajan.

---

## Phase 1: Elegir formato

| Formato | Cuando | Cuidado |
|---|---|---|
| **glTF 2.0 (`.glb`)** | Default para Unity URP, web, y cualquier cosa moderna | Un solo archivo, texturas embebidas, Y-up automatico |
| **FBX** | Pipelines de UE5 y Unity legacy, skeletal meshes | Hay que fijar ejes y escala a mano, formato cerrado |
| **`.blend` directo** | Prototipo rapido en Unity | Unity necesita Blender instalado para importarlo. **No usar en CI ni en un repo de equipo** |
| **USD** | Pipelines de VFX / interop DCC | Soporte irregular en engines de juego |

Regla practica: **glTF salvo que el destino lo impida.** FBX es la excepcion, no el default, y
existe casi siempre por el lado del engine, no por el de Blender.

---

## Phase 2: Settings que importan

### glTF / GLB

| Setting | Valor | Por que |
|---|---|---|
| Format | `glTF Binary (.glb)` | Un archivo, texturas adentro |
| Include | `Selected Objects` | Un export por asset, no la escena entera |
| `+Y Up` | On | Es la convencion de glTF y de Unity |
| Apply Modifiers | On | Lo que no se aplica no existe en el archivo |
| Materials | `Export` | |
| Images | `Automatic` | |
| Compression (Draco) | Off al exportar | Se comprime despues, como paso propio |
| Animation → Sampling | On, y **una accion por clip** | |

### FBX

| Setting | Valor | Por que |
|---|---|---|
| Scale | `1.0` con `Apply Unit` | El engine hace el resto |
| Forward / Up | Segun el engine destino | UE5: `-Z Forward`, `Y Up` |
| Apply Scalings | `FBX All` | Evita escalas dobles |
| Bake Animation | On, con `NLA Strips` off si se exporta una sola accion | |
| Add Leaf Bones | **Off** | Ensucia el esqueleto en el engine |

Lo que **nunca** se exporta: huesos de control, objetos de referencia, camaras y luces de trabajo,
collections de scratch. Si estan en el archivo, van a aparecer en el engine.

---

## Phase 3: Export headless

Reproducible y versionable, a diferencia de exportar a mano desde la UI:

```bash
blender --background <archivo.blend> --python <export_script.py> -- \
    --out assets/3d/<slug>/export/<slug>.glb
```

El script hace: seleccionar los objetos que corresponden, limpiar la seleccion de lo que no va, y
llamar a `bpy.ops.export_scene.gltf(...)` con los settings de la Phase 2 explicitos — **ninguno
por default**, porque los defaults del operador cambian entre versiones de Blender.

El script vive en el repo (`assets/3d/_scripts/` o al lado del asset), no en el chat. Un export que
solo existe como pasos manuales se hace distinto cada vez.

**Pedir aprobacion antes de escribir** el script y antes del primer export a una ruta que ya tiene
un archivo: un `.glb` sobrescrito no se recupera si el `.blend` cambio.

---

## Phase 4: Validar el resultado

Nunca dar un export por bueno sin medirlo. El validador es stdlib puro, no instala nada:

```bash
python scripts/validate_gltf.py assets/3d/<slug>/export/<slug>.glb \
    --budget-tris 8000 --max-materials 2 --require-uv1 --target unity
```

| Flag | Para que |
|---|---|
| `--budget-tris <n>` | Presupuesto declarado en `/blender-modeling` |
| `--max-materials <n>` | Tope de draw calls |
| `--require-uv1` | Exigir lightmap UV cuando el asset recibe luz bakeada |
| `--target unity\|ue5\|web` | Avisos propios del destino (normal maps DirectX en UE5, compresion en web) |
| `--json` | Salida parseable, para encadenarlo en CI |

Que chequea, y por que cada uno esta:

1. **Contenedor** — magic y chunks del GLB. Un archivo truncado se detecta aca, no en el engine.
2. **Presupuesto de tris** — contando indices reales por primitiva, no estimando.
3. **UV0 / UV1** — sin UV0 no hay textura; sin UV1 el lightmap sale manchado.
4. **Escala** — nodos con escala 100 o 0.01 son conversion de unidades sin aplicar.
5. **Materiales** — cantidad contra el tope, mas nombres autogenerados (`Material.001`) que en el
   engine son imposibles de rastrear.
6. **Texturas** — imagenes referenciadas fuera de un `.glb` (llegan roto al engine) y resoluciones
   que no son potencia de dos.
7. **Clips** — cantidad y nombres; un clip sin nombre entra al engine como `Animation_0`.

Exit code 0 si el verdict es PASS o CONCERNS, 1 si es FAIL. Eso lo hace usable como gate.

> El validador lee glTF/GLB, **no FBX**. FBX binario no se puede inspeccionar sin dependencias, y
> este repo no las agrega. Si el destino es FBX, exportar **tambien** un `.glb` de control y
> validar ese: la geometria y los materiales son los mismos.

---

## Phase 5: Resumen

Reportar: formato y ruta de salida, settings usados, y la tabla completa del validador con su
verdict.

**Verdict:**
- **PASS** — el validador da PASS y el asset esta listo para integrar.
- **CONCERNS** — exportado con avisos (no potencia de dos, clips sin nombre, avisos del target).
  Listar cada uno y decir si se acepta o se corrige.
- **FAIL** — presupuesto excedido, sin UVs, escala sin aplicar, texturas externas en un `.glb`, o
  contenedor invalido. **No integrar**: indicar el fix y volver al skill que corresponde
  (`/blender-modeling`, `/blender-materials`, `/blender-animation`).

## Next Steps

- `/asset-audit` para validar naming, formatos y huerfanos ya dentro del proyecto
- `/meshy-derive` si hacen falta mas targets del mismo master (web, print)
- En UE5, `/ue-animation-system` o `/ue-materials-rendering` para el lado del engine
- Si el verdict fue FAIL, volver al skill del area que fallo — no parchear el archivo exportado

---

> → Formatos, ejes, escala y reglas de Git LFS estan en `.claude/rules/blender-pipeline.md`.
