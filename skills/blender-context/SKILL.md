---
name: blender-context
description: "Foundation de Blender: version instalada, MCP recomendado (comunidad vs oficial), modo headless, unidades y ejes, estructura de assets. Los demas blender-* dependen de este. Usar para: setup blender, contexto blender, mcp blender, blender headless."
category: "gamedev"
argument-hint: "[--verify]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# blender-context — Foundation

Deja claro con que Blender se esta trabajando y como se lo va a manejar, **antes** de tocar
geometria. Todos los demas skills `blender-*` asumen que esto ya corrio.

`--verify` salta la Phase 3 y solo reporta el estado actual.

---

## Phase 1: Detectar Blender

```bash
blender --version
```

Si `blender` no esta en el PATH, buscar la instalacion antes de darla por perdida:

| Plataforma | Ruta tipica |
|---|---|
| Windows | `C:\Program Files\Blender Foundation\Blender <ver>\blender.exe` |
| macOS | `/Applications/Blender.app/Contents/MacOS/Blender` |
| Linux | `/usr/bin/blender`, o el AppImage donde lo dejo el usuario |

Anotar la version mayor: define que features existen y que MCP sirve. Si hay varias instalaciones,
preguntar cual es la del proyecto — no elegir la mas nueva por default.

**Si no hay Blender**, reportar BLOCKED y parar. Ningun otro `blender-*` puede correr sin binario.

---

## Phase 2: Estructura del proyecto

Buscar `.blend` en el arbol (excluir `*.blend1` y `*.blend2`, que son backups):

- **Si hay**: listar donde estan y confirmar cual es el archivo de trabajo.
- **Si no hay**: preguntar si se arranca de cero o si los fuentes viven afuera del repo.

La convencion que asume el resto del perfil:

```
assets/3d/<asset-slug>/
├── source.blend        # el archivo de trabajo, por LFS
├── textures/           # fuentes de textura
└── export/             # lo que consume el engine (glb/fbx), por LFS
```

Si el proyecto ya usa `meshy-setup`, esta estructura ya existe y el `.blend` de `meshy-derive`
entra como `source.blend`. **No crear una estructura paralela.**

Verificar `.gitignore` y `.gitattributes`: `*.blend1` ignorado, binarios por LFS. Mostrar el diff
y pedir aprobacion antes de escribir.

---

## Phase 3: Elegir como operar Blender

### Headless — el default

```bash
blender --background <archivo.blend> --python <script.py>
```

Reproducible, versionable, corre en CI, no necesita ventana abierta. **Es el camino por default
para cualquier paso automatizable.** Los scripts van a `assets/3d/_scripts/` o al lado del skill
que los usa, nunca inline en el chat.

### MCP — para explorar e iterar

Dos opciones. **Ninguna se instala desde este repo**: el addon vive en la instalacion de Blender
del usuario, y la decision es suya.

| | Comunidad (`ahujasid/blender-mcp`) | Oficial (Blender Lab) |
|---|---|---|
| Estado | Estandar de facto, MIT, mantenido | v1.0.0, **experimental, sin roadmap de release** |
| Blender | 3.0+ | 5.x (el addon viene con el engine en las versiones nuevas) |
| Para que sirve | Autoria: crear y modificar objetos, materiales, correr Python | Inspeccion: interfaz en lenguaje natural a la Python API, entender escenas |
| Extras | Poly Haven (assets, texturas, HDRIs), Sketchfab, Hyper3D | Ninguno, es deliberadamente minimo |
| Repo | `github.com/ahujasid/blender-mcp` | `projects.blender.org/lab/blender_mcp` |

Recomendacion: **el de la comunidad** si el trabajo es producir assets; el oficial si lo que se
quiere es entender o debuggear una escena ajena.

> Los dos ejecutan el Python generado por el LLM **sin sandbox**. Antes de la primera operacion:
> commit limpio en el repo y `.blend` guardado. Las reglas completas estan en
> `.claude/rules/blender-pipeline.md`.

Si el usuario quiere el MCP, darle el comando y **no correrlo sin aprobacion**:

```bash
claude mcp add blender -- uvx blender-mcp
```

Necesita `uv` (`winget install astral-sh.uv`) y el addon: `uvx blender-mcp install-addon`, despues
habilitarlo en las preferencias de Blender. En el viewport se conecta desde el panel `N` →
pestana BlenderMCP.

---

## Phase 4: Unidades y ejes

Confirmar con el usuario el destino del asset y anotarlo. La tabla completa esta en la rule; lo
que hay que fijar ahora es una sola linea: **destino, eje up, y factor de escala**.

Si el destino es Unity o UE5 y el proyecto tiene un `blender-context` previo con otro destino,
avisar del cambio en lugar de sobrescribirlo en silencio.

---

## Phase 5: Resumen

Reportar:
- Version de Blender y ruta del binario.
- Archivos `.blend` encontrados y cual es el de trabajo.
- Modo de operacion elegido (headless siempre disponible; MCP si esta conectado y cual).
- Destino, eje up y escala.
- Que se creo o modifico en el repo (`.gitignore`, `.gitattributes`, estructura de carpetas).

**Verdict:**
- **READY** — Blender detectado, estructura en su lugar, destino definido. Los demas `blender-*`
  pueden correr.
- **PENDING** — todo definido pero el MCP no conecta. Aclarar que el camino headless **si** esta
  disponible y que solo falta la parte interactiva.
- **BLOCKED** — no hay binario de Blender, o el destino del asset no se pudo definir. Indicar el
  fix concreto.

## Next Steps

- `/blender-modeling` para topologia, modifiers y presupuesto de tris
- `/blender-materials` para shader nodes, UVs y bake
- `/blender-animation` para rigging, keyframes y retargeting
- `/blender-export` cuando el asset esta listo para el engine
- Si el asset viene de Meshy, `/meshy-derive` primero para bajar el `.blend`

---

> → Las reglas de ejes, escala, topologia, color space y Git estan en
> `.claude/rules/blender-pipeline.md`. Leerlas antes de la primera operacion.
