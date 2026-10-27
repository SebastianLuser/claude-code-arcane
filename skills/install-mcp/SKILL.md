---
name: install-mcp
description: "Connects Claude Code to the engine's MCP: Unity (CoplayDev UPM package) or Unreal (engine plugins). Detects, registers and verifies. Use for: unity mcp, unreal mcp, editor MCP setup."
category: "gamedev"
argument-hint: "[unity | unreal] [--secondary] [project-path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# install-mcp — Engine MCP Setup

Connects Claude Code to the engine editor via MCP. The two engines differ in one important way:

| | Unity | Unreal |
|---|---|---|
| **Where the MCP comes from** | Third-party package (CoplayDev) | **The engine's own plugins** (`ModelContextProtocol` + `AllToolsets`) |
| **Is anything added to the project** | Yes — a UPM package in `Packages/manifest.json` | **No** — it ships with the engine, it only gets enabled |
| **What this skill does** | Install + register + verify | Enable + connect + verify |

> In Unreal **there is nothing to install**. The server and the toolsets are engine plugins; the work is enabling them in the `.uproject`, turning on auto-start and generating the `.mcp.json`. Do not add third-party packages or plugins.

## Input

- `unity` | `unreal` (optional): forces the engine. Without an argument, it is autodetected.
- `project-path` (optional): project root. Default: current directory.
- `--secondary` (optional, **Unity only**): besides the primary, installs the CoderGamester package.

---

## Phase 1: Detect the engine

From `project-path` (or cwd), look for markers:

| Marker | Engine |
|---|---|
| `Packages/manifest.json` + `ProjectSettings/ProjectVersion.txt` | Unity |
| `*.uproject` (or `GenerateProjectFiles.*` in a source tree) | Unreal |

- If the explicit argument contradicts the markers, **warn and ask** before continuing.
- If there are no markers, **abort**: "This does not look like a Unity or Unreal project. Pass the path with `/install-mcp [unity|unreal] <project-path>`."
- If both show up, ask which one.

Confirm the detected engine and the path before touching files.

---

## Phase 2A: Unity — install and register

### 1. Check prerequisites

