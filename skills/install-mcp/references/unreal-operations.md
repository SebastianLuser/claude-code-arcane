# Unreal MCP — Console Commands, Settings, Recovery

> Adapted from the `unreal-mcp` skill in [EpicGames/unreal-engine-skills-for-claude-code-plugin](https://github.com/EpicGames/unreal-engine-skills-for-claude-code-plugin) (MIT). References to the upstream `setup.md` were remapped to Phase 2B of this skill.

Read this when something is misbehaving with the Unreal MCP server (tools missing, port collision, stale tool registry), or when you need a non-default configuration.

Remember: the server and toolsets are **engine plugins**. Nothing here installs anything into the project — it enables, restarts and reconfigures what the engine already ships.

## Console commands

Run these from the Unreal Editor console (`~`).

| Command | Use it for |
|---------|------------|
| `ModelContextProtocol.StartServer [port]` | Start the MCP server. Pass a port to override the default (e.g. when 8000 is in use). |
| `ModelContextProtocol.StopServer` | Stop the server. Useful if the registry is in a bad state and you want a clean restart. |
| `ModelContextProtocol.RefreshTools` | Re-register every toolset. Run this after enabling a new toolset plugin. |
| `ModelContextProtocol.GenerateClientConfig <client>` | Regenerate the per-client config file. Args: `ClaudeCode`, `Cursor`, `VSCode`, `Gemini`, `Codex`, `All`. |

Codex is the exception for config generation: it uses TOML and the writer refuses to overwrite an existing `.codex/config.toml`. Edit that one by hand if it already exists.

## Tool-search mode

`tools/list` has two modes, controlled by the `bEnableToolSearch` UPROPERTY on `UModelContextProtocolSettings` (default `true`):

- **`True`** (default): `tools/list` returns only `list_toolsets`, `describe_toolset`, `call_tool`. Toolset tools are dispatched server-side through `call_tool` and stay out of the prompt; the catalog never changes mid-session, so the prompt cache stays warm.
- **`False`**: every toolset tool is registered as a native MCP tool at startup, with schemas visible upfront.

Override in the same `.ini` used for `bAutoStartServer` (see Phase 2B):

```ini
[/Script/ModelContextProtocolEngine.ModelContextProtocolSettings]
bEnableToolSearch=False
```

## Troubleshooting matrix

| Symptom | What to do |
|---------|------------|
| `unreal-mcp` not in `claude mcp list` / `/mcp`, or `list_toolsets` errors | The editor isn't running, or the server isn't started. Launch the editor and run `ModelContextProtocol.StartServer`, or enable `bAutoStartServer` per Phase 2B. Then check the Output Log for startup errors. |
| Editor logs "Failed to listen on port" | Another process holds the default port. Change `ServerPortNumber` in the per-user `EditorPerProjectUserSettings.ini`, or pass `-ModelContextProtocolPort=<port>` on the next launch. Restart the editor, then re-run `ModelContextProtocol.GenerateClientConfig ClaudeCode` to refresh `.mcp.json`. |
| A toolset you expect (e.g. `NiagaraTools`) is missing | Run `ModelContextProtocol.RefreshTools`. If still missing, that toolset's plugin may not be enabled in the `.uproject` — check there. Remember `AllToolsets` is the aggregator and is off by default. |
| Tool calls hang or return errors | The editor may be busy compiling, loading a level, or in PIE. Wait and retry. For long compiles, prefer `LiveCodingToolset.CompileLiveCoding`, which returns when the compile actually finishes. |
| `AIAssistantToolset.GetDockedContext` returns empty | The Claude Code tab must be docked inside an asset editor (Blueprint, Material, etc.) to provide docked context. Undocked, that tool has nothing to report. |
| Sequential tool calls collide | Tool calls execute on the game thread. Don't issue them in parallel, even when they look independent. Serialize them. |

## Safety notes when driving the editor

These matter because every MCP call mutates live editor state on the game thread:

- **Save before and after** any bulk change. MCP edits are not always undoable, especially across compilation boundaries.
- **Wait for compilation** to finish before issuing further calls.
- **Never parallelize** tool calls.
- **Read every result.** Many tools return a status that flips between success and failure without raising. Treat anything that isn't an explicit success as a stop.
- **Mind PIE.** Editor-only tools, asset creation in particular, behave differently while Play-in-Editor is active.
