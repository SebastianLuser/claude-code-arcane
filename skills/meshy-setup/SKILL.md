---
name: meshy-setup
description: "Connects Claude Code to Meshy AI: API key, registration of the official Meshy MCP, balance check and asset structure. Use for: setup meshy, connect meshy, mcp meshy, meshy api key."
category: "gamedev"
argument-hint: "[--verify]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# meshy-setup — Connect Meshy AI

Gets the project ready to generate 3D assets with Meshy. **This repo does not ship the MCP server** — it is a Meshy npm package that is registered in the client. This skill wires it up, verifies it and reports; it vendors nothing.

`--verify` skips the configuration and runs only Phase 4.

---

## Phase 1: API key

The key lives in the environment, never in the repo.

```bash
echo "${MESHY_API_KEY:0:4}"   # expected: msy_
```

- **If it is there**: confirm the `msy_` prefix and continue. Never print the full key.
- **If it is missing**: ask the user for it and save it in the project's `.env`. Verify that `.env` is in `.gitignore` **before** writing — if it is not, add it first.

It comes from meshy.ai → Settings → API Keys. The API requires a paid plan.

> If the user pastes the key into the chat, write it to `.env` and tell them to rotate that key if the transcript gets shared.

---

## Phase 2: Register the MCP

Check whether it is already registered before touching anything — it is idempotent, never duplicate:

```bash
claude mcp list | grep -i meshy
```

If it does not show up, show the command and **ask for approval before running it**:

```bash
claude mcp add-json meshy '{"command":"npx","args":["-y","@meshy-ai/meshy-mcp-server"],"env":{"MESHY_API_KEY":"msy_YOUR_API_KEY"}}'
```

- Package: `@meshy-ai/meshy-mcp-server` (npm, official from Meshy).
- Requires Node. If `node --version` fails, warn and do not abort the rest.
- Replace `msy_YOUR_API_KEY` with the real key. If the user prefers not to leave it in the client config, register the server without `env` and export `MESHY_API_KEY` from the shell.

The server exposes 24 `mcp__meshy__*` tools: generation (`text_to_3d`, `image_to_3d`, `multi_image_to_3d`, `creative_lab`), post-processing (`remesh`, `retexture`, `rig`, `animate`), conversion (`convert`, `resize`, `uv_unwrap`), image (`text_to_image`, `image_to_image`), tasks (`get_task_status`, `list_tasks`, `cancel_task`, `download_model`, `list_models`), printing (`analyze_printability`, `repair_printability`, `process_multicolor`, `send_to_slicer`) and `check_balance`.

---

## Phase 3: Project structure

Create if missing — everything idempotent:

1. `assets/3d/` with a `.gitkeep`.
2. **Git LFS** entries in `.gitattributes`. Check `git lfs version` first; if LFS is not installed, warn and do **not** write the entries (having them without LFS is worse than not having them):
   ```
   *.glb  filter=lfs diff=lfs merge=lfs -text
   *.fbx  filter=lfs diff=lfs merge=lfs -text
   *.blend filter=lfs diff=lfs merge=lfs -text
   *.stl  filter=lfs diff=lfs merge=lfs -text
   *.3mf  filter=lfs diff=lfs merge=lfs -text
   ```
   `meshy.json` and `thumb.png` stay out of LFS on purpose: they are small and they are what makes the catalog greppable.
3. `.env` in `.gitignore`.

Show the diff of `.gitattributes` and `.gitignore` and ask for approval before writing.

Free web derivatives need `gltf-transform`. Do not install it: it is used via `npx` on demand.

---

## Phase 4: Verify

```bash
claude mcp list
```

With the server connected, confirm the credentials and balance with the free tool:

```
mcp__meshy__check_balance
```

Report the balance in credits. **If the server is not connected, say so explicitly** and make clear that no generation operation is available — do not assume success.

---

## Phase 5: Summary

Report:
- Origin of the API key (new `.env` vs already present in the environment). Never the value.
- Whether the MCP was registered now or was already there.
- What was created or modified: `assets/3d/`, `.gitattributes`, `.gitignore`.
- Current credit balance.

**Verdict:**
- **READY** — MCP connected in `claude mcp list` and `check_balance` responded.
- **PENDING** — config written but the server does not connect yet (typical: Node missing, or Claude Code has to be restarted to start the server). Make clear that generation is **not yet** available.
- **BLOCKED** — the API key is missing, the plan has no API access, or `.gitignore` could not be secured. State the concrete fix.

## Next Steps

- `/meshy-generate` for the first asset (read the credits gate first)
- `/meshy-derive` to get targets out of an existing master
- `/meshy-print` if the target is 3D printing
- If there is already an art bible, `/asset-spec` first: the prompts are derived from it, not invented

---

> The spending rules, the `assets/3d/` structure, the `meshy.json` ledger and the derivatives table are in `.claude/rules/meshy-assets.md` and `.claude/rules/meshy-files.md`. Read them before any operation that spends credits.
