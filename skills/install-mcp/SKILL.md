---
name: install-mcp
description: "Instala y registra el MCP de Unity (CoplayDev MCP for Unity) en un proyecto Unity + Claude Code: agrega el package UPM, registra el server MCP y verifica la conexion. Usar para: instalar mcp unity, conectar Claude con Unity, setup MCP Unity."
category: "gamedev"
argument-hint: "[--secondary] [project-path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# install-mcp — Unity MCP Setup

Instala el package MCP del lado Unity y registra el server MCP en Claude Code, replicando el setup usado en los proyectos de tesis (TesisUade).

- **Package primario:** `com.coplaydev.unity-mcp` (CoplayDev "MCP for Unity"). Server Python vía `uv`/`uvx`, transport HTTP en `127.0.0.1:8080`. El server se levanta y auto-configura desde Unity en `Window → MCP for Unity`.
- **Package secundario (opcional, flag `--secondary`):** `com.gamelovers.mcp-unity` (CoderGamester). Server Node.

> El flujo de Unity (`Window → MCP for Unity`) requiere la GUI del Editor — Claude no puede manejarla. La skill automatiza lo que sí puede (editar `manifest.json`, registrar el cliente MCP, verificar) y **guía** el paso del Editor.

## Input

- `project-path` (opcional): raíz del proyecto Unity. Default: directorio actual.
- `--secondary` (opcional): además del primario, instala el package CoderGamester.

---

## Workflow

### 1. Detectar proyecto Unity

Desde `project-path` (o cwd), confirmar que existen:
- `Packages/manifest.json`
- `ProjectSettings/ProjectVersion.txt`

Si falta alguno, **abortar** con: "No parece un proyecto Unity (falta Packages/manifest.json o ProjectSettings/ProjectVersion.txt). Pasá la ruta del proyecto con `/install-mcp <project-path>`."

### 2. Verificar prerrequisitos

- `uv --version` y `uvx --version` (server del primario). Si falta `uv`, **no abortar**: avisar y dar el comando de install y seguir editando el manifest:
  - Windows: `winget install astral-sh.uv`
  - alternativa: `pipx install uv`
- Solo con `--secondary`: `node --version`. Si falta, avisar (el server CoderGamester no podrá correr).

### 3. Agregar el package UPM (lado Unity)

Leer `Packages/manifest.json`. Dentro de `"dependencies"`, agregar **solo si la key no existe** (idempotente — nunca duplicar):

```json
"com.coplaydev.unity-mcp": "https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main"
```

Con `--secondary`, agregar también:

```json
"com.gamelovers.mcp-unity": "https://github.com/CoderGamester/mcp-unity.git"
```

Usar `Edit` puntual sobre el bloque `dependencies` preservando el JSON válido (indentación, comas). Si la key ya estaba, reportar "ya presente, sin cambios".

> **Antes de escribir**, mostrar el diff propuesto sobre `manifest.json` (y el `.mcp.json` del paso 4B si aplica) y pedir aprobación al usuario. No editar sin confirmación.

### 4. Registrar el server MCP en Claude Code

Dos caminos, en orden de preferencia:

**A. Recomendado (auto-config desde Unity).** Instruir al usuario:
1. Abrir el proyecto en Unity (Unity importará el package nuevo).
2. `Window → MCP for Unity`.
3. En esa ventana, usar el botón de auto-configuración para **Claude Code** — instala el server `uv` y registra el cliente MCP automáticamente.

**B. Fallback manual.** Si el usuario no puede usar el Editor ahora, registrar el transport HTTP que usa CoplayDev:

```bash
claude mcp add --transport http unity-mcp http://127.0.0.1:8080
```

(equivalente: escribir un `.mcp.json` de proyecto con
`{"mcpServers":{"unity-mcp":{"type":"http","url":"http://127.0.0.1:8080"}}}`).

> El server solo responde cuando Unity está abierto con `MCP for Unity` activo. Registrar el cliente no levanta el server.

### 5. Verificar

Correr:

```bash
claude mcp list
```

Reportar si `unity-mcp` aparece **conectado**. Seguir la guía de TesisUade: **si NO está conectado, avisar explícitamente** y aclarar que las operaciones de engine (scenes, SOs, prefabs, UI wiring) NO se aplicaron — no asumir éxito.

### 6. Resumen

Reportar:
- Qué keys se agregaron a `manifest.json` (o si ya estaban).
- Estado del registro MCP (auto-config pendiente en Unity vs. fallback aplicado).
- Resultado de `claude mcp list`.
- Próximo paso manual: abrir Unity → `Window → MCP for Unity`.

**Verdict:**
- **READY** — package en `manifest.json` + cliente registrado + `unity-mcp` conectado en `claude mcp list`.
- **PENDING** — package y cliente listos, pero falta abrir Unity (`Window → MCP for Unity`) para que el server conecte. Avisar que las operaciones de engine aún NO están disponibles.
- **BLOCKED** — falta un prerrequisito (`uv` ausente) o no es un proyecto Unity válido. Indicar el fix.

Tras conectar, seguir con `/unity-game-architecture` o `/scaffold-unity` para trabajar el proyecto.

---

> → Read references/manual-setup.md for [pasos detallados del flujo Window → MCP for Unity, troubleshooting (uv no encontrado, puerto 8080 ocupado, MCP no conecta) y la variante secundaria CoderGamester]
