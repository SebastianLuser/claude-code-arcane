# Blender Pipeline

Reglas para trabajar assets en Blender con destino a un engine o a la web. Aplican a cualquier
operacion que toque un `.blend` o exporte desde uno.

## El MCP es opcional, el headless no

Hay dos formas de operar Blender desde Claude, y no son equivalentes:

| | MCP | Headless (`--background`) |
|---|---|---|
| Necesita Blender abierto | Si, con el addon conectado | No |
| Reproducible en CI | No | Si |
| Ve el estado de la escena | Si | Solo lo que el script consulta |
| Deja rastro en el repo | No | Si — el script queda versionado |

**Default: headless.** Un `.py` versionado que corre con `blender --background --python` es
auditable, repetible y no depende de que alguien tenga la ventana abierta. El MCP sirve para
explorar una escena que ya existe y para iterar visualmente, no para el paso automatizable.

Los dos MCP recomendados estan en `/blender-context`. **Ninguno de los dos se instala desde este
repo**: son addons de la instalacion de Blender del usuario.

## Ejecuta Python sin sandbox

Tanto el MCP de la comunidad como el oficial corren el Python que genera el LLM **sin ninguna
barrera**. Consecuencias que no son negociables:

1. **Nunca correrlo con cambios sin commitear** en el repo del proyecto. Si algo se rompe, la
   unica marcha atras es git.
2. Guardar el `.blend` antes de la primera operacion de la sesion.
3. No apuntarlo a una maquina con material sensible ni a credenciales.
4. Un script que borra (`bpy.data.*.remove`, `object.delete`) se muestra al usuario **antes** de
   correrlo, siempre, incluso si lo pidio.

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
