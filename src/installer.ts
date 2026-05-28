import fs from "node:fs";
import path from "node:path";
import type { MergedProfile, InstallerOptions } from "./types.js";
import {
  copyDirSync,
  ensureDir,
  getPackageRoot,
  isSymlinkOrJunction,
  safeRemove,
} from "./utils.js";
import { writeManifest } from "./manifest.js";
import { linkOrCopyDir } from "./worktree.js";
import { computeContentHashes } from "./content-hash.js";

const SETTINGS_TEMPLATE = {
  $schema: "https://json.schemastore.org/claude-code-settings.json",
  permissions: { allow: [] as string[], deny: [] as string[] },
  hooks: {
    SessionStart: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/session-start.sh",
            timeout: 10,
          },
          {
            type: "command",
            command: "bash .claude/hooks/detect-division.sh",
            timeout: 10,
          },
          {
            type: "command",
            command: "bash .claude/hooks/detect-gaps.sh",
            timeout: 10,
          },
          {
            type: "command",
            command: "bash .claude/hooks/check-update.sh",
            timeout: 10,
          },
        ],
      },
    ],
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/validate-commit.sh",
            timeout: 15,
          },
          {
            type: "command",
            command: "bash .claude/hooks/validate-push.sh",
            timeout: 10,
          },
          {
            type: "command",
            command: "bash .claude/hooks/validate-secrets.sh",
            timeout: 10,
          },
        ],
      },
    ],
    PostToolUse: [
      {
        matcher: "Write|Edit",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/validate-assets.sh",
            timeout: 10,
          },
          {
            type: "command",
            command: "bash .claude/hooks/validate-skill-change.sh",
            timeout: 5,
          },
        ],
      },
    ],
    Notification: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/notify.sh",
            timeout: 10,
          },
        ],
      },
    ],
    PreCompact: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/pre-compact.sh",
            timeout: 10,
          },
        ],
      },
    ],
    PostCompact: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/post-compact.sh",
            timeout: 10,
          },
        ],
      },
    ],
    Stop: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/session-stop.sh",
            timeout: 10,
          },
        ],
      },
    ],
    SubagentStart: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/log-agent.sh",
            timeout: 5,
          },
        ],
      },
    ],
    SubagentStop: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: "bash .claude/hooks/log-agent-stop.sh",
            timeout: 5,
          },
        ],
      },
    ],
  },
};

export class Installer {
  private root: string;
  private target: string;
  private claudeDir: string;
  private merged: MergedProfile;
  private dryRun: boolean;
  private logs: string[] = [];

  private shareFrom?: string;
  private sharedDirs: string[] = [];

  constructor(merged: MergedProfile, opts: InstallerOptions) {
    this.root = opts.contentRoot ?? getPackageRoot();
    this.target = opts.target;
    this.claudeDir = path.join(opts.target, ".claude");
    this.merged = merged;
    this.dryRun = opts.dryRun;
    this.shareFrom = opts.shareFrom;
  }

  private log(msg: string): void {
    this.logs.push(msg);
    console.log(msg);
  }

  run(
    profileCommand: string,
    worktreeMeta?: {
      is_worktree: boolean;
      main_worktree: string;
    },
  ): string[] {
    this.backup();
    this.createDirs();
    this.copyHooks();
    this.copySkills();
    this.copyRules();
    this.copyAgents();
    this.copyDocs();
    this.generateSettings();

    if (!this.dryRun) {
      const wt =
        worktreeMeta && this.sharedDirs.length > 0
          ? { ...worktreeMeta, shared_dirs: this.sharedDirs }
          : worktreeMeta
            ? { ...worktreeMeta, shared_dirs: [] }
            : undefined;
      const contentHashes = computeContentHashes(this.claudeDir);
      writeManifest(this.target, this.merged, profileCommand, this.root, {
        worktree: wt,
        contentHashes,
      });
      this.log("  [ok] arcane-manifest.json");
    } else {
      this.log("  [dry-run] arcane-manifest.json");
    }

    return this.logs;
  }

  private backup(): void {
    if (!fs.existsSync(this.claudeDir)) return;
    const backup = path.join(this.target, ".claude.bak");
    if (this.dryRun) {
      this.log("  [dry-run] Would backup .claude/ -> .claude.bak/");
      return;
    }
    if (fs.existsSync(backup)) {
      fs.rmSync(backup, { recursive: true, force: true });
    }
    fs.renameSync(this.claudeDir, backup);
    this.log("  Backed up .claude/ -> .claude.bak/");
  }

