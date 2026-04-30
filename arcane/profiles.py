"""Parse .profile files and merge them with deduplication."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Profile:
    name: str
    description: str
    profile_type: str  # "base" or "addon"
    skills: list[str] = field(default_factory=list)
    rules_universal: list[str] = field(default_factory=list)
    rules_gamedev: list[str] = field(default_factory=list)
    agents: list[str] = field(default_factory=list)
    permissions_allow: list[str] = field(default_factory=list)
    permissions_deny: list[str] = field(default_factory=list)


@dataclass
class MergedProfile:
    """Result of merging core + selected profiles, fully deduplicated."""

    loaded: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    rules_universal: list[str] = field(default_factory=list)
    rules_gamedev: list[str] = field(default_factory=list)
    agents: list[str] = field(default_factory=list)
    permissions_allow: list[str] = field(default_factory=list)
    permissions_deny: list[str] = field(default_factory=list)

    @property
    def total_skills(self) -> int:
        return len(self.skills)

    @property
    def total_rules(self) -> int:
        return len(self.rules_universal) + len(self.rules_gamedev)

    @property
    def has_gamedev(self) -> bool:
        return any(
            skill in self.skills
            for skill in ("unity-dev", "shader-dev", "playtesting", "level-design")
        )


def _parse_bash_array(text: str, var_name: str) -> list[str]:
    """Extract values from a bash array definition like VAR=(a b c)."""
    opening = re.search(rf'{var_name}=\(', text)
    if not opening:
        return []
    pos = opening.end()
    in_quote = False
    while pos < len(text):
        ch = text[pos]
        if ch == '"':
            in_quote = not in_quote
        elif ch == ')' and not in_quote:
            break
        pos += 1
    else:
        return []
    content = text[opening.end():pos]
    items = []
    for line in content.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        for token in re.findall(r'"([^"]*)"', line):
            items.append(token)
        cleaned = re.sub(r'"[^"]*"', '', line)
        for token in cleaned.split():
            if token and not token.startswith('#'):
                items.append(token)
    return items


def _parse_header(text: str, key: str) -> str:
    match = re.search(rf'^#\s*{key}:\s*(.+)$', text, re.MULTILINE)
    return match.group(1).strip() if match else ""


_LEGACY_SKILL_ARRAYS = (
    "SKILLS_GENERAL", "SKILLS_GAMEDEV", "SKILLS_SOFTWARE",
    "SKILLS_AGILE", "SKILLS_DESIGN",
)


def parse_profile(path: Path) -> Profile:
    text = path.read_text(encoding="utf-8")
    name = path.stem
    desc_match = re.search(r'DESCRIPTION="([^"]*)"', text)

    # New format: single SKILLS=() array
    skills = _parse_bash_array(text, "SKILLS")

    # Backward compat: merge legacy SKILLS_GENERAL, SKILLS_SOFTWARE, etc.
    for legacy_var in _LEGACY_SKILL_ARRAYS:
        skills.extend(_parse_bash_array(text, legacy_var))

    return Profile(
        name=name,
        description=desc_match.group(1) if desc_match else _parse_header(text, "Description"),
        profile_type=_parse_header(text, "Type") or "base",
        skills=skills,
        rules_universal=_parse_bash_array(text, "RULES_UNIVERSAL"),
        rules_gamedev=_parse_bash_array(text, "RULES_GAMEDEV"),
        agents=_parse_bash_array(text, "AGENTS"),
        permissions_allow=_parse_bash_array(text, "PERMISSIONS_ALLOW"),
        permissions_deny=_parse_bash_array(text, "PERMISSIONS_DENY"),
    )


def list_profiles(profiles_dir: Path) -> list[Profile]:
    profiles = []
    for f in sorted(profiles_dir.glob("*.profile")):
        if f.stem == "core":
            continue
        profiles.append(parse_profile(f))
    return profiles


def merge_profiles(profiles_dir: Path, profile_names: list[str]) -> MergedProfile:
    merged = MergedProfile()
    seen_skills: set[str] = set()
    seen_rules_u: set[str] = set()
    seen_rules_g: set[str] = set()
    seen_agents: set[str] = set()
    seen_allow: set[str] = set()
    seen_deny: set[str] = set()

    def _add(target: list[str], items: list[str], seen: set[str]) -> None:
        for item in items:
            if item not in seen:
                seen.add(item)
                target.append(item)

    names_to_load = ["core"] + profile_names
    for name in names_to_load:
        path = profiles_dir / f"{name}.profile"
        if not path.exists():
            raise FileNotFoundError(f"Profile '{name}' not found at {path}")
        p = parse_profile(path)
        merged.loaded.append(name)
        _add(merged.skills, p.skills, seen_skills)
        _add(merged.rules_universal, p.rules_universal, seen_rules_u)
        _add(merged.rules_gamedev, p.rules_gamedev, seen_rules_g)
        _add(merged.agents, p.agents, seen_agents)
        _add(merged.permissions_allow, p.permissions_allow, seen_allow)
        _add(merged.permissions_deny, p.permissions_deny, seen_deny)

    return merged
