import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { mergeProfiles } from "../profiles.js";
import { readManifest } from "../manifest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");

function makeTmpDir(): string {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "arcane-inst-extra-test-"),
  );
}

describe("Installer advanced scenarios", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    logSpy?.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("should copy gamedev templates when profile has gamedev rules", () => {
    tmpDir = makeTmpDir();
    logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const merged = mergeProfiles(PROFILES_DIR, ["unity-dev"]);

    expect(merged.rules.gamedev.length).toBeGreaterThan(0);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("unity-dev");

    const tplDir = path.join(
      tmpDir,
      ".claude",
      "skills",
      "_templates",
    );
    expect(fs.existsSync(tplDir)).toBe(true);
  });

  it("should install with worktree meta and record it in manifest", () => {
    tmpDir = makeTmpDir();
    logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing", {
      is_worktree: true,
      main_worktree: "/main/repo",
    });

    const manifest = readManifest(tmpDir);
    expect(manifest).not.toBeNull();
    expect(manifest!.worktree).toBeDefined();
    expect(manifest!.worktree!.is_worktree).toBe(true);
    expect(manifest!.worktree!.main_worktree).toBe("/main/repo");
  });

  it("should log dry-run messages for all copy operations", () => {
    tmpDir = makeTmpDir();
    logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const merged = mergeProfiles(PROFILES_DIR, ["unity-dev"]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: true,
      force: false,
    });
    const logs = installer.run("unity-dev");

    const dryRunLogs = logs.filter((l) => l.includes("[dry-run]"));
    expect(dryRunLogs.length).toBeGreaterThan(5);

    expect(
      logs.some((l) => l.includes("[dry-run]") && l.includes("hooks")),
    ).toBe(true);
    expect(
      logs.some(
        (l) => l.includes("[dry-run]") && l.includes("_templates"),
      ),
    ).toBe(true);
    expect(
      logs.some(
        (l) =>
          l.includes("[dry-run]") && l.includes("settings.json"),
      ),
    ).toBe(true);
    expect(
      logs.some(
        (l) =>
          l.includes("[dry-run]") &&
          l.includes("arcane-manifest.json"),
      ),
    ).toBe(true);
  });

  it("should use shareFrom for hooks and docs when provided", () => {
    tmpDir = makeTmpDir();
    logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});

    const shareDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "arcane-share-src-"),
    );

    try {
      const merged = mergeProfiles(PROFILES_DIR, ["testing"]);
      const installer1 = new Installer(merged, {
        target: shareDir,
        dryRun: false,
        force: false,
      });
      installer1.run("testing");

      logSpy.mockClear();

      const installer2 = new Installer(merged, {
        target: tmpDir,
        dryRun: false,
        force: false,
        shareFrom: shareDir,
      });
      const logs = installer2.run("testing");

      const sharedLog = logs.find((l) => l.includes("shared"));
      expect(sharedLog).toBeDefined();
    } finally {
      if (fs.existsSync(shareDir)) {
        fs.rmSync(shareDir, { recursive: true, force: true });
      }
    }
  });

  it("should generate statusLine config when statusline profile is loaded", () => {
    tmpDir = makeTmpDir();
    logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const merged = mergeProfiles(PROFILES_DIR, [
      "testing",
      "statusline",
    ]);

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing+statusline");

    const settingsPath = path.join(
      tmpDir,
      ".claude",
      "settings.json",
    );
    const settings = JSON.parse(
      fs.readFileSync(settingsPath, "utf-8"),
    );
    expect(settings.statusLine).toBeDefined();
    expect(settings.statusLine.command).toContain("statusline.sh");
  });

  it("should warn when a skill directory is missing", () => {
    tmpDir = makeTmpDir();
    logSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    merged.skills.push("nonexistent-skill-xyz");

    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    const logs = installer.run("testing");

    expect(
      logs.some(
        (l) =>
          l.includes("WARN") &&
          l.includes("nonexistent-skill-xyz"),
      ),
    ).toBe(true);
  });
});
