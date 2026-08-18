---
name: meshy-setup
description: "Conecta Claude Code con Meshy AI: API key, registro del MCP oficial de Meshy, verificacion de balance y estructura de assets. Usar para: setup meshy, conectar meshy, mcp meshy, meshy api key."
category: "gamedev"
argument-hint: "[--verify]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-setup — Conectar Meshy AI

Deja el proyecto listo para generar assets 3D con Meshy. **Este repo no trae el MCP server** — es un paquete npm de Meshy que se registra en el cliente. Esta skill lo cablea, verifica y reporta; no vendoriza nada.

`--verify` salta la configuracion y corre solo la Phase 4.

---

## Phase 1: API key

La key vive en el entorno, nunca en el repo.

```bash
echo "${MESHY_API_KEY:0:4}"   # esperado: msy_
```

- **Si esta**: confirmar el prefijo `msy_` y seguir. No imprimir la key completa nunca.
- **Si falta**: pedirsela al usuario y guardarla en `.env` del proyecto. Verificar que `.env` este en `.gitignore` **antes** de escribir — si no esta, agregarlo primero.

Se saca de meshy.ai → Settings → API Keys. Requiere plan pago para la API.

> Si el usuario pega la key en el chat, escribirla a `.env` y avisarle que rote esa key si el transcript se comparte.

---

## Phase 2: Registrar el MCP

Chequear si ya esta registrado antes de tocar nada — es idempotente, nunca duplicar:

```bash
claude mcp list | grep -i meshy
```

Si no aparece, mostrar el comando y **pedir aprobacion antes de correrlo**:

```bash
claude mcp add-json meshy '{"command":"npx","args":["-y","@meshy-ai/meshy-mcp-server"],"env":{"MESHY_API_KEY":"msy_YOUR_API_KEY"}}'
```

- Paquete: `@meshy-ai/meshy-mcp-server` (npm, oficial de Meshy).
- Requiere Node. Si falta `node --version`, avisar y no abortar el resto.
- Sustituir `msy_YOUR_API_KEY` por la key real. Si el usuario prefiere no dejarla en la config del cliente, registrar el server sin `env` y exportar `MESHY_API_KEY` desde el shell.

El server expone 24 tools `mcp__meshy__*`: generacion (`text_to_3d`, `image_to_3d`, `multi_image_to_3d`, `creative_lab`), post-proceso (`remesh`, `retexture`, `rig`, `animate`), conversion (`convert`, `resize`, `uv_unwrap`), imagen (`text_to_image`, `image_to_image`), tasks (`get_task_status`, `list_tasks`, `cancel_task`, `download_model`, `list_models`), impresion (`analyze_printability`, `repair_printability`, `process_multicolor`, `send_to_slicer`) y `check_balance`.

---

## Phase 3: Estructura del proyecto

Crear si no existen — todo idempotente:

1. `assets/3d/` con un `.gitkeep`.
2. Entradas de **Git LFS** en `.gitattributes`. Verificar `git lfs version` primero; si LFS no esta instalado, avisar y **no** escribir las entradas (peor que no tenerlas es tenerlas sin LFS):
   ```
   *.glb  filter=lfs diff=lfs merge=lfs -text
   *.fbx  filter=lfs diff=lfs merge=lfs -text
   *.blend filter=lfs diff=lfs merge=lfs -text
   *.stl  filter=lfs diff=lfs merge=lfs -text
   *.3mf  filter=lfs diff=lfs merge=lfs -text
   ```
   `meshy.json` y `thumb.png` quedan fuera de LFS a proposito: son chicos y son lo que hace grepeable el catalogo.
3. `.env` en `.gitignore`.

Mostrar el diff de `.gitattributes` y `.gitignore` y pedir aprobacion antes de escribir.

Para derivados web gratis hace falta `gltf-transform`. No instalarlo: se usa via `npx` on-demand.

---

## Phase 4: Verificar

```bash
claude mcp list
```

Con el server conectado, confirmar credenciales y balance con la tool gratis:

```
mcp__meshy__check_balance
```

Reportar el balance en creditos. **Si el server no esta conectado, avisar explicitamente** y aclarar que ninguna operacion de generacion esta disponible — no asumir exito.

---

## Phase 5: Resumen

Reportar:
- Origen de la API key (`.env` nueva vs ya presente en el entorno). Nunca el valor.
- Si el MCP se registro ahora o ya estaba.
- Que se creo o modifico: `assets/3d/`, `.gitattributes`, `.gitignore`.
- Balance de creditos actual.

**Verdict:**
- **READY** — MCP conectado en `claude mcp list` y `check_balance` respondio.
- **PENDING** — config escrita pero el server no conecta todavia (tipico: Node ausente, o hay que reiniciar Claude Code para que levante el server). Aclarar que generar **aun no** esta disponible.
- **BLOCKED** — falta la API key, el plan no tiene acceso a la API, o `.gitignore` no se pudo asegurar. Indicar el fix concreto.

## Next Steps

- `/meshy-generate` para el primer asset (leer el gate de creditos antes)
- `/meshy-derive` para sacar targets de un master existente
- `/meshy-print` si el destino es impresion 3D
- Si ya hay art bible, `/asset-spec` primero: los prompts se derivan de ahi, no se inventan

---

> Las reglas de gasto, estructura de `assets/3d/`, ledger `meshy.json` y tabla de derivados estan en `.claude/rules/meshy-assets.md`. Leerlas antes de cualquier operacion que gaste creditos.
