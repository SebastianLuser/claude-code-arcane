import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer, clean } from "../installer.js";
import { mergeProfiles } from "../profiles.js";
import { readManifest } from "../manifest.js";
import type { MergedProfile } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-installer-test-"));
}

describe("Installer", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("installs a profile and creates expected structure", () => {
    tmpDir = makeTmpDir();
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    const logs = installer.run("testing");

    const claudeDir = path.join(tmpDir, ".claude");
    expect(fs.existsSync(claudeDir)).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "skills"))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "rules"))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "agents"))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "settings.json"))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "arcane-manifest.json"))).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });

  it("creates a valid manifest after install", () => {
    tmpDir = makeTmpDir();
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing");

    const manifest = readManifest(tmpDir);
    expect(manifest).not.toBeNull();
    expect(manifest!.profiles).toContain("core");
    expect(manifest!.profiles).toContain("testing");
    expect(manifest!.total_skills).toBe(merged.skills.length);
    expect(manifest!.profile_command).toBe("testing");
  });

  it("copies skills directories", () => {
    tmpDir = makeTmpDir();
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing");

    const skillsDir = path.join(tmpDir, ".claude", "skills");
    // "commit" comes from core, should be installed
    expect(fs.existsSync(path.join(skillsDir, "commit"))).toBe(true);
    expect(fs.existsSync(path.join(skillsDir, "what-next"))).toBe(true);
  });

  it("generates settings.json with permissions", () => {
    tmpDir = makeTmpDir();
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing");

    const settingsPath = path.join(tmpDir, ".claude", "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    expect(settings.permissions.allow).toEqual(merged.permissions.allow);
    expect(settings.permissions.deny).toEqual(merged.permissions.deny);
    expect(settings.hooks).toBeDefined();
  });

  it("dry-run does not create files", () => {
    tmpDir = makeTmpDir();
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: true,
      force: false,
    });
    const logs = installer.run("testing");

    expect(fs.existsSync(path.join(tmpDir, ".claude", "arcane-manifest.json"))).toBe(false);
    expect(logs.some((l) => l.includes("[dry-run]"))).toBe(true);
  });
});

describe("Installer over an existing .claude/", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  const install = () =>
    new Installer(mergeProfiles(PROFILES_DIR, ["testing"]), { target: tmpDir, dryRun: false, force: false }).run("testing");

  it("keeps the user's own files and every backup across two installs", () => {
    tmpDir = makeTmpDir();
    const claude = path.join(tmpDir, ".claude");
    fs.mkdirSync(path.join(claude, "skills", "mine"), { recursive: true });
    fs.writeFileSync(path.join(claude, "skills", "mine", "SKILL.md"), "mine");
    fs.writeFileSync(path.join(claude, "settings.local.json"), "{}");

    install();
    install();

    expect(fs.readFileSync(path.join(claude, "skills", "mine", "SKILL.md"), "utf-8")).toBe("mine");
    expect(fs.existsSync(path.join(claude, "settings.local.json"))).toBe(true);
    expect(fs.readdirSync(tmpDir).filter((n) => n.startsWith(".claude.bak")).length).toBe(2);
    // The user's skill is not recorded as Arcane's, or the next update would trash it.
    expect(readManifest(tmpDir)!.content_hashes?.skills).not.toHaveProperty("mine");
  });

  it("does not bring back a skill the old install shipped", () => {
    tmpDir = makeTmpDir();
    install();
    const manifest = readManifest(tmpDir)!;
    const shipped = manifest.installed_skills[0];
    fs.writeFileSync(
      path.join(tmpDir, ".claude", "arcane-manifest.json"),
      JSON.stringify({ ...manifest, installed_skills: [...manifest.installed_skills, "retired-skill"] }),
    );
    fs.mkdirSync(path.join(tmpDir, ".claude", "skills", "retired-skill"));

    install();

    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", "retired-skill"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", shipped))).toBe(true);
  });
});

describe("clean", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("removes .claude/ directory after install", () => {
    tmpDir = makeTmpDir();
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing");

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(true);

    clean(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(false);
  });

  it("handles already-clean directory without throwing", () => {
    tmpDir = makeTmpDir();
    expect(() => clean(tmpDir)).not.toThrow();
  });

  it("removes .claude.bak/ if present", () => {
    tmpDir = makeTmpDir();
    // First install creates .claude/
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);
    const installer1 = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer1.run("testing");

    // Second install moves .claude/ to .claude.bak/
    const installer2 = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer2.run("testing");

    expect(fs.existsSync(path.join(tmpDir, ".claude.bak"))).toBe(true);

    clean(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, ".claude.bak"))).toBe(false);
  });
});
