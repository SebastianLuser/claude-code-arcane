---
name: install-mcp
description: "Conecta Claude Code con el MCP del engine: Unity (package UPM CoplayDev) o Unreal (plugins del engine). Detecta, registra y verifica. Usar para: mcp unity, mcp unreal, setup MCP del editor."
category: "gamedev"
argument-hint: "[unity | unreal] [--secondary] [project-path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# install-mcp — Engine MCP Setup

Conecta Claude Code con el editor del engine via MCP. Los dos engines difieren en algo importante:

| | Unity | Unreal |
|---|---|---|
| **De donde viene el MCP** | Package de terceros (CoplayDev) | **Plugins propios del engine** (`ModelContextProtocol` + `AllToolsets`) |
| **Se suma algo al proyecto** | Si — package UPM en `Packages/manifest.json` | **No** — ya viene con el engine, solo se habilita |
| **Que hace este skill** | Instalar + registrar + verificar | Habilitar + conectar + verificar |

> En Unreal **no hay nada que instalar**. El server y los toolsets son plugins del engine; el trabajo es habilitarlos en el `.uproject`, prender auto-start y generar el `.mcp.json`. No agregues packages ni plugins de terceros.

## Input

- `unity` | `unreal` (opcional): fuerza el engine. Sin argumento, se autodetecta.
- `project-path` (opcional): raiz del proyecto. Default: directorio actual.
- `--secondary` (opcional, **solo Unity**): ademas del primario, instala el package CoderGamester.

---

## Phase 1: Detectar el engine

Desde `project-path` (o cwd), buscar marcadores:

| Marcador | Engine |
|---|---|
| `Packages/manifest.json` + `ProjectSettings/ProjectVersion.txt` | Unity |
| `*.uproject` (o `GenerateProjectFiles.*` en un source tree) | Unreal |

- Si el argumento explicito contradice los marcadores, **avisar y preguntar** antes de seguir.
- Si no hay marcadores, **abortar**: "No parece un proyecto Unity ni Unreal. Pasa la ruta con `/install-mcp [unity|unreal] <project-path>`."
- Si aparecen ambos, preguntar cual.

Confirmar el engine detectado y la ruta antes de tocar archivos.

---

## Phase 2A: Unity — instalar y registrar

### 1. Verificar prerrequisitos

`uv --version` y `uvx --version` (server del primario). Si falta `uv`, **no abortar**: avisar, dar el comando y seguir editando el manifest.

- Windows: `winget install astral-sh.uv`
- alternativa: `pipx install uv`

Solo con `--secondary`: `node --version`. Si falta, avisar (el server CoderGamester no podra correr).

### 2. Agregar el package UPM

Leer `Packages/manifest.json`. Dentro de `"dependencies"`, agregar **solo si la key no existe** (idempotente — nunca duplicar):

```json
"com.coplaydev.unity-mcp": "https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main"
```

Con `--secondary`, agregar tambien:

```json
"com.gamelovers.mcp-unity": "https://github.com/CoderGamester/mcp-unity.git"
```

Usar `Edit` puntual sobre el bloque `dependencies` preservando el JSON valido (indentacion, comas). Si la key ya estaba, reportar "ya presente, sin cambios".

> **Antes de escribir**, mostrar el diff propuesto sobre `manifest.json` (y el `.mcp.json` del paso 3B si aplica) y pedir aprobacion al usuario. No editar sin confirmacion.

### 3. Registrar el server en Claude Code

**A. Recomendado (auto-config desde Unity).** Instruir al usuario:
1. Abrir el proyecto en Unity (importara el package nuevo).
2. `Window → MCP for Unity`.
3. Usar el boton de auto-configuracion para **Claude Code** — instala el server `uv` y registra el cliente.

**B. Fallback manual.** Registrar el transport HTTP de CoplayDev:

```bash
claude mcp add --transport http unity-mcp http://127.0.0.1:8080
```

> El server solo responde con Unity abierto y `MCP for Unity` activo. Registrar el cliente no levanta el server.

---

## Phase 2B: Unreal — habilitar y conectar

Nada se instala. Tres pasos, en orden. **No edites el `.uproject` sin confirmar la ruta con el usuario.**

### 1. Habilitar los plugins del engine en el `.uproject`

Dos plugins, ambos requeridos. `ModelContextProtocol` es el server y el transport; `AllToolsets` provee las tools. Con solo `ModelContextProtocol` el server arranca pero **no expone ninguna tool**.

