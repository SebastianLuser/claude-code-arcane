import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-cache-test-"));
}

describe("cache", () => {
  let tmpDir: string;
  let originalHome: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    originalHome = os.homedir();
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should detect when a version is not cached", async () => {
    const { isCached } = await import("../cache.js");
    expect(isCached("nonexistent-version")).toBe(false);
  });

  it("should store and retrieve cached content", async () => {
    const { storeInCache, getCachePath } = await import("../cache.js");

    // Arrange
    const contentDir = makeTmpDir();
    const skillsDir = path.join(contentDir, "skills", "test-skill");
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, "SKILL.md"), "# Test");

    // Act
    const cachePath = storeInCache("test-v1", contentDir);

    // Assert
    expect(fs.existsSync(cachePath)).toBe(true);
    expect(fs.existsSync(path.join(cachePath, "skills", "test-skill", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(cachePath, ".cache-meta.json"))).toBe(true);

    const meta = JSON.parse(fs.readFileSync(path.join(cachePath, ".cache-meta.json"), "utf-8"));
    expect(meta.version).toBe("test-v1");
    expect(meta.cached_at).toBeTruthy();

    // Cleanup
    fs.rmSync(contentDir, { recursive: true, force: true });
  });

  it("should list cached versions", async () => {
    const { storeInCache, listCachedVersions } = await import("../cache.js");

    // Arrange
    const contentDir = makeTmpDir();
    fs.mkdirSync(path.join(contentDir, "skills"), { recursive: true });
    storeInCache("v1", contentDir);
    storeInCache("v2", contentDir);

    // Act
    const versions = listCachedVersions();

    // Assert
    const names = versions.map((v) => v.version);
    expect(names).toContain("v1");
    expect(names).toContain("v2");

    // Cleanup
    fs.rmSync(contentDir, { recursive: true, force: true });
  });
});
