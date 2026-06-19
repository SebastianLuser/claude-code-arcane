import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot, getPackageVersion } from "../utils.js";
import type { ArcaneManifest } from "../types.js";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-update-test-"));
}

const REPO_ROOT = getPackageRoot();

function installTestingProfile(tmpDir: string) {
  const profilesDir = path.join(REPO_ROOT, "profiles");
  const merged = mergeProfiles(profilesDir, ["testing"]);

  const installer = new Installer(merged, {
    target: tmpDir,
    dryRun: false,
    force: false,
  });
  installer.run("testing");
  return merged;
}

describe("updateTarget", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("should report no installation found when no manifest exists", async () => {
    // Arrange
    tmpDir = makeTmpDir();

    // Act
    const { updateTarget } = await import("../commands/update.js");
    const result = await updateTarget(tmpDir, {});

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("No Arcane installation found");
    expect(result.status).toBe("no-manifest");
  });

  it("should report already up to date when version matches", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    const result = await updateTarget(tmpDir, {});

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("up to date");
    expect(result.status).toBe("up-to-date");
  });

  it("should be silent in quiet mode when up to date", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);
    logSpy.mockClear();

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, { quiet: true });

    // Assert
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("should detect changes when manifest version differs", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    const manifestPath = path.join(tmpDir, ".claude", "arcane-manifest.json");
    const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    manifest.source_version = "0.0.1";
    manifest.arcane_version = "0.0.1";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, { dryRun: true });

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("0.0.1");
    expect(output).toContain(getPackageVersion());
  });

  it("should force update even when version matches", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    const result = await updateTarget(tmpDir, { force: true });

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("Updated to");
    expect(result.status).toBe("updated");
  });

  it("should detect locally modified skills and skip them", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    const manifestPath = path.join(tmpDir, ".claude", "arcane-manifest.json");
    const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    manifest.source_version = "0.0.1";
    manifest.arcane_version = "0.0.1";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    const skillsDir = path.join(tmpDir, ".claude", "skills");
    const skillDirs = fs.readdirSync(skillsDir);
    if (skillDirs.length > 0) {
      const skillMd = path.join(skillsDir, skillDirs[0], "SKILL.md");
      if (fs.existsSync(skillMd)) {
        fs.writeFileSync(skillMd, "# Customized by user\n");
      }
    }

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, { dryRun: true });

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("customized");
  });

  it("should write content_hashes to manifest after install", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    // Act
    const manifestPath = path.join(tmpDir, ".claude", "arcane-manifest.json");
    const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    // Assert
    expect(manifest.content_hashes).toBeDefined();
    expect(manifest.content_hashes!.skills).toBeDefined();
    expect(manifest.content_hashes!.rules).toBeDefined();
    expect(Object.keys(manifest.content_hashes!.skills).length).toBeGreaterThan(0);
  });
});