En el array `Plugins` del `.uproject`, asegurar las dos entradas:

```json
{ "Name": "ModelContextProtocol", "Enabled": true },
{ "Name": "AllToolsets", "Enabled": true }
```

Si el array no existe, crearlo. Si alguna entrada esta en `"Enabled": false`, pasarla a `true`. Mostrar el diff y pedir aprobacion antes de escribir.

`AllToolsets` es un agregador editor-only con `EnabledByDefault` apagado, asi que hay que habilitarlo explicitamente. Para exponer solo un subconjunto, habilitar los plugins de toolset puntuales en lugar de `AllToolsets`.

### 2. Prender auto-start

Por default el server queda detenido. Para arrancarlo a mano en una sesion: `ModelContextProtocol.StartServer` desde la consola del editor.

Para que arranque en cada launch, agregar al config per-user del editor:

`<Project>/Saved/Config/<Platform>Editor/EditorPerProjectUserSettings.ini`

```ini
[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]
bAutoStartServer=True
```

Es per-user y no va a source control. Overrides opcionales si el default choca con otro servicio local:

```ini
ServerPortNumber=8000
ServerUrlPath=/mcp
```

Alternativa por command line: `-ModelContextProtocolStartServer` (y `-ModelContextProtocolPort=<port>`). Preferir el `.ini` porque persiste.

### 3. Generar el `.mcp.json`

El editor no lo escribe solo.

**Con el editor corriendo (preferido):** `ModelContextProtocol.GenerateClientConfig ClaudeCode` en la consola (o `All` para todos los clientes soportados). Re-correrlo mergea sobre el JSON existente, asi que es seguro despues de cambiar puerto o path.

El destino depende del tipo de build:
- **Source build** (el repo contiene `Engine/`): se escribe en la raiz del workspace, al lado de `Engine/` — **no** junto al `.uproject`.
- **Installed/launcher build**: se escribe junto al `.uproject`.

**Sin lanzar el editor**, escribir a mano en la ubicacion que corresponda:

```json
{
  "mcpServers": {
    "unreal-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp"
    }
  }
}
```

Ajustar la URL si se override el puerto o el path en el paso 2.

---

## Phase 3: Verificar

```bash
claude mcp list
```

Reportar si el server aparece **conectado** (`unity-mcp` o `unreal-mcp` segun el engine). En Unreal, dos senales extra: el Output Log muestra mensajes de arranque del MCP, y `list_toolsets` responde.

**Si NO esta conectado, avisar explicitamente** y aclarar que las operaciones de engine (scenes, assets, blueprints, prefabs, UI wiring) NO se aplicaron — no asumir exito.

---

## Phase 4: Resumen

Reportar:
- Engine detectado y ruta del proyecto.
- **Unity:** que keys se agregaron a `manifest.json` (o si ya estaban).
- **Unreal:** que plugins se habilitaron en el `.uproject`, si se prendio auto-start, y donde quedo el `.mcp.json`.
- Estado del registro y resultado de `claude mcp list`.
- Proximo paso manual, si queda alguno.

**Verdict:**
- **READY** — server registrado y conectado en `claude mcp list`.
- **PENDING** — config lista, pero falta abrir el editor para que el server conecte (Unity: `Window → MCP for Unity`; Unreal: lanzar el editor con auto-start, o `ModelContextProtocol.StartServer`). Avisar que las operaciones de engine aun NO estan disponibles.
- **BLOCKED** — falta un prerrequisito (`uv` ausente en Unity), el `.uproject` no se pudo editar, o no es un proyecto valido. Indicar el fix.

## Next Steps

- **Unity:** `/unity-game-architecture` o `/scaffold-unity` para trabajar el proyecto
- **Unreal:** `/ue-project-context` primero (el resto de los `ue-*` lo leen), despues `/ue-cpp-foundations` o `/ue-blueprints`
- Si el server no conecta, ver el troubleshooting de la referencia del engine que corresponda

---

> → Read references/manual-setup.md for el flujo manual de Unity (`Window → MCP for Unity`), troubleshooting (uv no encontrado, puerto 8080 ocupado, MCP no conecta) y la variante secundaria CoderGamester

> → Read references/unreal-operations.md for los console commands de Unreal (`StartServer`, `StopServer`, `RefreshTools`, `GenerateClientConfig`), el modo tool-search y la matriz de troubleshooting (puerto ocupado, toolset faltante, tool calls que cuelgan)
