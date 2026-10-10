import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import type { ArcaneManifest } from "../types.js";

/**
 * docs/ was copied at install and never looked at again: a doc fixed or removed in the
 * source stayed stale in every existing project, including decks that shipped by
 * mistake. `update` now manages .claude/docs/ like the other hashed categories, under
 * the same rule: only what the manifest says Arcane installed is ever removed.
 */

const REPO_ROOT = getPackageRoot();
const DOC = "coding-standards.md";

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function install(tmpDir: string): void {
  const merged = mergeProfiles(path.join(REPO_ROOT, "profiles"), ["testing"]);
  new Installer(merged, { target: tmpDir, dryRun: false, force: false }).run("testing");
}

function manifestPath(tmpDir: string): string {
  return path.join(tmpDir, ".claude", "arcane-manifest.json");
}

function readManifest(tmpDir: string): ArcaneManifest {
  return JSON.parse(fs.readFileSync(manifestPath(tmpDir), "utf-8"));
}

function writeManifest(tmpDir: string, manifest: ArcaneManifest): void {
  fs.writeFileSync(manifestPath(tmpDir), JSON.stringify(manifest, null, 2) + "\n");
}

function stampOldVersion(tmpDir: string): void {
  const manifest = readManifest(tmpDir);
  manifest.source_version = "0.0.1";
  manifest.arcane_version = "0.0.1";
  writeManifest(tmpDir, manifest);
}

function docPath(tmpDir: string, rel: string): string {
  return path.join(tmpDir, ".claude", "docs", rel);
}

function trashPath(tmpDir: string, rel: string): string {
  return path.join(tmpDir, ".claude", ".arcane-trash", "docs", rel);
}

function writeDoc(tmpDir: string, rel: string, text: string): void {
  fs.mkdirSync(path.dirname(docPath(tmpDir, rel)), { recursive: true });
  fs.writeFileSync(docPath(tmpDir, rel), text);
}

async function update(tmpDir: string): Promise<void> {
  const { updateTarget } = await import("../commands/update.js");
  await updateTarget(tmpDir, { source: "bundled" });
}

describe("update manages .claude/docs/", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  const shipped = () => fs.readFileSync(path.join(REPO_ROOT, "docs", DOC), "utf-8");

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-docs-test-"));
    install(tmpDir);
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  it("records the installed docs in the manifest", () => {
    expect(readManifest(tmpDir).content_hashes?.docs?.[DOC]).toBe(sha256(shipped()));
  });

  it("updates a doc Arcane installed and the user never edited", async () => {
    // Arrange: an older version shipped different text, and that is what is installed.
    const older = "# old coding standards\n";
    writeDoc(tmpDir, DOC, older);
    const manifest = readManifest(tmpDir);
    manifest.content_hashes!.docs![DOC] = sha256(older);
    writeManifest(tmpDir, manifest);
    stampOldVersion(tmpDir);

    // Act
    await update(tmpDir);

    // Assert
    expect(fs.readFileSync(docPath(tmpDir, DOC), "utf-8")).toBe(shipped());
  });

  it("leaves a doc the user edited", async () => {
    writeDoc(tmpDir, DOC, "# my own standards\n");
    stampOldVersion(tmpDir);

    await update(tmpDir);

    expect(fs.readFileSync(docPath(tmpDir, DOC), "utf-8")).toBe("# my own standards\n");
  });

  it("moves a doc Arcane installed and no longer ships to the trash", async () => {
    writeDoc(tmpDir, "old-guide.md", "# retired\n");
    const manifest = readManifest(tmpDir);
    manifest.content_hashes!.docs!["old-guide.md"] = sha256("# retired\n");
    writeManifest(tmpDir, manifest);
    stampOldVersion(tmpDir);

    await update(tmpDir);

    expect(fs.existsSync(docPath(tmpDir, "old-guide.md"))).toBe(false);
    expect(fs.readFileSync(trashPath(tmpDir, "old-guide.md"), "utf-8")).toBe("# retired\n");
  });

  it("keeps a doc the user added and does not claim it", async () => {
    writeDoc(tmpDir, "team-notes.md", "# ours\n");
    stampOldVersion(tmpDir);

    await update(tmpDir);
    stampOldVersion(tmpDir);
    await update(tmpDir);

    expect(fs.readFileSync(docPath(tmpDir, "team-notes.md"), "utf-8")).toBe("# ours\n");
    expect(readManifest(tmpDir).content_hashes?.docs).not.toHaveProperty("team-notes.md");
  });

  describe("on a manifest written before docs were tracked", () => {
    beforeEach(() => {
      const manifest = readManifest(tmpDir);
      delete manifest.content_hashes!.docs;
      writeManifest(tmpDir, manifest);
    });

    it("removes the docs Arcane retired, and only those", async () => {
      writeDoc(tmpDir, "presentations/arcane-overview.pptx", "deck");
      writeDoc(tmpDir, "RELEASE-SETUP.md", "# release\n");
      writeDoc(tmpDir, "team-notes.md", "# ours\n");
      stampOldVersion(tmpDir);

      await update(tmpDir);

      expect(fs.existsSync(docPath(tmpDir, "presentations/arcane-overview.pptx"))).toBe(false);
      expect(fs.existsSync(trashPath(tmpDir, "presentations/arcane-overview.pptx"))).toBe(true);
      expect(fs.existsSync(docPath(tmpDir, "RELEASE-SETUP.md"))).toBe(false);
      expect(fs.readFileSync(docPath(tmpDir, "team-notes.md"), "utf-8")).toBe("# ours\n");
    });

    it("backs up a changed doc before replacing it, since edits cannot be told apart", async () => {
      writeDoc(tmpDir, DOC, "# edited or old, no way to know\n");
      stampOldVersion(tmpDir);

      await update(tmpDir);

      expect(fs.readFileSync(docPath(tmpDir, DOC), "utf-8")).toBe(shipped());
      expect(fs.readFileSync(trashPath(tmpDir, DOC), "utf-8")).toBe("# edited or old, no way to know\n");
    });
  });

  it("leaves docs alone when .claude/docs is a worktree symlink", async () => {
    // Arrange: the main worktree's docs, one of them retired.
    const main = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-docs-main-"));
    fs.writeFileSync(path.join(main, "old-guide.md"), "# main's copy\n");
    fs.rmSync(path.join(tmpDir, ".claude", "docs"), { recursive: true, force: true });
    fs.symlinkSync(main, path.join(tmpDir, ".claude", "docs"), "junction");
    const manifest = readManifest(tmpDir);
    manifest.content_hashes!.docs!["old-guide.md"] = sha256("# main's copy\n");
    writeManifest(tmpDir, manifest);
    stampOldVersion(tmpDir);

    // Act
    await update(tmpDir);

    // Assert: nothing was written into, or moved out of, the main worktree.
    expect(fs.readdirSync(main)).toEqual(["old-guide.md"]);
    fs.rmSync(path.join(tmpDir, ".claude", "docs"), { force: true, recursive: false });
    fs.rmSync(main, { recursive: true, force: true });
  });
});
