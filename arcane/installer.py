"""Install merged profile into a target project directory."""

from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from .profiles import MergedProfile

SETTINGS_TEMPLATE = {
    "$schema": "https://json.schemastore.org/claude-code-settings.json",
    "statusLine": {
        "type": "command",
        "command": "bash .claude/statusline.sh",
    },
    "permissions": {"allow": [], "deny": []},
    "hooks": {
        "SessionStart": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/session-start.sh", "timeout": 10},
                    {"type": "command", "command": "bash .claude/hooks/detect-division.sh", "timeout": 10},
                    {"type": "command", "command": "bash .claude/hooks/detect-gaps.sh", "timeout": 10},
                ],
            }
        ],
        "PreToolUse": [
            {
                "matcher": "Bash",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/validate-commit.sh", "timeout": 15},
                    {"type": "command", "command": "bash .claude/hooks/validate-push.sh", "timeout": 10},
                    {"type": "command", "command": "bash .claude/hooks/validate-secrets.sh", "timeout": 10},
                ],
            }
        ],
        "PostToolUse": [
            {
                "matcher": "Write|Edit",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/validate-assets.sh", "timeout": 10},
                    {"type": "command", "command": "bash .claude/hooks/validate-skill-change.sh", "timeout": 5},
                ],
            }
        ],
        "Notification": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/notify.sh", "timeout": 10},
                ],
            }
        ],
        "PreCompact": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/pre-compact.sh", "timeout": 10},
                ],
            }
        ],
        "PostCompact": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/post-compact.sh", "timeout": 10},
                ],
            }
        ],
        "Stop": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/session-stop.sh", "timeout": 10},
                ],
            }
        ],
        "SubagentStart": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/log-agent.sh", "timeout": 5},
                ],
            }
        ],
        "SubagentStop": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": "bash .claude/hooks/log-agent-stop.sh", "timeout": 5},
                ],
            }
        ],
    },
}


