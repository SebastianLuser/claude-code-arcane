---
name: coding-agent-guardrails
description: "Guardrails for repos where coding agents (Claude Code and others) write code: permissions, managed settings, sandbox, hooks, branch rules, CODEOWNERS, agent tokens and secret scanning. Set up or audit."
category: "security"
argument-hint: "[setup | audit] [solo | team]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Coding Agent Guardrails

An agent that writes code can also edit CI, read secrets and push. These guardrails keep a mistake or a prompt injection inside the repo's normal review path. Every mechanism below is one Claude Code or GitHub really reads; there is no `.agent-permissions.yaml`.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `setup` | Proposes the configuration for the missing layers and writes it after approval |
| `audit` | Checks each layer and gives a verdict. Writes nothing |
| No arg | `audit` |

`solo` is one developer; `team` adds managed settings and repo rules for several people. Without it, ask. Read `.claude/settings.json`, `.claude/settings.local.json`, `.github/`, `CODEOWNERS` and the branch rules (`gh api repos/{owner}/{repo}/rulesets`, `gh api repos/{owner}/{repo}/branches/{branch}/protection`).

## Phase 2: Layers

Each layer stops what the one before cannot.

| Layer | What it stops | Mechanism |
|---|---|---|
| **1. Permission rules** | Reading secrets, running tools without asking | `.claude/settings.json` → `permissions.deny`: `Read(./.env)`, `Read(./.env.*)`, `Read(./secrets/**)`. A Read deny also blocks Edit and Write of that path and the file commands Claude Code recognizes in Bash (`cat`, `head`, `tee`, redirections), but **not** a script that opens the file itself |
| **2. Hooks** | Destructive or irreversible commands, edits to CI and infra | A PreToolUse hook on `Bash\|PowerShell` and on the file tools (Arcane ships `guard.sh`). Answers `deny` or `ask` with a reason |
| **3. Sandbox** | Any process reading or writing outside the project, network exfiltration | `sandbox.enabled: true` or `/sandbox`; `sandbox.filesystem.denyRead`, `sandbox.network.allowedDomains` (starts empty). Covers shell commands only, not the file tools, MCP servers or hooks. Set `sandbox.failIfUnavailable: true`, or it silently runs unsandboxed. **Native Windows has no sandbox**: run Claude Code inside WSL2 to get one |
| **4. Managed settings** (`team`) | A developer or a project file loosening layers 1–3 | `managed-settings.json` (macOS `/Library/Application Support/ClaudeCode/`, Linux `/etc/claude-code/`, Windows `C:\Program Files\ClaudeCode\`), MDM, or the claude.ai admin console. Keys: `permissions.disableBypassPermissionsMode: "disable"`, `allowManagedPermissionRulesOnly`, `allowManagedHooksOnly`, `allowManagedMcpServersOnly` with `allowedMcpServers`. Check with `/status` → Setting sources |
| **5. MCP servers** | A third-party server running code or reading data | Approve by name (`enabledMcpjsonServers`), never `enableAllProjectMcpServers: true`; `deniedMcpServers` for known bad ones |
| **6. Repo rules** | An agent's branch reaching `main` unreviewed | Ruleset on the default branch: pull request required, 1+ approval from someone other than the author, required status checks, no force push, no deletion. The agent's identity cannot bypass it |
| **7. CODEOWNERS** | Sensitive paths changing without the right reviewer | `.github/workflows/`, `infra/`, `terraform/`, `migrations/`, dependency manifests and `.claude/` owned by a person, with "Require review from Code Owners" on |
| **8. Agent credentials** | A leaked token doing more than the task needs | A fine-grained token or GitHub App limited to this repo, `contents` and `pull_requests` write only, no admin, short expiry. Never the developer's personal token with org-wide scope |
| **9. Secret scanning** | A secret reaching the remote | GitHub secret scanning with push protection on; locally `gitleaks git --pre-commit --staged` (8.19+; older versions: `gitleaks protect --staged`) in a pre-commit hook |

## Phase 3: Check each layer (audit)

For each layer record **present**, **partial** or **missing**, with the file or command that shows it. Missing evidence counts as missing.

- Layer 1: deny rules cover every `.env*` and secret folder that exists in the repo.
- Layer 2: the hook matcher includes `PowerShell` on Windows machines, not only `Bash`.
- Layer 3: on Windows without WSL2, mark it **missing** and say the other layers carry the load.
- Layer 6: `gh api` shows the ruleset; a classic branch protection counts too.
- Layer 7: every path in the table above has an owner.

## Phase 4: Verdict and report

| Verdict | When |
|---|---|
| **PASS** | Layers 1, 2, 6, 7 and 9 present; in `team`, also 4 and 8 |
| **CONCERNS** | Any of those partial, or layers 3 or 5 missing |
| **FAIL** | No deny rule for secrets, no review required on the default branch, or the agent uses an admin or org-wide token |

Report: verdict, one row per layer (status, evidence, fix), then the fixes in order of risk.

## Phase 5: Setup

Show the exact change per layer (the JSON keys, the ruleset body, the CODEOWNERS lines) and ask "May I write these?" before writing. Repo rules and secret scanning are changed on GitHub: give the `gh api` command and let the user run it, since it changes the remote.

## Protocol

- Never loosen an existing rule to make the setup simpler.
- Hooks and permission rules are guards against mistakes, not a sandbox: say so when layer 3 is missing.
- Rules inside CLAUDE.md are guidance the model can ignore; never count them as a guardrail.

## Next steps

- `/supply-chain-security` for dependencies and CI workflows.
- `/secret-management` to move secrets out of `.env` files.
- `/ai-security` when the product itself is an LLM app.