`uv --version` and `uvx --version` (the primary's server). If `uv` is missing, **do not abort**: warn, give the command and keep editing the manifest.

- Windows: `winget install astral-sh.uv`
- alternative: `pipx install uv`

Only with `--secondary`: `node --version`. If it is missing, warn (the CoderGamester server will not be able to run).

### 2. Add the UPM package

A third-party MCP is **someone else's code running with access to the editor and the project**. Before adding it:

- **Who publishes it:** the repo in the URL is the project's official one (CoplayDev, CoderGamester), not a fork with a similar name.
- **Pinned version:** never `#main`. Resolve the latest release and pin that tag:
  `gh api repos/CoplayDev/unity-mcp/releases/latest --jq .tag_name` (with `--secondary`, also `repos/CoderGamester/mcp-unity`). If `gh` is not available, ask the user for the tag.
- **What it can do:** list in the summary the tools the server exposes once connected, so the user knows what it enables.

Read `Packages/manifest.json`. Inside `"dependencies"`, add **only if the key does not exist** (idempotent — never duplicate), with the resolved tag:

```json
"com.coplaydev.unity-mcp": "https://github.com/CoplayDev/unity-mcp.git?path=/MCPForUnity#<tag>"
```

With `--secondary`, also add:

```json
"com.gamelovers.mcp-unity": "https://github.com/CoderGamester/mcp-unity.git#<tag>"
```

If the key already exists pointing to `#main` or without a tag, flag it and propose pinning it; do not change it without approval.

Use a targeted `Edit` on the `dependencies` block, keeping the JSON valid (indentation, commas). If the key was already there, report "already present, no changes".

> **Before writing**, show the proposed diff of `manifest.json` (and of the `.mcp.json` from step 3B if applicable) and ask the user for approval. Do not edit without confirmation.

### 3. Register the server in Claude Code

**A. Recommended (auto-config from Unity).** Instruct the user to:
1. Open the project in Unity (it will import the new package).
2. `Window → MCP for Unity`.
3. Use the auto-configuration button for **Claude Code** — it installs the `uv` server and registers the client.

**B. Manual fallback.** Register CoplayDev's HTTP transport:

```bash
claude mcp add --transport http unity-mcp http://127.0.0.1:8080
```

> The server only responds while Unity is open with `MCP for Unity` active. Registering the client does not start the server.

---

## Phase 2B: Unreal — enable and connect

Nothing gets installed. Three steps, in order. **Do not edit the `.uproject` without confirming the path with the user.**

### 1. Enable the engine plugins in the `.uproject`

Two plugins, both required. `ModelContextProtocol` is the server and the transport; `AllToolsets` provides the tools. With only `ModelContextProtocol` the server starts but **exposes no tools**.

In the `.uproject`'s `Plugins` array, make sure both entries are present:

```json
{ "Name": "ModelContextProtocol", "Enabled": true },
{ "Name": "AllToolsets", "Enabled": true }
```

If the array does not exist, create it. If an entry is `"Enabled": false`, switch it to `true`. Show the diff and ask for approval before writing.

`AllToolsets` is an editor-only aggregator with `EnabledByDefault` off, so it has to be enabled explicitly. To expose only a subset, enable the specific toolset plugins instead of `AllToolsets`.

### 2. Turn on auto-start

By default the server stays stopped. To start it by hand in a session: `ModelContextProtocol.StartServer` from the editor console.

To have it start on every launch, add to the editor's per-user config:

`<Project>/Saved/Config/<Platform>Editor/EditorPerProjectUserSettings.ini`

```ini
[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]
bAutoStartServer=True
```

It is per-user and does not go into source control. Optional overrides if the default clashes with another local service:

```ini
ServerPortNumber=8000
ServerUrlPath=/mcp
```

Command-line alternative: `-ModelContextProtocolStartServer` (and `-ModelContextProtocolPort=<port>`). Prefer the `.ini` because it persists.

### 3. Generate the `.mcp.json`

The editor does not write it on its own.

**With the editor running (preferred):** `ModelContextProtocol.GenerateClientConfig ClaudeCode` in the console (or `All` for every supported client). Re-running it merges over the existing JSON, so it is safe after changing the port or path.

The destination depends on the build type:
- **Source build** (the repo contains `Engine/`): it is written at the workspace root, next to `Engine/` — **not** next to the `.uproject`.
- **Installed/launcher build**: it is written next to the `.uproject`.

**Without launching the editor**, write it by hand in the right location:

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

Adjust the URL if the port or path was overridden in step 2.

---

## Phase 3: Verify

```bash
claude mcp list
```

Report whether the server shows up **connected** (`unity-mcp` or `unreal-mcp` depending on the engine). In Unreal, two extra signals: the Output Log shows MCP startup messages, and `list_toolsets` responds.

**If it is NOT connected, say so explicitly** and make clear that engine operations (scenes, assets, blueprints, prefabs, UI wiring) were NOT applied — do not assume success.

---

## Phase 4: Summary

Report:
- Detected engine and project path.
- **Unity:** which keys were added to `manifest.json` (or whether they were already there).
- **Unreal:** which plugins were enabled in the `.uproject`, whether auto-start was turned on, and where the `.mcp.json` ended up.
- Registration status and the result of `claude mcp list`.
- The next manual step, if any remains.

**Verdict:**
- **READY** — server registered and connected in `claude mcp list`.
- **PENDING** — config ready, but the editor still has to be opened for the server to connect (Unity: `Window → MCP for Unity`; Unreal: launch the editor with auto-start, or `ModelContextProtocol.StartServer`). Warn that engine operations are NOT available yet.
- **BLOCKED** — a prerequisite is missing (`uv` absent in Unity), the `.uproject` could not be edited, or it is not a valid project. State the fix.

## Next Steps

- **Unity:** `/unity-game-architecture` or `/scaffold-unity` to work on the project
- **Unreal:** `/ue-project-context` first (the rest of the `ue-*` skills read it), then `/ue-cpp-foundations` or `/ue-blueprints`
- If the server does not connect, see the troubleshooting in the matching engine reference

---

> → Read references/manual-setup.md for the manual Unity flow (`Window → MCP for Unity`), troubleshooting (uv not found, port 8080 busy, MCP does not connect) and the CoderGamester secondary variant

> → Read references/unreal-operations.md for the Unreal console commands (`StartServer`, `StopServer`, `RefreshTools`, `GenerateClientConfig`), tool-search mode and the troubleshooting matrix (port busy, missing toolset, hanging tool calls)
