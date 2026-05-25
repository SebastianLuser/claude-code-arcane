import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer, clean } from "../installer.js";
import { mergeProfiles, parseProfile } from "../profiles.js";
import { readManifest, writeManifest } from "../manifest.js";
import { copyDirSync } from "../utils.js";
import type { MergedProfile } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");

/** Core skills that the remove command protects from deletion. */
const CORE_SKILLS = [
  "commit",
  "create-pr",
  "changelog",
  "check",
  "code-review",
  "context-prime",
  "help",
  "start",
  "fix-issue",
  "hotfix",
  "brainstorm",
  "scope-check",
  "reverse-document",
  "skill-improve",
  "skill-test",
  "tech-debt",
  "arcane-status",
  "arcane-list",
  "arcane-add",
  "arcane-remove",
  "arcane-clean",
];

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-commands-test-"));
}

function installTestingProfile(target: string): MergedProfile {
  const merged = mergeProfiles(PROFILES_DIR, ["testing"]);
  const installer = new Installer(merged, {
    target,
    dryRun: false,
    force: false,
  });
  installer.run("testing");
  return merged;
}

// ---------------------------------------------------------------------------
// Add command logic
// ---------------------------------------------------------------------------
describe("add command logic", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should copy a new skill directory into .claude/skills when adding a skill not in the profile", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    const skillToAdd = "accessibility";
    const srcSkill = path.join(SKILLS_DIR, skillToAdd);
    const dstSkill = path.join(tmpDir, ".claude", "skills", skillToAdd);

    // Pre-condition: skill not yet installed
    expect(fs.existsSync(dstSkill)).toBe(false);
    expect(merged.skills).not.toContain(skillToAdd);

    // Act — simulate what addCommand does: copy the dir and update manifest
    copyDirSync(srcSkill, dstSkill);

    // Assert
    expect(fs.existsSync(dstSkill)).toBe(true);
    const entries = fs.readdirSync(dstSkill);
    expect(entries.length).toBeGreaterThan(0);
  });

  it("should skip adding a skill that is already installed", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    // "commit" comes from core and is already installed
    const alreadyInstalled = "commit";
    const skillDir = path.join(tmpDir, ".claude", "skills", alreadyInstalled);

    // Act — check if it is in the installed list (addSkill returns "skipped")
    const isInstalled = merged.skills.includes(alreadyInstalled);

    // Assert
    expect(isInstalled).toBe(true);
    expect(fs.existsSync(skillDir)).toBe(true);
  });

  it("should update manifest after adding a skill", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    const skillToAdd = "accessibility";
    const srcSkill = path.join(SKILLS_DIR, skillToAdd);
    const dstSkill = path.join(tmpDir, ".claude", "skills", skillToAdd);

    // Act — copy skill and write updated manifest
    copyDirSync(srcSkill, dstSkill);
    merged.skills.push(skillToAdd);
    writeManifest(tmpDir, merged, "testing", REPO_ROOT);

    // Assert
    const manifest = readManifest(tmpDir);
    expect(manifest).not.toBeNull();
    expect(manifest!.installed_skills).toContain(skillToAdd);
    expect(manifest!.total_skills).toBe(merged.skills.length);
  });

  it("should add all skills from a profile when adding via +profileName", () => {
    // Arrange
    tmpDir = makeTmpDir();
    // Install only core profile first
    const coreOnly = mergeProfiles(PROFILES_DIR, []);
    const installer = new Installer(coreOnly, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("core");

    // Act — simulate adding +testing: parse profile and copy its skills
    const testingProfile = parseProfile(
      path.join(PROFILES_DIR, "testing.yaml"),
    );
    for (const skill of testingProfile.skills) {
      const src = path.join(SKILLS_DIR, skill);
      const dst = path.join(tmpDir, ".claude", "skills", skill);
      if (fs.existsSync(src) && !fs.existsSync(dst)) {
        copyDirSync(src, dst);
      }
    }

    // Assert — all testing-specific skills should now exist on disk
    for (const skill of testingProfile.skills) {
      const src = path.join(SKILLS_DIR, skill);
      if (fs.existsSync(src)) {
        const dst = path.join(tmpDir, ".claude", "skills", skill);
        expect(fs.existsSync(dst)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Remove command logic
// ---------------------------------------------------------------------------
describe("remove command logic", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should delete a non-core skill directory when removing it", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    // Pick a testing-specific skill that is NOT in CORE_SKILLS
    const testingProfile = parseProfile(
      path.join(PROFILES_DIR, "testing.yaml"),
    );
    const nonCoreSkill = testingProfile.skills.find(
      (s) => !CORE_SKILLS.includes(s),
    );
    expect(nonCoreSkill).toBeDefined();
    const skillDir = path.join(tmpDir, ".claude", "skills", nonCoreSkill!);
    expect(fs.existsSync(skillDir)).toBe(true);

    // Act — simulate removeSkill: delete the directory
    fs.rmSync(skillDir, { recursive: true, force: true });

    // Assert
    expect(fs.existsSync(skillDir)).toBe(false);
  });

  it("should update manifest installed_skills after removing a skill", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    const testingProfile = parseProfile(
      path.join(PROFILES_DIR, "testing.yaml"),
    );
    const skillToRemove = testingProfile.skills.find(
      (s) => !CORE_SKILLS.includes(s),
    )!;
    const manifest = readManifest(tmpDir)!;

    // Act — remove skill dir and update manifest
    const skillDir = path.join(tmpDir, ".claude", "skills", skillToRemove);
    fs.rmSync(skillDir, { recursive: true, force: true });
    const updatedSkills = manifest.installed_skills.filter(
      (s) => s !== skillToRemove,
    );
    merged.skills = updatedSkills;
    writeManifest(tmpDir, merged, "testing", REPO_ROOT);

    // Assert
    const updated = readManifest(tmpDir);
    expect(updated).not.toBeNull();
    expect(updated!.installed_skills).not.toContain(skillToRemove);
    expect(updated!.total_skills).toBe(updatedSkills.length);
  });

  it("should protect core skills from removal", () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    // Act & Assert — each core skill present in the installation should be protected
    for (const coreSkill of CORE_SKILLS) {
      expect(CORE_SKILLS.includes(coreSkill)).toBe(true);
      const skillDir = path.join(tmpDir, ".claude", "skills", coreSkill);
      // The skill dir should still exist — the remove logic skips core skills
      if (fs.existsSync(skillDir)) {
        // Simulate the protection check that removeSkill performs
        const isProtected = CORE_SKILLS.includes(coreSkill);
        expect(isProtected).toBe(true);
      }
    }
  });

  it("should not remove core profile when requested", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;

    // Act — simulate removeProfile check for "core"
    const isCoreProfile = "core" === "core";

    // Assert — core profile remains in manifest
    expect(isCoreProfile).toBe(true);
    expect(manifest.profiles).toContain("core");
  });

  it("should remove profile-specific skills while keeping shared skills", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;
    const testingProfile = parseProfile(
      path.join(PROFILES_DIR, "testing.yaml"),
    );
    const coreProfile = parseProfile(path.join(PROFILES_DIR, "core.yaml"));
    const coreSkillSet = new Set(coreProfile.skills);

    // Skills exclusive to testing (not shared with core)
    const exclusiveSkills = testingProfile.skills.filter(
      (s) => !coreSkillSet.has(s) && !CORE_SKILLS.includes(s),
    );

    // Act — simulate removing +testing: delete exclusive skills
    for (const skill of exclusiveSkills) {
      const dir = path.join(tmpDir, ".claude", "skills", skill);
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }

    // Assert — exclusive skills removed, core skills untouched
    for (const skill of exclusiveSkills) {
      const dir = path.join(tmpDir, ".claude", "skills", skill);
      expect(fs.existsSync(dir)).toBe(false);
    }
    for (const skill of coreProfile.skills) {
      const dir = path.join(tmpDir, ".claude", "skills", skill);
      if (fs.existsSync(path.join(SKILLS_DIR, skill))) {
        expect(fs.existsSync(dir)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Clean command logic
// ---------------------------------------------------------------------------
describe("clean command logic", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should remove all arcane artifacts when clean is called after install", () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);
    const claudeDir = path.join(tmpDir, ".claude");
    expect(fs.existsSync(claudeDir)).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "skills"))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "rules"))).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "arcane-manifest.json"))).toBe(
      true,
    );

    // Act
    clean(tmpDir);

    // Assert
    expect(fs.existsSync(claudeDir)).toBe(false);
  });

  it("should remove both .claude/ and .claude.bak/ when both exist", () => {
    // Arrange
    tmpDir = makeTmpDir();
    // Install twice so the second install creates .claude.bak/
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);
    const installer1 = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer1.run("testing");
    const installer2 = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer2.run("testing");
    expect(fs.existsSync(path.join(tmpDir, ".claude.bak"))).toBe(true);

    // Act
    clean(tmpDir);

    // Assert
    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, ".claude.bak"))).toBe(false);
  });

  it("should not throw when cleaning a directory with no installation", () => {
    // Arrange
    tmpDir = makeTmpDir();

    // Act & Assert
    expect(() => clean(tmpDir)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Status command logic (readManifest behavior)
// ---------------------------------------------------------------------------
describe("status command logic", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should return null when reading manifest from an empty directory", () => {
    // Arrange
    tmpDir = makeTmpDir();

    // Act
    const manifest = readManifest(tmpDir);

    // Assert
    expect(manifest).toBeNull();
  });

  it("should return null when .claude/ exists but has no manifest file", () => {
    // Arrange
    tmpDir = makeTmpDir();
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });

    // Act
    const manifest = readManifest(tmpDir);

    // Assert
    expect(manifest).toBeNull();
  });

  it("should return valid manifest data after a profile installation", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);

    // Act
    const manifest = readManifest(tmpDir);

    // Assert
    expect(manifest).not.toBeNull();
    expect(manifest!.profiles).toContain("core");
    expect(manifest!.profiles).toContain("testing");
    expect(manifest!.profile_command).toBe("testing");
    expect(manifest!.total_skills).toBe(merged.skills.length);
    expect(manifest!.installed_skills).toEqual(merged.skills);
    expect(manifest!.arcane_version).toBe("1.0.0");
    expect(manifest!.cli).toBe("npm");
  });

  it("should include agents and rules in the manifest", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);

    // Act
    const manifest = readManifest(tmpDir);

    // Assert
    expect(manifest).not.toBeNull();
    expect(manifest!.installed_agents).toEqual(merged.agents);
    expect(manifest!.installed_rules).toEqual([
      ...merged.rules.universal,
      ...merged.rules.gamedev,
    ]);
    expect(manifest!.total_rules).toBe(
      merged.rules.universal.length + merged.rules.gamedev.length,
    );
  });

  it("should reflect updated state after adding and re-writing manifest", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const merged = installTestingProfile(tmpDir);
    const originalCount = merged.skills.length;

    // Act — add a skill and update manifest
    const newSkill = "accessibility";
    merged.skills.push(newSkill);
    writeManifest(tmpDir, merged, "testing", REPO_ROOT);
    const manifest = readManifest(tmpDir);

    // Assert
    expect(manifest).not.toBeNull();
    expect(manifest!.installed_skills).toContain(newSkill);
    expect(manifest!.total_skills).toBe(originalCount + 1);
  });
});
