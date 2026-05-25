import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { mergeProfiles } from "../profiles.js";
import { readManifest } from "../manifest.js";
import type { MergedProfile } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-cmdfn-test-"));
}

function installProfile(target: string, profile = "testing"): MergedProfile {
  const merged = mergeProfiles(PROFILES_DIR, [profile]);
  const installer = new Installer(merged, {
    target,
    dryRun: false,
    force: false,
  });
  installer.run(profile);
  return merged;
}

describe("statusCommand", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should print no-installation message when no manifest exists", async () => {
    const { statusCommand } = await import("../commands/status.js");
    await statusCommand();

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("No Arcane installation found");
  });

  it("should display profile and skill info when manifest exists", async () => {
    installProfile(tmpDir);
    const { statusCommand } = await import("../commands/status.js");
    await statusCommand();

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Arcane Status");
  });

  it("should display worktree info when manifest has worktree data", async () => {
    installProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;
    manifest.worktree = {
      is_worktree: true,
      main_worktree: "/main/repo",
      shared_dirs: ["hooks", "docs"],
    };
    const mp = path.join(tmpDir, ".claude", "arcane-manifest.json");
    fs.writeFileSync(mp, JSON.stringify(manifest, null, 2));

    const { statusCommand } = await import("../commands/status.js");
    await statusCommand();

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Worktree");
    expect(output).toContain("Shared");
  });
});

describe("cleanCommand", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should print no-installation message when no manifest exists", async () => {
    const { cleanCommand } = await import("../commands/clean.js");
    await cleanCommand({});

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("No Arcane installation found");
  });

  it("should prompt for --force when manifest exists but force not passed", async () => {
    installProfile(tmpDir);
    const { cleanCommand } = await import("../commands/clean.js");
    await cleanCommand({});

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("--force");
    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(true);
  });

  it("should remove .claude/ when --force is passed", async () => {
    installProfile(tmpDir);
    const { cleanCommand } = await import("../commands/clean.js");
    await cleanCommand({ force: true });

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(false);
  });
});

describe("listCommand", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should list available profiles and skills", async () => {
    const { listCommand } = await import("../commands/list.js");
    await listCommand();

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Available Profiles");
    expect(output).toContain("Skills");
  });

  it("should show installed tags when manifest exists", async () => {
    installProfile(tmpDir);
    const { listCommand } = await import("../commands/list.js");
    await listCommand();

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("installed");
  });
});

describe("installCommand", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should show available profiles when no profile expression is given", async () => {
    const { installCommand } = await import("../commands/install.js");
    await installCommand(undefined, { target: tmpDir });

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Available profiles");
  });

  it("should install a profile to the target directory", async () => {
    const { installCommand } = await import("../commands/install.js");
    await installCommand("testing", { target: tmpDir });

    expect(fs.existsSync(path.join(tmpDir, ".claude"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".claude", "arcane-manifest.json"))).toBe(true);

    const manifest = readManifest(tmpDir);
    expect(manifest).not.toBeNull();
    expect(manifest!.profiles).toContain("testing");
  });

  it("should respect dry-run flag", async () => {
    const { installCommand } = await import("../commands/install.js");
    await installCommand("testing", { target: tmpDir, dryRun: true });

    expect(fs.existsSync(path.join(tmpDir, ".claude", "arcane-manifest.json"))).toBe(false);
  });
});

