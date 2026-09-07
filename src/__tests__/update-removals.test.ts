import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import type { ArcaneManifest } from "../types.js";

/**
 * Three failures, one cause: the update plan asked "is this in the source?" and
 * deleted everything that was not.
 *
 *   1. Hand-written skills. Verified loss - a 1.4.0 -> 2.8.0 update wiped two of
 *      them (~20 KB each) out of a real project, with no backup: the .bak path
 *      only ever covered conflicts.
 *   2. `skills/_templates/`, which the installer itself writes from
 *      templates/gamedev/ and computeSourceHashes() never models.
 *   3. The division behind a granular `agents:` entry (`product/ux-lead`), which
 *      resolves as a file, not a directory, so it produced no source hash - the
 *      update deleted an agent the active profile explicitly asks for, and `add`
 *      could not bring it back for want of the same hash.
 *
 * Each case gets a test because each was invisible: the dry-run printed the
 * removals and they read like cleanup.
 */

const REPO_ROOT = getPackageRoot();

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-removals-test-"));
}

function install(tmpDir: string, profile: string): void {
  const merged = mergeProfiles(path.join(REPO_ROOT, "profiles"), profile.split("+"));
  new Installer(merged, { target: tmpDir, dryRun: false, force: false }).run(profile);
}

function readManifest(tmpDir: string): ArcaneManifest {
  return JSON.parse(
    fs.readFileSync(path.join(tmpDir, ".claude", "arcane-manifest.json"), "utf-8"),
  );
}

function writeManifest(tmpDir: string, manifest: ArcaneManifest): void {
  fs.writeFileSync(
    path.join(tmpDir, ".claude", "arcane-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}

/** An install the current version has something to update. */
function stampOldVersion(tmpDir: string): void {
  const manifest = readManifest(tmpDir);
  manifest.source_version = "0.0.1";
  manifest.arcane_version = "0.0.1";
  writeManifest(tmpDir, manifest);
}

function writeLocalSkill(tmpDir: string, name: string): string {
  const dir = path.join(tmpDir, ".claude", "skills", name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "SKILL.md"),
    `---\nname: ${name}\ndescription: hand-written, never shipped by Arcane\n---\n\nlocal content\n`,
  );
  return dir;
}

describe("update never deletes what Arcane did not install", () => {
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

  function output(): string {
    return logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
  }

  it("should keep a hand-written skill and report it as foreign", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    const local = writeLocalSkill(tmpDir, "mi-skill-local");
    stampOldVersion(tmpDir);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Assert
    expect(fs.existsSync(path.join(local, "SKILL.md"))).toBe(true);
    expect(output()).toContain("Left alone");
  });

  it("should not claim the hand-written skill in the manifest it writes", async () => {
    // Arrange: the first update has to survive its own bookkeeping. Recording the
    // whole tree as content_hashes makes the *next* run read the local skill as
    // Arcane's own and delete it.
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    const local = writeLocalSkill(tmpDir, "mi-skill-local");
    stampOldVersion(tmpDir);
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Act
    stampOldVersion(tmpDir);
    await updateTarget(tmpDir, {});

    // Assert
    expect(readManifest(tmpDir).content_hashes?.skills).not.toHaveProperty("mi-skill-local");
    expect(fs.existsSync(path.join(local, "SKILL.md"))).toBe(true);
  });

  it("should keep the gamedev templates the installer wrote itself", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    install(tmpDir, "unity-design");
    const templates = path.join(tmpDir, ".claude", "skills", "_templates");
    expect(fs.existsSync(templates), "installer should have written _templates/").toBe(true);
    const before = fs.readdirSync(templates).length;
    stampOldVersion(tmpDir);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Assert
    expect(fs.existsSync(templates)).toBe(true);
    expect(fs.readdirSync(templates).length).toBe(before);
  });

  it("should keep an agent installed through a granular entry", async () => {
    // Arrange: unity-design ships `agents: [game, product/ux-lead]`.
    tmpDir = makeTmpDir();
    install(tmpDir, "unity-design");
    const agent = path.join(tmpDir, ".claude", "agents", "product", "ux-lead.md");
    expect(fs.existsSync(agent), "installer should have written the granular agent").toBe(true);
    stampOldVersion(tmpDir);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Assert
    expect(fs.existsSync(agent)).toBe(true);
  });
});

