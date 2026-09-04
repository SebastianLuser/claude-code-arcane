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

  // The no-changes path used to return before writing the manifest, so an
  // install whose content already matched the source kept the old version on
  // disk forever: every later run re-announced the same update and applied
  // nothing to it. These two pin the write and its dry-run guard.
  describe("no-changes path", () => {
    function stampOldVersion(dir: string): void {
      const manifestPath = path.join(dir, ".claude", "arcane-manifest.json");
      const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      manifest.source_version = "0.0.1";
      manifest.arcane_version = "0.0.1";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    }

    function readVersion(dir: string): string | undefined {
      const manifestPath = path.join(dir, ".claude", "arcane-manifest.json");
      const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      return manifest.source_version;
    }

    // A fresh install has no content_hashes in its manifest, and resolveAction
    // reads a missing hash as "cannot tell, copy it again". So the empty plan
    // this path needs only exists after one real update has settled the
    // hashes. Stamping an old version on top of that is the exact state a
    // released install lands in.
    async function settleThenStampOld(dir: string): Promise<void> {
      const { updateTarget } = await import("../commands/update.js");
      installTestingProfile(dir);
      await updateTarget(dir, { source: "bundled", force: true, quiet: true });
      stampOldVersion(dir);
    }

    it("records the new version when the content already matches", async () => {
      // Arrange
      tmpDir = makeTmpDir();
      await settleThenStampOld(tmpDir);

      // Act
      const { updateTarget } = await import("../commands/update.js");
      const result = await updateTarget(tmpDir, { source: "bundled", quiet: true });

      // Assert
      expect(result.status).toBe("no-changes");
      expect(readVersion(tmpDir)).toBe(getPackageVersion());
    });

    it("stops announcing the update on the next run", async () => {
      // Arrange
      tmpDir = makeTmpDir();
      await settleThenStampOld(tmpDir);

      // Act
      const { updateTarget } = await import("../commands/update.js");
      await updateTarget(tmpDir, { source: "bundled", quiet: true });
      const second = await updateTarget(tmpDir, { source: "bundled", quiet: true });

      // Assert: this is the symptom the bug produced, so it is the assertion
      // that matters. Before the fix it stayed "no-changes" on every run.
      expect(second.status).toBe("up-to-date");
    });

    it("leaves the manifest alone on a dry run", async () => {
      // Arrange: the no-changes block sits above the dry-run return, so the
      // write needs its own guard. A preview that mutates is not a preview.
      tmpDir = makeTmpDir();
      await settleThenStampOld(tmpDir);

      // Act
      const { updateTarget } = await import("../commands/update.js");
      await updateTarget(tmpDir, { source: "bundled", quiet: true, dryRun: true });

      // Assert
      expect(readVersion(tmpDir)).toBe("0.0.1");
    });
  });

  it("should force update even when version matches", async () => {
    // Arrange — a locally customized skill is what --force exists to overwrite. Without
    // one there is genuinely nothing to apply, and the run correctly reports no-changes;
    // asserting "updated" on a pristine install only ever passed because a phantom
    // statusline.sh item kept the plan non-empty.
    tmpDir = makeTmpDir();
    installTestingProfile(tmpDir);

    const skillsDir = path.join(tmpDir, ".claude", "skills");
    const customized = fs
      .readdirSync(skillsDir)
      .find((d) => fs.existsSync(path.join(skillsDir, d, "SKILL.md")));
    expect(customized, "fixture needs at least one installed skill").toBeTruthy();
    const skillMd = path.join(skillsDir, customized!, "SKILL.md");
    fs.writeFileSync(skillMd, "# Customized by user\n");

    // Act
    const { updateTarget } = await import("../commands/update.js");
    const result = await updateTarget(tmpDir, { force: true });

    // Assert
    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("Updated to");
    expect(result.status).toBe("updated");
    expect(fs.readFileSync(skillMd, "utf-8")).not.toContain("Customized by user");
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