describe("addCommand", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should exit with error when no manifest exists", async () => {
    const { addCommand } = await import("../commands/add.js");
    await expect(addCommand(["some-skill"])).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should add a skill that is not yet installed", async () => {
    installProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;
    const skillsDir = path.join(REPO_ROOT, "skills");
    const allSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name);
    const notInstalled = allSkills.find((s) => !manifest.installed_skills.includes(s));

    if (!notInstalled) return;

    const { addCommand } = await import("../commands/add.js");
    await addCommand([notInstalled]);

    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", notInstalled))).toBe(true);
    const updated = readManifest(tmpDir)!;
    expect(updated.installed_skills).toContain(notInstalled);
  });

  it("should skip a skill that is already installed", async () => {
    installProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;
    const alreadyInstalled = manifest.installed_skills[0];
    const originalCount = manifest.total_skills;

    const { addCommand } = await import("../commands/add.js");
    await addCommand([alreadyInstalled]);

    const updated = readManifest(tmpDir)!;
    expect(updated.total_skills).toBe(originalCount);
  });

  it("should add skills from a profile when +profile is used", async () => {
    const coreMerged = mergeProfiles(
      path.join(path.resolve(__dirname, "..", ".."), "profiles"),
      [],
    );
    const coreInstaller = new Installer(coreMerged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    coreInstaller.run("core");

    const before = readManifest(tmpDir)!;
    const beforeCount = before.installed_skills.length;

    const { addCommand } = await import("../commands/add.js");
    await addCommand(["+testing"]);

    const updated = readManifest(tmpDir)!;
    expect(updated.profiles).toContain("testing");
    expect(updated.installed_skills.length).toBeGreaterThan(beforeCount);
  });

  it("should handle nonexistent skill gracefully", async () => {
    installProfile(tmpDir);
    const { addCommand } = await import("../commands/add.js");
    await addCommand(["nonexistent-skill-xyz"]);

    const output = [
      ...logSpy.mock.calls.map((c: unknown[]) => String(c[0])),
      ...errorSpy.mock.calls.map((c: unknown[]) => String(c[0])),
    ].join("\n");
    expect(output).toContain("not found");
  });
});

describe("removeCommand", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    exitSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should exit with error when no manifest exists", async () => {
    const { removeCommand } = await import("../commands/remove.js");
    await expect(removeCommand(["some-skill"])).rejects.toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("should remove a non-core skill", async () => {
    installProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;
    const coreSkills = new Set([
      "commit", "create-pr", "changelog", "check", "code-review",
      "context-prime", "help", "start", "fix-issue", "hotfix",
      "brainstorm", "scope-check", "reverse-document", "skill-improve",
      "skill-test", "tech-debt", "arcane-status", "arcane-list",
      "arcane-add", "arcane-remove", "arcane-clean",
    ]);
    const removable = manifest.installed_skills.find((s) => !coreSkills.has(s));
    if (!removable) return;

    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand([removable]);

    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", removable))).toBe(false);
    const updated = readManifest(tmpDir)!;
    expect(updated.installed_skills).not.toContain(removable);
  });

  it("should skip removing a core skill", async () => {
    installProfile(tmpDir);
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["commit"]);

    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", "commit"))).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should prevent removing core profile", async () => {
    installProfile(tmpDir);
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+core"]);

    const updated = readManifest(tmpDir)!;
    expect(updated.profiles).toContain("core");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should remove a profile and its exclusive skills", async () => {
    installProfile(tmpDir);
    const manifest = readManifest(tmpDir)!;
    expect(manifest.profiles).toContain("testing");

    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+testing"]);

    const updated = readManifest(tmpDir)!;
    expect(updated.profiles).not.toContain("testing");
    expect(updated.profiles).toContain("core");
  });

  it("should warn when removing a profile that is not installed", async () => {
    installProfile(tmpDir);
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+nonexistent-profile"]);

    expect(warnSpy).toHaveBeenCalled();
    const output = warnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("not installed");
  });

  it("should remove profile-exclusive agents and rules", async () => {
    const merged = mergeProfiles(PROFILES_DIR, ["unity-dev"]);
    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("unity-dev");

    const before = readManifest(tmpDir)!;
    expect(before.profiles).toContain("unity-dev");
    expect(before.installed_rules.length).toBeGreaterThan(0);

    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+unity-dev"]);

    const updated = readManifest(tmpDir)!;
    expect(updated.profiles).not.toContain("unity-dev");
    expect(updated.profiles).toContain("core");
    expect(updated.installed_rules.length).toBeLessThan(
      before.installed_rules.length,
    );
  });

  it("should skip removing a skill that does not exist on disk", async () => {
    installProfile(tmpDir);
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["some-nonexistent-skill"]);

    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("[skip]");
  });
});

describe("updateCommand", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should not throw in quiet mode even if npm is unavailable", async () => {
    const { updateCommand } = await import("../commands/update.js");
    await expect(updateCommand({ quiet: true })).resolves.not.toThrow();
  });
});
