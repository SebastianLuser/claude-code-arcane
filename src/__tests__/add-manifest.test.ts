import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import type { ArcaneManifest } from "../types.js";

/**
 * `add` used to persist through writeManifest(), which rebuilds the file from a
 * MergedProfile and keeps nothing that is not in one. So adding a single skill erased
 * `content_hashes` - the record of what Arcane installed and what it looked like.
 *
 * Two things broke downstream, both silent. The added skill was absent from the record,
 * so `update` read it as somebody else's and stopped maintaining it; and every locally
 * edited skill lost skip-customized, which needs a manifest hash to tell "you changed
 * this" from "the source changed this".
 */

const REPO_ROOT = getPackageRoot();

describe("add keeps the manifest whole", () => {
  let tmpDir: string;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-add-manifest-"));
    const merged = mergeProfiles(path.join(REPO_ROOT, "profiles"), ["testing"]);
    new Installer(merged, { target: tmpDir, dryRun: false, force: false }).run("testing");
    process.chdir(tmpDir);
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.chdir(originalCwd);
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  function manifest(): ArcaneManifest {
    return JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".claude", "arcane-manifest.json"), "utf-8"),
    );
  }

  it("should keep content_hashes when a skill is added", async () => {
    // Arrange
    const before = manifest();
    expect(Object.keys(before.content_hashes!.skills).length).toBeGreaterThan(0);

    // Act
    const { addCommand } = await import("../commands/add.js");
    await addCommand(["api-design"]);

    // Assert
    const after = manifest();
    expect(after.content_hashes).toBeDefined();
    for (const skill of Object.keys(before.content_hashes!.skills)) {
      expect(after.content_hashes!.skills[skill]).toBe(before.content_hashes!.skills[skill]);
    }
  });

  it("should record the added skill so update keeps maintaining it", async () => {
    // Arrange + Act
    const { addCommand } = await import("../commands/add.js");
    await addCommand(["api-design"]);

    // Assert
    const after = manifest();
    expect(after.installed_skills).toContain("api-design");
    expect(after.content_hashes!.skills).toHaveProperty("api-design");
  });

  it("should not claim a hand-written skill sitting in the same directory", async () => {
    // Arrange: recomputing the whole tree would sweep this in, and `update` deletes what
    // the manifest claims.
    const local = path.join(tmpDir, ".claude", "skills", "mi-skill-local");
    fs.mkdirSync(local, { recursive: true });
    fs.writeFileSync(path.join(local, "SKILL.md"), "---\nname: mi-skill-local\n---\n");

    // Act
    const { addCommand } = await import("../commands/add.js");
    await addCommand(["api-design"]);

    // Assert
    expect(manifest().content_hashes!.skills).not.toHaveProperty("mi-skill-local");
  });

  it("should leave the fields it does not own alone", async () => {
    // Arrange
    const before = manifest();

    // Act
    const { addCommand } = await import("../commands/add.js");
    await addCommand(["api-design"]);

    // Assert
    const after = manifest();
    expect(after.installed_at).toBe(before.installed_at);
    expect(after.source_version).toBe(before.source_version);
    expect(after.profile_command).toBe(before.profile_command);
  });
});
