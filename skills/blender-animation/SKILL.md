---
name: blender-animation
description: "Rigging y animacion en Blender para engines: armature y naming de huesos, weights, constraints e IK que hay que bakear, FCurves, acciones y NLA como clips, root motion, retargeting de Mixamo, shape keys. Usar para: animar en blender, rig, armature, retarget mixamo, root motion, shape keys."
category: "gamedev"
argument-hint: "[asset-slug] [--retarget <fbx>] [--bake]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-animation — Rig y animacion

Rig y animacion con destino a un engine. La regla que ordena todo el skill: **el engine recibe
keyframes, no rig.** Todo lo inteligente del rig existe para producir esos keyframes y despues
desaparece.

> Requiere `/blender-context`. Con geometria sin cerrar no vale la pena riggear: cada cambio de
> topologia invalida los weights.

---

## Phase 1: Que se exporta y que no

| En Blender | Al engine | Que hacer |
|---|---|---|
| Keyframes en huesos | **Se exportan** | Es el camino |
| Armature + weights | Se exporta | |
| Shape keys / morph targets | Se exportan | Verificar el limite del engine |
| **Constraints** (IK, Copy Rotation, Limit) | **No se exportan** | **Bakear** |
| Drivers | No se exportan | Bakear |
| Bone constraints de rig helper | No | Bakear y excluir los huesos helper |
| Modifiers animados | No | Bakear a shape keys o a keyframes |

Un rig con IK que se exporta sin bakear llega al engine con el personaje en rest pose y **sin
error visible**. Es el fallo mas comun y el mas confuso de diagnosticar.

---

## Phase 2: Armature

- Un solo armature por personaje, con el objeto en el origen y escala 1.
- **Naming con sufijo `.L` / `.R`** (`upper_arm.L`). Sin eso, mirror de poses y de weights no
  funciona, y las herramientas de simetria tampoco.
- Jerarquia con raiz unica. Si el destino es UE5 y se quiere reusar animacion del mannequin, seguir
  su nomenclatura desde el principio: renombrar despues es peor.
- **Bone roll** consistente: ejes de rotacion coherentes entre huesos simetricos, o las curvas de
  animacion se vuelven ilegibles.
- Huesos helper y de control marcados de forma reconocible (prefijo, o su propia collection) para
  poder excluirlos del export.

Diagnostico:

```bash
blender --background <archivo.blend> --python-expr "
import bpy
for o in bpy.data.objects:
    if o.type == 'ARMATURE':
        bones = o.data.bones
        print(f'{o.name}: bones={len(bones)} scale={tuple(o.scale)}')
        print('  sin sufijo L/R:', [b.name for b in bones if not b.name.endswith(('.L','.R'))][:10])
for a in bpy.data.actions:
    print(f'action {a.name}: frames={tuple(a.frame_range)} fcurves={len(a.fcurves)}')
"
```

---

## Phase 3: Weights

- Empezar con `Automatic Weights` y corregir a mano; no al reves.
- **Maximo 4 influencias por vertice.** Es el limite practico de la mayoria de los engines: si hay
  mas, el engine descarta las sobrantes y la deformacion cambia respecto de Blender.
- Normalizar todo antes de exportar.
- Un vertice con weight 0 en todos los huesos se queda en el origen. Se ve como un pico saliendo
  del personaje.

---

## Phase 4: Acciones, FCurves y NLA

- **Una accion = un clip** en el engine. Nombrarlas como se van a llamar alla (`Idle`, `Run`,
  `Attack_01`), no `Action.003`.
- Interpolacion: `Bezier` para movimiento organico, `Linear` para mecanico, `Constant` para
  stop-motion. La curva es parte de la animacion, no un detalle tecnico.
- Ciclos con `Cycles` F-Modifier para trabajar, pero **al exportar hay que tener frames reales**:
  el modifier no viaja.
- NLA sirve para organizar y para bakear combinaciones. El engine recibe las acciones, no la
  estructura del NLA.
- **Frame rate del `.blend` igual al del engine.** Un mismatch se ve como animacion lenta o
  acelerada y se confunde con un problema de blending.
- Loops: el ultimo frame no repite el primero. Si repite, el loop tiene un hitch de un frame.

---

## Phase 5: Root motion

Decidir **antes** de animar, porque cambia como se anima:

| | In-place | Root motion |
|---|---|---|
| Hueso raiz | Quieto en el origen | Se mueve con el personaje |
| Quien mueve al personaje | El codigo | La animacion |
| Cuando | Locomocion con control responsivo | Ataques, finishers, cinematicas |

Mezclar los dos en el mismo set sin decirlo produce deslizamiento de pies que despues se intenta
arreglar con IK en runtime. Anotar la decision por clip.

---

## Phase 6: Bake antes de exportar

```bash
blender --background <archivo.blend> --python <script_de_bake.py>
```

El script tiene que, en este orden:

1. Seleccionar el armature y entrar en Pose Mode.
2. Bakear con **visual keying** (respeta constraints e IK) sobre el rango real de la accion.
3. Sacar o deshabilitar los constraints ya horneados.
4. Dejar solo los huesos de deformacion en el export; los de control quedan afuera.
5. Guardar en un `.blend` aparte o en una accion nueva — **no sobrescribir el rig de trabajo.**

Ese ultimo punto no es opcional: un bake sobre el rig original destruye la posibilidad de volver a
animar. **Pedir aprobacion antes de escribir** el script de bake y antes de generar el `.blend` de
salida, diciendo explicitamente que archivo se crea y cual no se toca.

---

## Phase 7: Retargeting de Mixamo

Cuando la animacion viene de Mixamo:

1. **Escala**: Mixamo exporta en centimetros. Aplicar factor 0.01 o el import queda 100x.
2. **Pose de referencia**: Mixamo es T-pose. Si el rig destino es A-pose, alinear la rest pose
   antes de mapear o los hombros salen rotos.
3. **Mapeo de huesos**: `mixamorig:Hips` → la raiz del rig, y de ahi hacia abajo. Los nombres de
   Mixamo son estables, asi que el mapeo se escribe una vez y se reusa.
4. Bakear el resultado (Phase 6) y **borrar los huesos de Mixamo** que no correspondan al rig.
5. Verificar contacto de pies con el piso, que es lo primero que se rompe.

Si el proyecto usa el toolkit de Mixamo de otra herramienta, respetarlo en lugar de escribir un
mapeo paralelo.

---

## Phase 8: Resumen

Reportar: huesos totales y cuantos sin sufijo L/R, acciones con nombre y rango, frame rate,
influencias maximas por vertice, que se bakeo, y decision de root motion por clip.

**Verdict:**
- **PASS** — keyframes bakeados, naming consistente, frame rate igual al del engine, weights
  normalizados con 4 influencias o menos.
- **CONCERNS** — exportable con deuda: huesos sin sufijo, acciones con nombre autogenerado, root
  motion sin decidir. Listar cada punto.
- **FAIL** — constraints o IK sin bakear, frame rate distinto al del engine, o weights sin
  normalizar. Indicar el fix.

## Next Steps

- `/blender-export` para sacar el skeletal mesh y los clips
- `/adaptive-music` o `/sfx-design` si la animacion necesita audio sincronizado
- `/asset-audit` para validar el resultado integrado
- En UE5, `/ue-animation-system` para el lado del engine

---

> → Bake de constraints, frame rate y ejes estan en `.claude/rules/blender-pipeline.md`.
