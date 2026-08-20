---
name: blender-materials
description: "Materiales y texturas en Blender para assets de juego: Principled BSDF, UVs y lightmap UV1, bake de procedurales a textura, color space, normal maps OpenGL vs DirectX, atlas y draw calls. Usar para: materiales blender, texturas, UV unwrap, bake, shader nodes, normal map."
category: "gamedev"
argument-hint: "[asset-slug] [--bake] [--target unity|ue5|web]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-materials — Materiales y texturas

Deja el asset con materiales que **sobreviven al export**. La mitad de los bugs de look en el
engine se originan aca, y casi todos son color space o convencion de normal map.

> Requiere `/blender-context`. El destino (Unity / UE5 / web) cambia decisiones concretas de este
> skill, no es un detalle.

---

## Phase 1: Que sobrevive al export

| En Blender | glTF / FBX | Que hacer |
|---|---|---|
| Principled BSDF con texturas | **Sobrevive** | Es el camino |
| Principled BSDF con valores planos | Sobrevive | Ok para assets sin textura |
| Nodos procedurales (Noise, Voronoi, Musgrave) | **No sobrevive** | Bakear a textura |
| Node groups custom | No sobrevive | Bakear |
| Shader mixes, Geometry / Object Info | No sobrevive | Bakear |
| Emission | Sobrevive (canal propio) | |
| Displacement real | No sobrevive | Bakear a normal, o meterlo en la malla |

Regla practica: **si no es Principled BSDF alimentado por Image Textures, no existe fuera de
Blender.** Antes de pulir un shader procedural, decidir si se bakea; si no se bakea, es tiempo
tirado.

---

## Phase 2: UVs

Diagnostico headless:

```bash
blender --background <archivo.blend> --python-expr "
import bpy
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    uvs = [l.name for l in o.data.uv_layers]
    print(f'{o.name}: uv_layers={uvs or \"NINGUNA\"} materials={len(o.material_slots)}')
"
```

- **Sin UVs no hay texturas.** Es lo primero que se resuelve.
- **UV0**: el mapa de texturas. Puede solaparse si la textura es tileable; **no puede solaparse si
  se va a bakear**.
- **UV1**: lightmaps. Unity y UE5 lo esperan **sin solapamiento y con margen** entre islas. Si el
  asset va a recibir luz bakeada y no tiene UV1, el lightmap sale con manchas y nadie sabe por que.
- Texel density consistente dentro de un mismo set de assets. Un prop con el doble de densidad que
  el de al lado se nota mas que un prop con menos poligonos.
- Margen entre islas proporcional a la resolucion: 2px a 1K, 4px a 2K. Menos margen = bleeding.

---

## Phase 3: Color space — el bug silencioso

Esto no es preferencia, es correcto o incorrecto:

| Textura | Color space |
|---|---|
| Base Color / Albedo / Emission | **sRGB** |
| Normal | **Non-Color** |
| Roughness / Metallic / AO / Displacement / Mask | **Non-Color** |

Un Roughness en sRGB se ve *casi* bien en Blender y **mal** en el engine, con un error que no
parece de textura. Verificar antes de exportar:

```bash
blender --background <archivo.blend> --python-expr "
import bpy
for img in bpy.data.images:
    print(f'{img.name}: colorspace={img.colorspace_settings.name} size={tuple(img.size)}')
"
```

Y de paso: resoluciones potencia de dos. Una textura de 1000x1000 no se comprime igual que una de
1024x1024 y en mobile la diferencia es real.

---

## Phase 4: Normal maps

| Destino | Convencion | Canal verde |
|---|---|---|
| Blender | OpenGL (+Y) | Como sale |
| glTF / GLB | OpenGL (+Y) | Como sale |
| Unity | OpenGL (+Y) | Como sale |
| **UE5** | **DirectX (-Y)** | **Invertido** |

Si el destino es UE5, hay dos salidas: invertir el canal verde en la textura, o marcarlo en el
import del engine. **Elegir una y anotarla** — el sintoma de tenerlo mal es iluminacion que parece
venir del lado opuesto, y se diagnostica tarde.

El nodo Normal Map en Blender necesita el Image Texture en Non-Color y su propio `Strength`. Un
Strength distinto de 1 no se exporta como tal: se hornea o se pierde.

---

## Phase 5: Bake

Cuando hay procedurales que hay que conservar:

1. **UV0 sin solapamiento** (requisito, no sugerencia).
2. Crear la Image Texture destino con la resolucion final.
3. Bake en Cycles (EEVEE no bakea todo). Tipos utiles: `Diffuse` sin luces para albedo,
   `Normal`, `Roughness`, `AO`, `Combined` solo si se quiere luz pegada a la textura.
4. **Margen** de bake para evitar costuras.
5. Si se bakea de high-poly a low-poly: `Selected to Active` con **cage** y `Extrusion` ajustada.
   Sin cage, los bordes salen sucios.
6. Guardar la imagen a disco. Una imagen bakeada que quedo solo en memoria se pierde al cerrar y
   no avisa.

Despues del bake, reemplazar los procedurales por las Image Textures y **verificar que el look no
cambio**. Si cambio, el bake esta mal, no el shader.

Un bake escribe imagenes al repo y puede pisar texturas existentes. **Pedir aprobacion antes de
escribir**, listando los archivos destino, y nunca sobrescribir una textura fuente sin confirmarlo.

---

## Phase 6: Materiales y draw calls

Cantidad de materiales = cantidad de draw calls por objeto. Antes de sumar un material:

- ¿Se puede resolver con una mascara en la misma textura?
- ¿Se puede atlasear con los assets del mismo set?

Un prop con 6 materiales y uno con 1 material atlaseado se ven igual y cuestan distinto. En mobile
y VR la diferencia es la que decide si el frame entra.

Nombrar los materiales igual que el asset (`M_<asset>_<parte>`); un `Material.001` que llega al
engine es imposible de rastrear despues.

---

## Phase 7: Resumen

Reportar por objeto: UV layers, materiales con nombre, texturas con su color space y resolucion,
que se bakeo, y convencion de normal map elegida.

**Verdict:**
- **PASS** — UVs presentes, color space correcto, sin procedurales sin bakear, potencias de dos.
- **CONCERNS** — funciona pero con deuda: falta UV1 y el asset recibe luz bakeada, materiales de
  sobra, texturas no potencia de dos. Listar cada punto.
- **FAIL** — sin UVs, color space invertido, procedurales sin bakear que el look necesita, o
  normal map con la convencion equivocada para el destino. Indicar el fix.

## Next Steps

- `/blender-animation` si el asset lleva rig
- `/blender-export` cuando materiales y UVs estan cerrados
- `/asset-audit` para validar naming y formatos ya integrado
- `/shader-dev` si el look necesita un shader propio en el engine, no una textura

---

> → Color space, convenciones de normal map y presupuesto de materiales estan en
> `.claude/rules/blender-pipeline.md`.
