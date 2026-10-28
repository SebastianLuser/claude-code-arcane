import fs from "node:fs";
import path from "node:path";
import type { MergedProfile, InstallerOptions } from "./types.js";
import {
  copyDirSync,
  ensureDir,
  getPackageRoot,
  isSymlinkOrJunction,
  safeRemove,
  statuslineCommand,
} from "./utils.js";
import {
  agentEntryLabel,
  agentSourcePath,
  copyAgentEntry,
} from "./agent-entries.js";
import { writeManifest } from "./manifest.js";
import type { ArcaneManifest } from "./types.js";
import { linkOrCopyDir } from "./worktree.js";
import { computeContentHashes, referencedDocs } from "./content-hash.js";
import { defaultHooks } from "./hook-commands.js";

/**
 * Skill scripts print arrows, emoji and accents. On Windows a piped stdout (how
 * Claude runs them) is cp1252, so they died with UnicodeEncodeError. UTF-8 mode
 * fixes stdio and open() for every Python that Claude Code starts.
 */
export const SETTINGS_ENV = { PYTHONUTF8: "1" };

const SETTINGS_TEMPLATE = {
  $schema: "https://json.schemastore.org/claude-code-settings.json",
  env: SETTINGS_ENV,
  permissions: { allow: [] as string[], deny: [] as string[] },
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
  private sourceVersion?: string;
  private sourceType?: InstallerOptions["sourceType"];

  constructor(merged: MergedProfile, opts: InstallerOptions) {
    this.root = opts.contentRoot ?? getPackageRoot();
    this.target = opts.target;
    this.claudeDir = path.join(opts.target, ".claude");
    this.merged = merged;
    this.dryRun = opts.dryRun;
    this.shareFrom = opts.shareFrom;
    this.sourceVersion = opts.sourceVersion;
    this.sourceType = opts.sourceType;
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
    const backup = this.backup();
    this.createDirs();
    this.copyHooks();
    this.copySkills();
    this.copyRules();
    this.copyOutputStyles();
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
        sourceVersion: this.sourceVersion,
        sourceType: this.sourceType,
      });
      this.log("  [ok] arcane-manifest.json");
      // After the manifest: its hashes must not claim the user's files as Arcane's.
      if (backup) this.restoreUserContent(backup);
    } else {
      this.log("  [dry-run] arcane-manifest.json");
    }

    return this.logs;
  }

  /** Move .claude/ aside without touching earlier backups; returns where it went. */
  private backup(): string | null {
    if (!fs.existsSync(this.claudeDir)) return null;
    let backup = path.join(this.target, ".claude.bak");
    if (fs.existsSync(backup)) {
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*$/, "");
      backup = `${backup}-${stamp}`;
    }
    if (this.dryRun) {
      this.log(`  [dry-run] Would backup .claude/ -> ${path.basename(backup)}/ and keep your own files`);
      return null;
    }
    fs.renameSync(this.claudeDir, backup);
    this.log(`  Backed up .claude/ -> ${path.basename(backup)}/`);
    return backup;
  }

  /** Move back what Arcane did not write; a name the new install also ships stays in the backup. */
  private restoreUserContent(backup: string): void {
    const oldManifestFile = path.join(backup, "arcane-manifest.json");
    const prev: Partial<ArcaneManifest> = fs.existsSync(oldManifestFile)
      ? (JSON.parse(fs.readFileSync(oldManifestFile, "utf-8")) as ArcaneManifest)
      : {};
    const owned: Record<string, Set<string>> = {
      skills: new Set([...(prev.installed_skills ?? []), ...Object.keys(prev.content_hashes?.skills ?? {}), "_templates"]),
      rules: new Set([...(prev.installed_rules ?? []).map((r) => (r.endsWith(".md") ? r : `${r}.md`)),
        ...Object.keys(prev.content_hashes?.rules ?? {})]),
      agents: new Set([...(prev.installed_agents ?? []).map((a) => a.split("/")[0]),
        ...Object.keys(prev.content_hashes?.agents ?? {})]),
    };
    const arcaneFiles = new Set(["arcane-manifest.json", "settings.json", "statusline.sh", "output-styles", "hooks", "docs"]);
    const kept: string[] = [];
    const move = (rel: string) => {
      fs.mkdirSync(path.dirname(path.join(this.claudeDir, rel)), { recursive: true });
      fs.renameSync(path.join(backup, rel), path.join(this.claudeDir, rel));
      kept.push(rel.split(path.sep).join("/"));
    };

    for (const entry of fs.readdirSync(backup)) {
      if (Object.hasOwn(owned, entry)) {
        for (const name of fs.readdirSync(path.join(backup, entry))) {
          if (owned[entry].has(name) || fs.existsSync(path.join(this.claudeDir, entry, name))) continue;
          move(path.join(entry, name));
        }
      } else if (!arcaneFiles.has(entry) && !fs.existsSync(path.join(this.claudeDir, entry))) {
        move(entry);
      }
    }
    if (kept.length > 0) this.log(`  [ok] Kept your own files: ${kept.join(", ")}`);
  }

  private createDirs(): void {
    if (this.dryRun) return;
    for (const d of ["skills", "rules", "agents", "docs"]) {
      ensureDir(path.join(this.claudeDir, d));
    }
    if (this.merged.output_styles.length > 0) {
      ensureDir(path.join(this.claudeDir, "output-styles"));
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
      this.log("  [ok] statusline.sh (statusline profile)");
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

  private copyOutputStyles(): void {
    if (this.merged.output_styles.length === 0) return;
    this.log("\nOutput styles:");
    for (const style of this.merged.output_styles) {
      const src = path.join(this.root, "output-styles", `${style}.md`);
      if (!fs.existsSync(src)) {
        this.log(`  WARN: Output style '${style}.md' not found`);
        continue;
      }
      if (this.dryRun) {
        this.log(`  [dry-run] ${style}.md`);
      } else {
        fs.copyFileSync(
          src,
          path.join(this.claudeDir, "output-styles", `${style}.md`),
        );
        this.log(`  [ok] ${style}.md`);
      }
    }
  }

  private copyAgents(): void {
    if (this.merged.agents.length === 0) return;
    this.log("\nAgents:");
    for (const entry of this.merged.agents) {
      const label = agentEntryLabel(entry);
      if (!agentSourcePath(this.root, entry)) {
        this.log(`  WARN: Agent entry '${entry}' not found`);
        continue;
      }
      if (this.dryRun) {
        this.log(`  [dry-run] ${label}`);
        continue;
      }
      const count = copyAgentEntry(this.root, this.claudeDir, entry);
      this.log(`  [ok] ${label}${count === 1 ? "" : ` (${count} agents)`}`);
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

    const docs = referencedDocs(
      this.root,
      this.merged.skills,
      [...this.merged.rules.universal, ...this.merged.rules.gamedev],
      this.merged.agents,
    );
    for (const doc of docs) {
      fs.mkdirSync(path.dirname(path.join(docsDir, doc)), { recursive: true });
      fs.copyFileSync(path.join(docsSrc, doc), path.join(docsDir, doc));
    }
    this.log(`  [ok] docs/ (${docs.length} files)`);
  }

  private generateSettings(): void {
    this.log("\nConfig:");
    const settings = JSON.parse(JSON.stringify(SETTINGS_TEMPLATE));
    settings.permissions.allow = [...this.merged.permissions.allow];
    settings.permissions.deny = [...this.merged.permissions.deny];
    settings.hooks = defaultHooks(this.target);
    if (this.hasStatusline) {
      settings.statusLine = {
        type: "command",
        command: statuslineCommand(this.target),
      };
    }
    // First declared style wins — core's is listed first, so an addon profile
    // can ship extra styles without silently hijacking the active one.
    const activeStyle = this.merged.output_styles[0];
    if (activeStyle) {
      settings.outputStyle = activeStyle;
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
  // Every backup install() made: .claude.bak and the dated ones after it.
  for (const name of fs.readdirSync(target)) {
    if (name === ".claude.bak" || name.startsWith(".claude.bak-")) {
      fs.rmSync(path.join(target, name), { recursive: true, force: true });
    }
  }
  console.log(`\n  [ok] Removed .claude/ from ${target}`);
}
