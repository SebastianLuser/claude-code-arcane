"""Helpers for worktree-isolation: parse compose files, allocate deterministic
host ports per worktree, render override yaml + .env.worktree.

Pure-Python except for PyYAML. Both apply.py and prepare.py import from here.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Iterable

import yaml


PORT_RANGE_START = 20000
PORT_RANGE_SIZE = 10000  # → 20000-29999


@dataclass(frozen=True)
class PortMapping:
    service: str
    host_ip: str | None
    original_host_port: int
    new_host_port: int
    container_port: int
    protocol: str  # "tcp" or "udp"
    var_name: str | None  # if compose used ${VAR:-default}, the captured VAR


def worktree_id(cwd: Path) -> str:
    """8-char stable hash of the absolute path."""
    return hashlib.sha256(str(cwd.resolve()).encode()).hexdigest()[:8]


def allocate_port(worktree: str, service: str, original_host: int, container: int) -> int:
    seed = f"{worktree}:{service}:{original_host}:{container}".encode()
    h = hashlib.sha256(seed).digest()
    offset = int.from_bytes(h[:4], "big") % PORT_RANGE_SIZE
    return PORT_RANGE_START + offset


_VAR_PATTERN = re.compile(r"^\$\{(\w+)(?::-([^}]*))?\}$")


def _split_port_spec(s: str) -> list[str]:
    """Split a docker-compose short-form port string on ':' while respecting ${...}.

    Examples:
      '54399:5432'                  → ['54399', '5432']
      '127.0.0.1:54399:5432'        → ['127.0.0.1', '54399', '5432']
      '${TEST_DB_PORT:-5433}:5432'  → ['${TEST_DB_PORT:-5433}', '5432']
    """
    parts: list[str] = []
    buf: list[str] = []
    depth = 0
    i = 0
    while i < len(s):
        c = s[i]
        if c == "$" and i + 1 < len(s) and s[i + 1] == "{":
            depth += 1
            buf.append(c)
            buf.append(s[i + 1])
            i += 2
            continue
        if c == "}" and depth > 0:
            depth -= 1
            buf.append(c)
            i += 1
            continue
        if c == ":" and depth == 0:
            parts.append("".join(buf))
            buf = []
            i += 1
            continue
        buf.append(c)
        i += 1
    parts.append("".join(buf))
    return parts


def _parse_host_port_token(token: str) -> tuple[int | None, str | None]:
    """Return (default_port, var_name) for a host-port token.
    Token may be a bare number ("54399") or a substitution ("${PORT:-54399}")."""
    m = _VAR_PATTERN.match(token)
    if m:
        var = m.group(1)
        default = m.group(2)
        if default and default.isdigit():
            return int(default), var
        return None, var
    if token.isdigit():
        return int(token), None
    return None, None


def parse_port_entry(entry, service: str) -> PortMapping | None:
    """Normalize one ports: list entry into a PortMapping (new_host_port=0 placeholder).

    Handles short-form strings, bare ints, and long-form dicts.
    """
    if isinstance(entry, dict):
        host_port_raw = entry.get("published")
        container_port = int(entry["target"])
        host_port: int | None
        var_name: str | None = None
        if host_port_raw is None:
            host_port = container_port
        elif isinstance(host_port_raw, int):
            host_port = host_port_raw
        else:
            host_port, var_name = _parse_host_port_token(str(host_port_raw))
            if host_port is None:
                host_port = container_port
        return PortMapping(
            service=service,
            host_ip=entry.get("host_ip"),
            original_host_port=host_port,
            new_host_port=0,
            container_port=container_port,
            protocol=entry.get("protocol", "tcp"),
            var_name=var_name,
        )

    s = str(entry).strip()
    proto = "tcp"
    if "/" in s:
        s, proto = s.rsplit("/", 1)

    parts = _split_port_spec(s)
    host_ip: str | None = None
    var_name: str | None = None

    if len(parts) == 1:
        # Bare port — Docker treats as container port; we still bind a deterministic host port.
        host_port_def, _ = _parse_host_port_token(parts[0])
        container_port = host_port_def or 0
        host_port: int | None = container_port
    elif len(parts) == 2:
        host_token, container_token = parts
        host_port, var_name = _parse_host_port_token(host_token)
        cp_def, _ = _parse_host_port_token(container_token)
        container_port = cp_def or 0
        if host_port is None:
            host_port = container_port
    elif len(parts) == 3:
        host_ip, host_token, container_token = parts
        host_port, var_name = _parse_host_port_token(host_token)
        cp_def, _ = _parse_host_port_token(container_token)
        container_port = cp_def or 0
        if host_port is None:
            host_port = container_port
    else:
        return None

    return PortMapping(
        service=service,
        host_ip=host_ip,
        original_host_port=host_port,
        new_host_port=0,
        container_port=container_port,
        protocol=proto,
        var_name=var_name,
    )


def find_compose_files(cwd: Path) -> list[Path]:
    """All docker-compose*.yml/yaml in cwd, excluding worktree-generated overrides."""
    out: list[Path] = []
    for ext in ("yml", "yaml"):
        out.extend(cwd.glob(f"docker-compose*.{ext}"))
        out.extend(cwd.glob(f"compose*.{ext}"))
    return sorted({p for p in out if not p.name.endswith((".worktree.yml", ".worktree.yaml"))})


def collect_port_mappings(compose_path: Path, worktree: str) -> list[PortMapping]:
    with open(compose_path) as f:
        data = yaml.safe_load(f) or {}
    services = data.get("services") or {}
    out: list[PortMapping] = []
    for service_name, service_def in services.items():
        ports = (service_def or {}).get("ports") or []
        for entry in ports:
            pm = parse_port_entry(entry, service_name)
            if pm is None or pm.original_host_port is None:
                continue
            new_port = allocate_port(worktree, service_name, pm.original_host_port, pm.container_port)
            out.append(replace(pm, new_host_port=new_port))
    return out


def collect_container_names(compose_path: Path) -> dict[str, str]:
    """service → container_name (only for services that have a hardcoded one)."""
    with open(compose_path) as f:
        data = yaml.safe_load(f) or {}
    services = data.get("services") or {}
    out: dict[str, str] = {}
    for service_name, service_def in services.items():
        cn = (service_def or {}).get("container_name")
        if isinstance(cn, str) and cn:
            out[service_name] = cn
    return out


class _OverrideList(list):
    """Wrapper so we can emit YAML with the `!override` tag — Compose then REPLACES the
    base list instead of appending (merge default for sequences). Compose 2.24+."""


def _represent_override_list(dumper: yaml.SafeDumper, data: _OverrideList):
    return dumper.represent_sequence("!override", list(data))


yaml.SafeDumper.add_representer(_OverrideList, _represent_override_list)


def render_override_yaml(
    mappings: list[PortMapping],
    container_names: dict[str, str],
    project_name: str,
    worktree: str,
) -> dict:
    """Build the override-yaml dict. Top-level `name:` sets COMPOSE_PROJECT_NAME for this stack.
    Per-service: rewrite ports (with !override to replace base) + suffix container_name."""
    by_service: dict[str, list[PortMapping]] = {}
    for m in mappings:
        by_service.setdefault(m.service, []).append(m)

    services: dict[str, dict] = {}
    all_services = set(by_service) | set(container_names)
    for service in all_services:
        svc: dict = {}
        if service in by_service:
            ports: list[str] = []
            for m in by_service[service]:
                spec = (
                    f"{m.host_ip}:{m.new_host_port}:{m.container_port}"
                    if m.host_ip
                    else f"{m.new_host_port}:{m.container_port}"
                )
                if m.protocol != "tcp":
                    spec = f"{spec}/{m.protocol}"
                ports.append(spec)
            svc["ports"] = _OverrideList(ports)
        if service in container_names:
            svc["container_name"] = f"{container_names[service]}-{worktree}"
        services[service] = svc

    return {"name": project_name, "services": services}


def env_var_name(mapping: PortMapping) -> str:
    """Generate a stable upper-snake-case env var name for a port mapping.

    Format: <SERVICE>_<CONTAINER_PORT>_HOST_PORT.
    Example: service "postgres-integration", container 5432 → POSTGRES_INTEGRATION_5432_HOST_PORT.
    """
    safe = re.sub(r"[^A-Za-z0-9]+", "_", mapping.service).strip("_").upper()
    return f"{safe}_{mapping.container_port}_HOST_PORT"


def render_env_worktree(
    project_name: str,
    worktree: str,
    compose_chain: list[tuple[Path, Path | None]],
    mappings: list[PortMapping],
) -> str:
    """Render the .env.worktree contents.

    compose_chain: [(base_compose_path, override_path_or_None)] in order.
    """
    lines: list[str] = [
        "# Auto-generated by ~/.claude/scripts/worktree-isolation/apply.py",
        "# DO NOT COMMIT. Source before running docker compose:",
        "#   set -a; source .env.worktree; set +a",
        f"WORKTREE_ID={worktree}",
        f"COMPOSE_PROJECT_NAME={project_name}",
    ]

    chain: list[str] = []
    for base, override in compose_chain:
        chain.append(base.name)
        if override is not None:
            chain.append(override.name)
    if chain:
        # Compose reads COMPOSE_FILE colon-separated on Unix, semicolon on Windows.
        lines.append(f"COMPOSE_FILE={':'.join(chain)}")

    seen_vars: set[str] = set()
    for m in mappings:
        var = env_var_name(m)
        if var not in seen_vars:
            lines.append(f"{var}={m.new_host_port}")
            seen_vars.add(var)
        # If the compose used ${VAR:-default}, also export VAR so substitution picks up the new port.
        if m.var_name and m.var_name not in seen_vars:
            lines.append(f"{m.var_name}={m.new_host_port}")
            seen_vars.add(m.var_name)

    return "\n".join(lines) + "\n"


def find_git_dir(cwd: Path) -> Path | None:
    """Locate the per-checkout git dir.

    For regular checkouts: <cwd>/.git is a directory.
    For git worktrees: <cwd>/.git is a file like 'gitdir: /abs/path/to/main/.git/worktrees/<name>'.
    Returns the per-checkout dir (where info/exclude lives), or None if not in a repo.
    """
    git_path = cwd / ".git"
    if git_path.is_dir():
        return git_path
    if git_path.is_file():
        try:
            content = git_path.read_text().strip()
        except OSError:
            return None
        if content.startswith("gitdir:"):
            target = Path(content.split(":", 1)[1].strip())
            if not target.is_absolute():
                target = (cwd / target).resolve()
            return target if target.exists() else None
    # walk up
    for parent in cwd.parents:
        candidate = parent / ".git"
        if candidate.is_dir():
            return candidate
    return None


def ensure_git_exclude(cwd: Path, patterns: Iterable[str]) -> bool:
    """Append patterns to <git_dir>/info/exclude (per-worktree, never committed).
    Returns True if any pattern was added."""
    git_dir = find_git_dir(cwd)
    if git_dir is None:
        return False
    info_dir = git_dir / "info"
    info_dir.mkdir(parents=True, exist_ok=True)
    exclude_file = info_dir / "exclude"
    existing_lines: set[str] = set()
    if exclude_file.exists():
        existing_lines = {l.strip() for l in exclude_file.read_text().splitlines() if l.strip()}
    to_add = [p for p in patterns if p not in existing_lines]
    if not to_add:
        return False
    with open(exclude_file, "a") as f:
        if exclude_file.stat().st_size and not exclude_file.read_text().endswith("\n"):
            f.write("\n")
        f.write("# Worktree isolation (auto-added)\n")
        for p in to_add:
            f.write(f"{p}\n")
    return True


def overrides_up_to_date(
    base: Path, override: Path, env_file: Path
) -> bool:
    """True if override + env file exist and are newer than base. Skip regen."""
    if not override.exists() or not env_file.exists():
        return False
    base_mtime = base.stat().st_mtime
    return override.stat().st_mtime >= base_mtime and env_file.stat().st_mtime >= base_mtime


def override_path_for(base: Path) -> Path:
    """docker-compose.processing.yml → docker-compose.processing.worktree.yml.
    docker-compose.yml → docker-compose.worktree.yml."""
    stem = base.name[: -len(base.suffix)]
    return base.parent / f"{stem}.worktree{base.suffix}"