describe("update quarantines what it does remove", () => {
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

  it("should move a dropped skill to .arcane-trash instead of deleting it", async () => {
    // Arrange: a skill Arcane installed (it is in content_hashes) that the source no
    // longer ships - the legitimate removal case. Claiming it in the manifest is what
    // separates it from the hand-written one above.
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    writeLocalSkill(tmpDir, "dropped-skill");
    const manifest = readManifest(tmpDir);
    manifest.content_hashes!.skills["dropped-skill"] = "stale-hash-from-a-past-version";
    manifest.source_version = "0.0.1";
    manifest.arcane_version = "0.0.1";
    writeManifest(tmpDir, manifest);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Assert
    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", "dropped-skill"))).toBe(false);
    expect(
      fs.existsSync(
        path.join(tmpDir, ".claude", ".arcane-trash", "skills", "dropped-skill", "SKILL.md"),
      ),
    ).toBe(true);
  });

  it("should quarantine the old copy on a conflict too, not leave a .bak beside it", async () => {
    // Arrange: a skill that diverged from both the manifest and the source - the
    // conflict case. `skills/<name>.bak/` still holds a SKILL.md, so backing up in
    // place left the replaced copy loading under the same `name:` as the new one.
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    const manifest = readManifest(tmpDir);
    const [name] = Object.keys(manifest.content_hashes!.skills);
    fs.writeFileSync(
      path.join(tmpDir, ".claude", "skills", name, "SKILL.md"),
      "# edited locally\n",
    );
    manifest.content_hashes!.skills[name] = "a-hash-from-neither-side";
    manifest.source_version = "0.0.1";
    manifest.arcane_version = "0.0.1";
    writeManifest(tmpDir, manifest);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Assert
    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", `${name}.bak`))).toBe(false);
    expect(
      fs.readFileSync(
        path.join(tmpDir, ".claude", ".arcane-trash", "skills", name, "SKILL.md"),
        "utf-8",
      ),
    ).toBe("# edited locally\n");
  });

  it("should keep the quarantine out of .claude/skills so it stops loading", async () => {
    // Arrange: the reason the trash is not an in-place `.bak` - `skills/foo.bak/`
    // still holds a SKILL.md, so a "removed" skill would keep loading.
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    writeLocalSkill(tmpDir, "dropped-skill");
    const manifest = readManifest(tmpDir);
    manifest.content_hashes!.skills["dropped-skill"] = "stale-hash-from-a-past-version";
    manifest.source_version = "0.0.1";
    manifest.arcane_version = "0.0.1";
    writeManifest(tmpDir, manifest);

    // Act
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    // Assert
    const skillDirs = fs.readdirSync(path.join(tmpDir, ".claude", "skills"));
    expect(skillDirs.filter((d) => d.startsWith("dropped-skill"))).toEqual([]);
  });
});

describe("a customization stays customized", () => {
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

  /**
   * skip-customized protected an edited file for exactly one update. The run that
   * skipped it then recorded its current bytes as the manifest hash - saying "this is
   * what Arcane installed" about the user's own edit - so the next run compared a
   * manifest that matched the disk against a source that did not, read that as "the
   * source moved on", and overwrote it. Without a backup: only conflicts get one.
   */
  it("should still be skipped on the update after the one that skipped it", async () => {
    // Arrange: settle the hashes the way a released install has them, then edit a rule.
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, { source: "bundled", force: true, quiet: true });

    const rule = path.join(tmpDir, ".claude", "rules", "test-standards.md");
    const mine = "# my own test standards\n";
    fs.writeFileSync(rule, mine);

    // Act: two updates in a row, each seeing a version it does not have.
    stampOldVersion(tmpDir);
    await updateTarget(tmpDir, {});
    const afterFirst = fs.readFileSync(rule, "utf-8");
    stampOldVersion(tmpDir);
    await updateTarget(tmpDir, {});

    // Assert
    expect(afterFirst).toBe(mine);
    expect(fs.readFileSync(rule, "utf-8")).toBe(mine);
  });

  it("should record the hash it shipped, not the one on disk", async () => {
    // Arrange
    tmpDir = makeTmpDir();
    install(tmpDir, "testing");
    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, { source: "bundled", force: true, quiet: true });
    const shipped = readManifest(tmpDir).content_hashes!.rules["test-standards.md"];

    // Act
    fs.writeFileSync(path.join(tmpDir, ".claude", "rules", "test-standards.md"), "# mine\n");
    stampOldVersion(tmpDir);
    await updateTarget(tmpDir, {});

    // Assert
    expect(readManifest(tmpDir).content_hashes!.rules["test-standards.md"]).toBe(shipped);
  });
});
