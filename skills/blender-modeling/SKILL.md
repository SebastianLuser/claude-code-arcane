---
name: blender-modeling
description: "Modelado en Blender para assets de juego: presupuesto de triangulos, topologia (quads, edge loops, poles), stack de modifiers, booleans, LODs y retopo, bmesh via script. Usar para: modelar en blender, topologia, modifiers, retopo, LOD, decimate."
category: "gamedev"
argument-hint: "[asset-slug] [--budget <tris>] [--lod]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-modeling — Geometria

Modela o corrige geometria con destino a un engine. Lo que sale de aca tiene que deformar bien,
entrar en presupuesto y exportar sin sorpresas.

> Requiere `/blender-context`. Si no corrio, correrlo primero: sin destino definido el presupuesto
> de tris y los ejes son adivinanza.

---

## Phase 1: Presupuesto antes de modelar

El presupuesto se declara primero y se mide despues. Al reves no funciona: nadie borra la mitad de
un asset terminado.

| Rol del asset | Rango de tris | Nota |
|---|---|---|
| Prop de fondo, mobile | 300 - 2k | Un solo material |
| Prop interactivo | 2k - 8k | |
| Personaje mobile / VR | 8k - 20k | VR paga doble: se renderiza dos veces |
| Personaje desktop | 20k - 60k | |
| Hero / cinematica | 60k+ | Necesita LODs propios |

Si el usuario da un numero, ese manda. Si no, proponer el rango segun rol y destino y **pedir
confirmacion** — no elegir en silencio.

En UE5 los static meshes van a Nanite y el presupuesto de tris deja de importar; los **skeletal
meshes no van a Nanite** y siguen necesitando LODs. Distinguirlo antes de dar un numero.

---

## Phase 2: Diagnostico de la malla

Sobre un asset que ya existe, medir antes de opinar. Headless:

```bash
blender --background <archivo.blend> --python-expr "
import bpy
for o in bpy.data.objects:
    if o.type != 'MESH': continue
    m = o.data
    ngons = sum(1 for p in m.polygons if len(p.vertices) > 4)
    tris  = sum(len(p.vertices) - 2 for p in m.polygons)
    print(f'{o.name}: verts={len(m.vertices)} tris={tris} ngons={ngons} '
          f'uv_layers={len(m.uv_layers)} materials={len(o.material_slots)} scale={tuple(o.scale)}')
"
```

Que se mira, en este orden:

1. **Escala distinta de 1** → conversion de unidades sin aplicar. Se arregla antes que nada.
2. **N-gons en geometria que deforma** → se resuelven, no se documentan.
3. **Tris fuera de presupuesto** → decidir si se reduce o si se sube el presupuesto, con el usuario.
4. **Cero UV layers** → el asset no puede texturizarse; es trabajo de `/blender-materials`.
5. **Muchos materiales** → cada uno es un draw call.

---

## Phase 3: Topologia

Reglas que no se negocian en geometria que deforma:

- **Quads.** Tris solo en estatico, n-gons en nada.
- **Edge loops en articulaciones**: hombro, codo, rodilla, mandibula. Sin loops no hay deformacion
  posible, y eso no se arregla con weights.
- **Poles de 5 aristas o menos.** Un pole de 6+ pincha el shading.
- Densidad proporcional a la deformacion: la cara lleva mas malla que el torso.

En geometria estatica lo unico que importa es la silueta y la eficiencia. Un cubo con 12 tris esta
perfecto; subdividirlo "por prolijidad" es desperdicio.

---

## Phase 4: Modifiers

El stack es no destructivo y **el orden cambia el resultado**. Orden que funciona casi siempre:

```
Mirror → Array → Solidify → Bevel → Subdivision Surface → Triangulate (solo al exportar)
```

- **Mirror antes de Subdivision**, nunca al reves: si no, la costura queda subdividida dos veces.
- **Bevel antes de Subdivision** para bordes duros; con `Harden Normals` si el destino no tiene
  soporte de custom normals.
- **Triangulate no va en el stack de trabajo.** El exporter triangula solo; tenerlo puesto solo
  ensucia la edicion.
- No aplicar el stack "para dejarlo limpio". Se aplica cuando hace falta editar el resultado, y
  ahi se pierde la vuelta atras.

Booleans: solver `Exact` para precision, `Fast` para volumen. Los dos dejan basura — despues de un
boolean va limpieza de topologia, siempre. Un boolean sin limpiar en algo que deforma es un bug
esperando.

---

## Phase 5: LODs y reduccion

| Metodo | Cuando | Que rompe |
|---|---|---|
| Decimate `Collapse` | LOD1/LOD2 de props | Topologia; no sirve para deformar |
| Decimate `Planar` | Geometria dura, superficies planas | Detalle en curvas |
| Retopo a mano | Heroes, cualquier cosa que deforme | Nada, cuesta tiempo |
| Remesh (o `meshy_remesh`) | Escaneos y salidas de IA con topologia inservible | UVs, hay que rehacerlas |

Cadena tipica de LODs: 100% → 50% → 25%. Verificar la silueta a distancia de juego, no en el
viewport de cerca.

**Un Decimate no es un LOD terminado**, es un borrador. Para heroes se dice explicitamente que
hace falta retopo y no se entrega como final.

---

## Phase 6: Scripting con bmesh

Para ediciones programaticas, `bmesh` sobre `bpy.ops`:

- `bpy.ops.*` depende del contexto (modo, seleccion, area activa) y en `--background` falla o hace
  otra cosa.
- `bmesh.from_edit_mesh(me)` / `bmesh.new()` + `bm.to_mesh(me)` es determinista.
- **Nunca `bpy.ops` dentro de un loop**: cada llamada revalida la escena entera y el costo es
  cuadratico.

Todo script que borra datos (`bpy.data.meshes.remove`, `objects.remove`) se le muestra al usuario
antes de correrlo. Sin excepcion.

Los scripts se versionan en el repo. **Pedir aprobacion antes de escribir** cualquier `.py` nuevo o
de modificar uno existente, mostrando que va a hacer.

---

## Phase 7: Resumen

Reportar por objeto: verts, tris, n-gons, materiales, escala, y tris contra el presupuesto.

**Verdict:**
- **PASS** — dentro de presupuesto, sin n-gons donde importa, escala aplicada.
- **CONCERNS** — entra pero con deuda: n-gons en estatico, materiales de sobra, LOD por Decimate
  en algo que deforma. Listar cada punto.
- **FAIL** — fuera de presupuesto, n-gons en geometria que deforma, o escala sin aplicar.
  Indicar el fix por objeto.

## Next Steps

- `/blender-materials` para UVs, shader nodes y bake
- `/blender-animation` si el asset lleva rig
- `/blender-export` cuando la geometria esta cerrada
- `/asset-audit` para validar el resultado ya integrado en el proyecto

---

> → Topologia, presupuestos, ejes y las reglas de scripts destructivos estan en
> `.claude/rules/blender-pipeline.md`.
