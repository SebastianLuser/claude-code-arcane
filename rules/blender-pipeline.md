# Blender Pipeline

Rules that must be in place before operating Blender, through MCP or headless, even if no `.blend` has been touched yet. Axes, topology, materials, animation and Git are in `.claude/rules/blender-files.md`, which loads when a `.blend` or an exported file is touched.

## MCP is optional, headless is not

There are two ways to operate Blender from Claude, and they are not equivalent:

| | MCP | Headless (`--background`) |
|---|---|---|
| Needs Blender open | Yes, with the addon connected | No |
| Reproducible in CI | No | Yes |
| Sees the scene state | Yes | Only what the script queries |
| Leaves a trace in the repo | No | Yes — the script stays versioned |

**Default: headless.** A versioned `.py` run with `blender --background --python` is
auditable, repeatable and does not depend on someone having the window open. MCP is for
exploring a scene that already exists and for iterating visually, not for the automatable step.

The two recommended MCPs are in `/blender-context`. **Neither of them is installed from this
repo**: they are addons of the user's Blender installation.

## It runs Python without a sandbox

Both the community MCP and the official one run the Python the LLM generates **without any
barrier**. Consequences that are not negotiable:

1. **Never run it with uncommitted changes** in the project repo. If something breaks, the
   only way back is git.
2. Save the `.blend` before the first operation of the session.
3. Do not point it at a machine with sensitive material or at credentials.
4. A script that deletes (`bpy.data.*.remove`, `object.delete`) is shown to the user **before**
   running it, always, even if they asked for it.
