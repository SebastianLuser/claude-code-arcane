import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";

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

describe("registry", () => {
  let homeDir: string;
  let originalArcaneHome: string | undefined;
  const cleanup: string[] = [];

  beforeEach(() => {
    originalArcaneHome = process.env.ARCANE_HOME;
    homeDir = makeTmpDir("arcane-home-");
    process.env.ARCANE_HOME = homeDir;
    cleanup.push(homeDir);
  });

  afterEach(() => {
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

  it("should write the registry under ARCANE_HOME when registering", async () => {
    // Arrange
    const repo = makeTmpDir("arcane-repo-");
    cleanup.push(repo);
    const { registerInstallation, readRegistry } = await import("../registry.js");

    // Act
    registerInstallation(repo);

    // Assert
    expect(fs.existsSync(path.join(homeDir, "installations.json"))).toBe(true);
    const entries = readRegistry();
    expect(entries.map((e) => e.path)).toContain(path.resolve(repo));
  });

  it("should create the registry dir when ARCANE_HOME does not exist yet", async () => {
    // Arrange — point ARCANE_HOME at a not-yet-created subdirectory.
    const freshHome = path.join(homeDir, "nested", "arcane");
    process.env.ARCANE_HOME = freshHome;
    const repo = makeTmpDir("arcane-repo-");
    cleanup.push(repo);
    const { registerInstallation, readRegistry } = await import("../registry.js");

    // Act
    registerInstallation(repo);

    // Assert
    expect(fs.existsSync(path.join(freshHome, "installations.json"))).toBe(true);
    expect(readRegistry().map((e) => e.path)).toContain(path.resolve(repo));
  });

  it("should not create duplicate entries for the same path", async () => {
    // Arrange
    const repo = makeTmpDir("arcane-repo-");
    cleanup.push(repo);
    const { registerInstallation, readRegistry } = await import("../registry.js");

    // Act
    registerInstallation(repo);
    registerInstallation(repo);

    // Assert
    const matching = readRegistry().filter((e) => e.path === path.resolve(repo));
    expect(matching).toHaveLength(1);
  });

  it("should drop paths without a manifest when pruning", async () => {
    // Arrange
    const live = makeTmpDir("arcane-live-");
    const dead = makeTmpDir("arcane-dead-");
    cleanup.push(live);
    installTestingProfile(live);
    const { registerInstallation, pruneRegistry } = await import("../registry.js");
    registerInstallation(live);
    registerInstallation(dead);
    fs.rmSync(dead, { recursive: true, force: true });

    // Act
    const survivors = pruneRegistry();

    // Assert
    const paths = survivors.map((e) => e.path);
    expect(paths).toContain(path.resolve(live));
    expect(paths).not.toContain(path.resolve(dead));
  });
});