  private createDirs(): void {
    if (this.dryRun) return;
    for (const d of ["skills", "rules", "agents", "docs"]) {
      ensureDir(path.join(this.claudeDir, d));
    }
  }

  private get hasStatusline(): boolean {
    return this.merged.loaded.includes("statusline");
  }

  private copyHooks(): void {
    this.log("\nHooks:");
    const hooksDir = path.join(this.claudeDir, "hooks");

    if (this.dryRun) {
      if (this.shareFrom) {
        this.log("  [dry-run] hooks/ -> symlink from main worktree");
      } else {
        this.log("  [dry-run] hooks/ -> .claude/hooks/");
      }
      if (this.hasStatusline) this.log("  [dry-run] statusline.sh");
      return;
    }

    if (this.shareFrom) {
      const sharedHooks = path.join(this.shareFrom, ".claude", "hooks");
      if (fs.existsSync(sharedHooks)) {
        const result = linkOrCopyDir(sharedHooks, hooksDir, "symlink");
        if (result === "linked") {
          this.sharedDirs.push("hooks");
          this.log("  [ok] hooks/ (shared via symlink)");
        } else {
          this.log("  [ok] hooks/ (copied — symlink failed)");
        }
        this.copyStatusline();
        return;
      }
    }

    const hooksSrc = path.join(this.root, "hooks");
    if (fs.existsSync(hooksSrc)) {
      ensureDir(hooksDir);
      for (const entry of fs.readdirSync(hooksSrc, { withFileTypes: true })) {
        if (entry.name === "statusline.sh") continue;
        const src = path.join(hooksSrc, entry.name);
        const dst = path.join(hooksDir, entry.name);
        if (entry.isDirectory()) {
          copyDirSync(src, dst);
        } else {
          fs.copyFileSync(src, dst);
        }
      }
      this.log("  [ok] hooks/");
    }
    this.copyStatusline();
  }

  private copyStatusline(): void {
    if (!this.hasStatusline) return;
    const statusline = path.join(this.root, "hooks", "statusline.sh");
    if (fs.existsSync(statusline)) {
      fs.copyFileSync(
        statusline,
        path.join(this.claudeDir, "statusline.sh"),
      );
      this.log("  [ok] statusline.sh (+statusline addon)");
    }
  }

  private copySkills(): void {
    this.log("\nSkills:");
    for (const skill of this.merged.skills) {
      const src = path.join(this.root, "skills", skill);
      if (!fs.existsSync(src)) {
        this.log(`  WARN: Skill '${skill}' not found in skills/`);
        continue;
      }
      const dst = path.join(this.claudeDir, "skills", skill);
      if (this.dryRun) {
        this.log(`  [dry-run] ${skill}`);
      } else {
        copyDirSync(src, dst);
        this.log(`  [ok] ${skill}`);
      }
    }

    const hasGamedev = this.merged.rules.gamedev.length > 0;
    if (hasGamedev) {
      const tplSrc = path.join(this.root, "templates", "gamedev");
      if (fs.existsSync(tplSrc)) {
        const tplDst = path.join(this.claudeDir, "skills", "_templates");
        if (this.dryRun) {
          this.log("  [dry-run] _templates/");
        } else {
          copyDirSync(tplSrc, tplDst);
          this.log("  [ok] _templates/");
        }
      }
    }
  }

  private copyRules(): void {
    this.log("\nRules:");
    for (const rule of this.merged.rules.universal) {
      const src = path.join(this.root, "rules", `${rule}.md`);
      if (!fs.existsSync(src)) {
        this.log(`  WARN: Rule '${rule}.md' not found`);
        continue;
      }
      if (this.dryRun) {
        this.log(`  [dry-run] ${rule}.md`);
      } else {
        fs.copyFileSync(
          src,
          path.join(this.claudeDir, "rules", `${rule}.md`),
        );
        this.log(`  [ok] ${rule}.md`);
      }
    }
    for (const rule of this.merged.rules.gamedev) {
      const src = path.join(this.root, "rules", "gamedev", `${rule}.md`);
      if (!fs.existsSync(src)) {
        this.log(`  WARN: Rule '${rule}.md' not found`);
        continue;
      }
      if (this.dryRun) {
        this.log(`  [dry-run] ${rule}.md`);
      } else {
        fs.copyFileSync(
          src,
          path.join(this.claudeDir, "rules", `${rule}.md`),
        );
        this.log(`  [ok] ${rule}.md`);
      }
    }
  }

