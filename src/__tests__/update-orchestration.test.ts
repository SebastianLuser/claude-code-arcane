import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import type { ArcaneManifest } from "../types.js";

const REPO_ROOT = getPackageRoot();

function makeTmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function installTestingProfile(tmpDir: string): void {
  const profilesDir = path.join(REPO_ROOT, "profiles");
  const merged = mergeProfiles(profilesDir, ["testing"]);
  const installer = new Installer(merged, { target: tmpDir, dryRun: false, force: false });
  installer.run("testing");
}

function downgradeManifest(tmpDir: string): void {
  const manifestPath = path.join(tmpDir, ".claude", "arcane-manifest.json");
  const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  manifest.source_version = "0.0.1";
  manifest.arcane_version = "0.0.1";
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

describe("updateCommand (general orchestration)", () => {
  let homeDir: string;
  let originalArcaneHome: string | undefined;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  const cleanup: string[] = [];

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    originalArcaneHome = process.env.ARCANE_HOME;
    originalCwd = process.cwd();
    homeDir = makeTmpDir("arcane-home-");
    process.env.ARCANE_HOME = homeDir;
    cleanup.push(homeDir);
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.chdir(originalCwd);
    if (originalArcaneHome === undefined) {
      delete process.env.ARCANE_HOME;
    } else {
      process.env.ARCANE_HOME = originalArcaneHome;
    }
    for (const dir of cleanup) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      }
    }
    cleanup.length = 0;
  });

  it("should report no installations when registry is empty and cwd has none", async () => {
    // Arrange
    const empty = makeTmpDir("arcane-empty-");
    cleanup.push(empty);
    process.chdir(empty);

    // Act
    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({});

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("No Arcane installations found");
  });

  it("should process all registered targets in dry-run without applying", async () => {
    // Arrange
    const repoA = makeTmpDir("arcane-a-");
    const repoB = makeTmpDir("arcane-b-");
    cleanup.push(repoA, repoB);
    installTestingProfile(repoA);
    installTestingProfile(repoB);
    downgradeManifest(repoA);
    downgradeManifest(repoB);

    const { registerInstallation } = await import("../registry.js");
    registerInstallation(repoA);
    registerInstallation(repoB);

    const elsewhere = makeTmpDir("arcane-cwd-");
    cleanup.push(elsewhere);
    process.chdir(elsewhere);

    // Act
    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ dryRun: true });

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain(repoA);
    expect(output).toContain(repoB);
    expect(output).toContain("2 installations processed");
    // Dry-run must not bump the manifest version.
    const manifestA = JSON.parse(
      fs.readFileSync(path.join(repoA, ".claude", "arcane-manifest.json"), "utf-8"),
    ) as ArcaneManifest;
    expect(manifestA.source_version).toBe("0.0.1");
  });

  it("should seed the current repo into the registry when it has a manifest", async () => {
    // Arrange
    const repo = makeTmpDir("arcane-seed-");
    cleanup.push(repo);
    installTestingProfile(repo);
    process.chdir(repo);

    // Act
    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ dryRun: true });

    // Assert
    const { readRegistry } = await import("../registry.js");
    expect(readRegistry().map((e) => e.path)).toContain(path.resolve(repo));
  });

  it("should update only the current repo with --here", async () => {
    // Arrange
    const here = makeTmpDir("arcane-here-");
    const other = makeTmpDir("arcane-other-");
    cleanup.push(here, other);
    installTestingProfile(here);
    installTestingProfile(other);
    const { registerInstallation } = await import("../registry.js");
    registerInstallation(other);
    process.chdir(here);

    // Act
    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ here: true });

    // Assert — only the current repo is mentioned, not the other registered one.
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("up to date");
    expect(output).not.toContain(other);
  });
});
