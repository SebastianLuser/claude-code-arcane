# Manual setup — Unity MCP

Referencia detallada para el flujo manual y troubleshooting de `/install-mcp`.

## Primario: CoplayDev "MCP for Unity" (`com.coplaydev.unity-mcp`)

### Package UPM

En `Packages/manifest.json`, dentro de `dependencies`:

```json
"com.coplaydev.unity-mcp": "https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#main"
```

Al abrir el proyecto, Unity descarga e importa el package desde el git URL.

### Levantar y registrar el server (desde Unity)

1. Abrir el proyecto en Unity.
2. `Window → MCP for Unity` abre el panel del package.
3. En el panel:
   - El package instala/usa el server Python vía `uv`/`uvx` (paquete `mcp-for-unity`), transport HTTP en `127.0.0.1:8080`.
   - Usar el botón de auto-config para el cliente **Claude Code** — escribe la config del cliente MCP y deja el server listo.
4. Dejar Unity abierto: el server MCP solo responde mientras el Editor está corriendo con el panel activo.

### Registro manual del cliente (sin GUI)

Si no se puede usar el botón de auto-config:

```bash
claude mcp add --transport http unity-mcp http://127.0.0.1:8080
```

O escribir un `.mcp.json` en la raíz del proyecto:

```json
{
  "mcpServers": {
    "unity-mcp": {
      "type": "http",
      "url": "http://127.0.0.1:8080"
    }
  }
}
```

### Verificar

```bash
claude mcp list
```

`unity-mcp` debe figurar conectado. Si no, ver troubleshooting.

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---------|----------------|-----|
| `uv: command not found` | `uv` no instalado / no en PATH | `winget install astral-sh.uv` (o `pipx install uv`), reabrir terminal |
| `claude mcp list` no muestra `unity-mcp` | Cliente no registrado | Re-correr el paso 4 (auto-config o `claude mcp add`) |
| `unity-mcp` aparece pero **no conecta** | Unity cerrado o panel inactivo | Abrir Unity y `Window → MCP for Unity` |
| Puerto `8080` ocupado | Otro proceso usa 8080 | Cambiar el puerto en el panel de MCP for Unity y ajustar la URL en el registro del cliente |
| Operaciones de engine no se aplican | MCP desconectado | No asumir éxito: verificar conexión antes de operar; avisar al usuario |

## Secundario (opcional): CoderGamester `mcp-unity` (`com.gamelovers.mcp-unity`)

Server Node. Instalar con el flag `--secondary`.

### Package UPM

```json
"com.gamelovers.mcp-unity": "https://github.com/CoderGamester/mcp-unity.git"
```

### Server

Requiere `node` en PATH. El package incluye un server Node en `Server~/build/index.js` dentro del package cache (`Library/PackageCache/com.gamelovers.mcp-unity@.../Server~`). El registro del cliente apunta a ese `index.js`:

```json
{
  "mcpServers": {
    "mcp-unity": {
      "command": "node",
      "args": ["<ruta absoluta a Server~/build/index.js>"]
    }
  }
}
```

En TesisUade esta ruta la genera un editor tool propio (`Tools → Update MCP Unity Route`). Fuera de ese proyecto, ubicar el `index.js` en el `PackageCache` y registrar la ruta a mano.

> El primario (CoplayDev) es el oficial del set unity-dev. El secundario se mantiene solo por compatibilidad con proyectos que ya lo declaran.
