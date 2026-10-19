---
name: devcontainers
description: "Dev Containers: reproducible dev environments in .devcontainer/ for VS Code, Codespaces and CI, plus an isolated container for running coding agents. Set up, add services, or harden for agents."
category: "infrastructure"
argument-hint: "[setup | compose | agent]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Dev Containers

A `.devcontainer/` folder gives everyone the same toolchain in one command: VS Code "Reopen in Container", GitHub Codespaces, or `devcontainer up` in CI. It is also the practical way to isolate a coding agent on Windows, where Claude Code's sandbox does not run natively.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `setup` | A single-container `devcontainer.json` for the project's stack |
| `compose` | The app container plus its services (database, cache) through Docker Compose |
| `agent` | A container for running Claude Code isolated from the host |

Detect the stack and versions from the lockfiles, `.nvmrc`, `go.mod`, `.tool-versions` or `global.json` before proposing anything.

## Phase 2: `devcontainer.json`

```jsonc
{
  "name": "app",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:<version>",
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm ci",
  "remoteUser": "node",
  "customizations": {
    "vscode": { "extensions": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"] }
  }
}
```

| Key | Rule |
|---|---|
| `image` / `build` | A `mcr.microsoft.com/devcontainers/*` image pinned to a version tag; `build.dockerfile` only when features cannot do it |
| `features` | Add tools (CLI, language runtimes) as features instead of `apt` lines; pin the major (`:1`) |
| `postCreateCommand` | Install from the lockfile (`npm ci`, `go mod download`), never `npm install` |
| `remoteUser` | A non-root user |
| `remoteEnv` / `containerEnv` | Secrets come from the host with `${localEnv:VAR}`; never write them into the file, which is committed |
| `forwardPorts` | Only the ports the app serves |

Versions match production: the same runtime major as the Dockerfile and CI.

## Phase 3: Services (compose mode)

Point `devcontainer.json` at a compose file and keep the database in its own service:

```jsonc
{
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.devcontainer.yml"],
  "service": "app",
  "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
  "shutdownAction": "stopCompose"
}
```

The override file adds only what development needs (the workspace mount, `command: sleep infinity`); the base `docker-compose.yml` stays usable without Dev Containers. Healthchecks and `depends_on: condition: service_healthy` as in `/docker-setup`.

## Phase 4: Coding agents (agent mode)

Anthropic publishes a reference container for Claude Code (`.devcontainer/` in the `anthropics/claude-code` repo; docs page "Development containers"). It runs Claude Code as a non-root user and adds `init-firewall.sh`, which denies outbound traffic except an allowlist (npm registry, Anthropic API, GitHub, VS Code marketplace). It needs `runArgs: ["--cap-add=NET_ADMIN", "--cap-add=NET_RAW"]` and runs the script from `postStartCommand`.

- Start from that reference instead of writing a firewall; add only the domains the project needs (your package registry, your API).
- Keep Claude Code's config in a named volume (`target=/home/node/.claude`), not a host mount.
- **Never mount host secrets:** `~/.ssh`, `~/.aws`, cloud credential files, the host's `.env`.
- The docs allow `--dangerously-skip-permissions` inside it, with a warning to repeat to the user: the workspace is bind-mounted, so Claude can still change any project file on the host, and a malicious project can exfiltrate anything inside the container, including the Claude Code credentials, to any allowed domain. Keep git as the safety net (commit before, review the diff after), and on shared machines block the flag with `permissions.disableBypassPermissionsMode: "disable"` in managed settings (`/coding-agent-guardrails`).

## Phase 5: Verify

Run `npx @devcontainers/cli up --workspace-folder .` and then `npx @devcontainers/cli exec --workspace-folder . <test command>`. The same two commands run the container in CI.

- **READY:** the container builds and the project's tests pass inside it.
- **BLOCKED:** it does not build or the tests fail inside it; report the failing step and its output. Docker not installed on the host also counts, with the install link.

## Protocol

- Show the files before writing them and ask "May I write these files?".
- Prefer the official images and features over custom Dockerfiles.
- Nix or Devbox are alternatives when the team already uses them; do not introduce them just for this.

## Next steps

- `/docker-setup` for the production images.
- `/ci-cd-setup` to run CI in the same container.
- `/coding-agent-guardrails` for the other layers around an agent.