class Installer:
    def __init__(self, arcane_dir: Path, target: Path, merged: MergedProfile, *, dry_run: bool = False):
        self.arcane = arcane_dir
        self.target = target
        self.claude_dir = target / ".claude"
        self.merged = merged
        self.dry_run = dry_run
        self._logs: list[str] = []

    def _log(self, msg: str) -> None:
        self._logs.append(msg)
        print(msg)

    def run(self) -> list[str]:
        self._backup()
        self._create_dirs()
        self._copy_hooks()
        self._copy_skills()
        self._copy_rules()
        self._copy_agents()
        self._copy_docs()
        self._generate_settings()
        self._generate_manifest()
        return self._logs

    def _backup(self) -> None:
        if not self.claude_dir.exists():
            return
        backup = self.target / ".claude.bak"
        if self.dry_run:
            self._log("  [dry-run] Would backup .claude/ -> .claude.bak/")
            return
        if backup.exists():
            shutil.rmtree(backup)
        shutil.move(str(self.claude_dir), str(backup))
        self._log("  Backed up .claude/ -> .claude.bak/")

    def _create_dirs(self) -> None:
        if self.dry_run:
            return
        for d in ["skills", "rules", "agents", "docs"]:
            (self.claude_dir / d).mkdir(parents=True, exist_ok=True)

    def _copy_hooks(self) -> None:
        self._log("\nHooks:")
        hooks_src = self.arcane / ".claude" / "hooks"
        statusline_src = self.arcane / ".claude" / "statusline.sh"

        if self.dry_run:
            self._log("  [dry-run] hooks/ -> .claude/hooks/")
            self._log("  [dry-run] statusline.sh -> .claude/statusline.sh")
            return

        if hooks_src.is_dir():
            shutil.copytree(str(hooks_src), str(self.claude_dir / "hooks"), dirs_exist_ok=True)
            self._log("  [ok] hooks/")

        if statusline_src.is_file():
            shutil.copy2(str(statusline_src), str(self.claude_dir / "statusline.sh"))
            self._log("  [ok] statusline.sh")

    def _find_skill_source(self, skill: str) -> Path | None:
        """Auto-discover skill across all skills-* pool directories."""
        for pool_dir in sorted((self.arcane / ".claude").iterdir()):
            if pool_dir.is_dir() and pool_dir.name.startswith("skills-"):
                candidate = pool_dir / skill
                if candidate.is_dir():
                    return candidate
        return None

    def _copy_skills(self) -> None:
        self._log("\nSkills:")
        for skill in self.merged.skills:
            src = self._find_skill_source(skill)
            if src is None:
                self._log(f"  WARN: Skill '{skill}' not found in any skills-* pool")
                continue
            dst = self.claude_dir / "skills" / skill
            if self.dry_run:
                self._log(f"  [dry-run] {src.parent.name}/{skill} -> skills/{skill}")
            else:
                shutil.copytree(str(src), str(dst), dirs_exist_ok=True)
                self._log(f"  [ok] {skill}")

        if self.merged.has_gamedev:
            templates_src = self.arcane / ".claude" / "skills-gamedev" / "_templates"
            if templates_src.is_dir():
                if self.dry_run:
                    self._log("  [dry-run] _templates/")
                else:
                    dst = self.claude_dir / "skills" / "_templates"
                    shutil.copytree(str(templates_src), str(dst), dirs_exist_ok=True)
                    self._log("  [ok] _templates/")

    def _copy_rules(self) -> None:
        self._log("\nRules:")
        for rule in self.merged.rules_universal:
            src = self.arcane / ".claude" / "rules" / f"{rule}.md"
            dst = self.claude_dir / "rules" / f"{rule}.md"
            if not src.is_file():
                self._log(f"  WARN: Rule '{rule}.md' not found")
                continue
            if self.dry_run:
                self._log(f"  [dry-run] {rule}.md")
            else:
                shutil.copy2(str(src), str(dst))
                self._log(f"  [ok] {rule}.md")

        for rule in self.merged.rules_gamedev:
            src = self.arcane / ".claude" / "skills-gamedev" / "_rules" / f"{rule}.md"
            dst = self.claude_dir / "rules" / f"{rule}.md"
            if not src.is_file():
                self._log(f"  WARN: Rule '{rule}.md' not found")
                continue
            if self.dry_run:
                self._log(f"  [dry-run] {rule}.md")
            else:
                shutil.copy2(str(src), str(dst))
                self._log(f"  [ok] {rule}.md")

    def _copy_agents(self) -> None:
        if not self.merged.agents:
            return
        self._log("\nAgents:")
        for agent_dir in self.merged.agents:
            src = self.arcane / ".claude" / "agents" / agent_dir
            if not src.is_dir():
                src = self.arcane / "agents" / agent_dir
            if not src.is_dir():
                self._log(f"  WARN: Agents dir '{agent_dir}' not found")
                continue
            dst = self.claude_dir / "agents" / agent_dir
            if self.dry_run:
                count = sum(1 for _ in src.rglob("*.md"))
                self._log(f"  [dry-run] agents/{agent_dir}/ ({count} agents)")
            else:
                shutil.copytree(str(src), str(dst), dirs_exist_ok=True)
                count = sum(1 for _ in dst.rglob("*.md"))
                self._log(f"  [ok] agents/{agent_dir}/ ({count} agents)")

    def _copy_docs(self) -> None:
        docs_src = self.arcane / ".claude" / "docs"
        if not docs_src.is_dir():
            return
        if self.dry_run:
            self._log("\nDocs:")
            self._log("  [dry-run] docs/")
            return
        dst = self.claude_dir / "docs"
        shutil.copytree(str(docs_src), str(dst), dirs_exist_ok=True)
        self._log("\nDocs:")
        self._log("  [ok] docs/")

    def _generate_settings(self) -> None:
        self._log("\nConfig:")
        settings = json.loads(json.dumps(SETTINGS_TEMPLATE))
        settings["permissions"]["allow"] = list(self.merged.permissions_allow)
        settings["permissions"]["deny"] = list(self.merged.permissions_deny)

        if self.dry_run:
            self._log(
                f"  [dry-run] settings.json ({len(self.merged.permissions_allow)} allow, "
                f"{len(self.merged.permissions_deny)} deny)"
            )
            return

        path = self.claude_dir / "settings.json"
        path.write_text(json.dumps(settings, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        self._log("  [ok] settings.json")

    def _generate_manifest(self) -> None:
        profile_cmd = "+".join(p for p in self.merged.loaded if p != "core")
        manifest = {
            "arcane_version": "1.0.0",
            "profile_command": profile_cmd,
            "profiles": self.merged.loaded,
            "installed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "total_skills": self.merged.total_skills,
            "total_rules": self.merged.total_rules,
            "source": str(self.arcane),
        }

        if self.dry_run:
            self._log("  [dry-run] arcane-manifest.json")
            return

        path = self.claude_dir / "arcane-manifest.json"
        path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        self._log("  [ok] arcane-manifest.json")


def clean(target: Path) -> None:
    claude_dir = target / ".claude"
    backup = target / ".claude.bak"
    if not claude_dir.exists():
        print(f"No .claude/ found in {target} — nothing to clean.")
        return

    manifest = claude_dir / "arcane-manifest.json"
    if manifest.exists():
        data = json.loads(manifest.read_text(encoding="utf-8"))
        profiles = [p for p in data.get("profiles", []) if p != "core"]
        print(f"  Current profile: {' + '.join(profiles)}")
        print(f"  Installed: {data.get('installed_at', 'unknown')}")

    shutil.rmtree(str(claude_dir))
    if backup.exists():
        shutil.rmtree(str(backup))
    print(f"\n  [ok] Removed .claude/ from {target}")
