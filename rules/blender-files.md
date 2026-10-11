---
paths:
  - "**/*.blend"
  - "**/*.fbx"
  - "**/*.glb"
  - "**/*.gltf"
---

# Blender Files

Como tiene que salir un asset de Blender hacia un engine o la web. Como operar Blender sin romper nada esta en `.claude/rules/blender-pipeline.md`, que se carga siempre.

## Ejes, escala y unidades

Verificar una vez por proyecto, anotarlo, no volver a pensarlo.

| Destino | Convencion | Al exportar desde Blender |
|---|---|---|
| Blender | Z-up, right-handed, 1 unidad = 1 m | — |
| glTF / GLB | Y-up, metros | El exporter convierte solo (`+Y up`) |
| Unity | Y-up, left-handed, 1 unidad = 1 m | glTF sale derecho; en FBX revisar el eje |
| UE5 | Z-up, left-handed, 1 unidad = 1 cm | Factor 100 |

Reglas duras:

- **Aplicar escala antes de exportar** (`Object → Apply → Scale`). Un objeto que sale con `scale`
  distinto de 1 arrastra el problema al engine y rompe la fisica y el skinning.
- Origen al piso para props y personajes; al centro para objetos que rotan sobre si mismos.
- Un nodo con escala `100` o `0.01` en el archivo exportado es una conversion de unidades sin
  aplicar, no una decision de diseno. Se corrige, no se documenta.

## Topologia

- **Quads en todo lo que deforma.** Tris solo en geometria estatica. N-gons en nada que deforme.
- Edge loops en articulaciones, poles de 5 aristas o menos.
- Presupuesto de triangulos declarado **antes** de modelar, no medido despues.
- Un LOD generado con Decimate es un borrador. Para heroes va retopo a mano.

## Materiales y texturas

- **Principled BSDF y nada mas** en lo que se exporta. Los nodos procedurales no sobreviven a
  glTF ni a FBX: si el look depende de ellos, hay que bakearlo a textura.
- Color space: Base Color en sRGB; Normal, Roughness, Metallic y AO en **Non-Color**. Es el bug
  mas comun y el mas silencioso.
- Normal maps: Blender, glTF y Unity usan OpenGL (+Y). **UE5 usa DirectX (-Y)**: hay que invertir
  el canal verde o marcarlo en el import.
- Resoluciones potencia de dos. Texel density consistente entre assets del mismo set.
- Cantidad de materiales = draw calls. Atlas antes de sumar materiales.

## Animacion

- **Los constraints no se exportan, los keyframes si.** Todo rig con IK, drivers o constraints se
  bakea (`nla.bake` con visual keying) antes de exportar.
- Frame rate del `.blend` igual al del engine. Un mismatch se ve como animacion lenta o acelerada,
  no como error.
- Huesos con sufijo `.L` / `.R` para que la simetria funcione.
- Root motion: hueso raiz en el origen. Decidir in-place vs root motion **antes** de animar.

## Git

- `*.blend *.fbx *.glb *.gltf` por **Git LFS**. Verificar `git lfs version` antes de agregar las
  entradas: peor que no tenerlas es tenerlas sin LFS instalado.
- `*.blend1` y `*.blend2` (backups de Blender) van al `.gitignore`, nunca al repo.
- Las texturas fuente (`.psd`, `.kra`, `.exr` de bake) por LFS; los `.png` finales tambien.

## Integracion con el resto del stack

`asset-spec` define que asset hace falta → Meshy o modelado a mano lo produce → **Blender lo
limpia y lo exporta** → `asset-audit` valida el resultado en el proyecto.

Blender es el paso del medio, no el principio ni el final. Si el asset vino de `meshy-derive`, el
`.blend` que bajo es el punto de entrada; no se regenera desde Meshy para arreglar topologia.