  private copyAgents(): void {
    if (this.merged.agents.length === 0) return;
    this.log("\nAgents:");
    for (const agentDir of this.merged.agents) {
      const src = path.join(this.root, "agents", agentDir);
      if (!fs.existsSync(src)) {
        this.log(`  WARN: Agent dir '${agentDir}' not found`);
        continue;
      }
      const dst = path.join(this.claudeDir, "agents", agentDir);
      if (this.dryRun) {
        this.log(`  [dry-run] agents/${agentDir}/`);
      } else {
        copyDirSync(src, dst);
        const count = fs
          .readdirSync(dst, { recursive: true })
          .filter((f) => String(f).endsWith(".md")).length;
        this.log(`  [ok] agents/${agentDir}/ (${count} agents)`);
      }
    }
  }

  private copyDocs(): void {
    const docsDir = path.join(this.claudeDir, "docs");
    const docsSrc = path.join(this.root, "docs");
    if (!fs.existsSync(docsSrc)) return;
    this.log("\nDocs:");
    if (this.dryRun) {
      if (this.shareFrom) {
        this.log("  [dry-run] docs/ -> symlink from main worktree");
      } else {
        this.log("  [dry-run] docs/");
      }
      return;
    }

    if (this.shareFrom) {
      const sharedDocs = path.join(this.shareFrom, ".claude", "docs");
      if (fs.existsSync(sharedDocs)) {
        const result = linkOrCopyDir(sharedDocs, docsDir, "symlink");
        if (result === "linked") {
          this.sharedDirs.push("docs");
          this.log("  [ok] docs/ (shared via symlink)");
        } else {
          this.log("  [ok] docs/ (copied — symlink failed)");
        }
        return;
      }
    }

    copyDirSync(docsSrc, docsDir);
    this.log("  [ok] docs/");
  }

  private generateSettings(): void {
    this.log("\nConfig:");
    const settings = JSON.parse(JSON.stringify(SETTINGS_TEMPLATE));
    settings.permissions.allow = [...this.merged.permissions.allow];
    settings.permissions.deny = [...this.merged.permissions.deny];
    if (this.hasStatusline) {
      settings.statusLine = {
        type: "command",
        command: "bash .claude/statusline.sh",
      };
    }

    if (this.dryRun) {
      this.log(
        `  [dry-run] settings.json (${this.merged.permissions.allow.length} allow, ${this.merged.permissions.deny.length} deny)`,
      );
      return;
    }
    const settingsPath = path.join(this.claudeDir, "settings.json");
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(settings, null, 2) + "\n",
      "utf-8",
    );
    this.log("  [ok] settings.json");
  }
}

export function clean(target: string): void {
  const claudeDir = path.join(target, ".claude");
  const backup = path.join(target, ".claude.bak");
  if (!fs.existsSync(claudeDir)) {
    console.log(`No .claude/ found in ${target} — nothing to clean.`);
    return;
  }

  const manifestFile = path.join(claudeDir, "arcane-manifest.json");
  if (fs.existsSync(manifestFile)) {
    const data = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
    const profiles = (data.profiles ?? []).filter(
      (p: string) => p !== "core",
    );
    console.log(`  Current profile: ${profiles.join(" + ")}`);
    console.log(`  Installed: ${data.installed_at ?? "unknown"}`);

    const shared = data.worktree?.shared_dirs ?? [];
    for (const dir of shared) {
      const p = path.join(claudeDir, dir);
      if (isSymlinkOrJunction(p)) {
        fs.unlinkSync(p);
        console.log(`  [ok] Unlinked shared ${dir}/`);
      }
    }
  }

  for (const sub of ["hooks", "docs", "skills", "agents", "rules"]) {
    const p = path.join(claudeDir, sub);
    safeRemove(p);
  }

  const remaining = fs.readdirSync(claudeDir);
  for (const f of remaining) {
    const p = path.join(claudeDir, f);
    safeRemove(p);
  }

  if (fs.existsSync(claudeDir)) {
    fs.rmSync(claudeDir, { recursive: true, force: true });
  }
  if (fs.existsSync(backup)) {
    fs.rmSync(backup, { recursive: true, force: true });
  }
  console.log(`\n  [ok] Removed .claude/ from ${target}`);
}
