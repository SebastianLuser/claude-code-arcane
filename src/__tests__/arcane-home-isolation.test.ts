import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

/**
 * `~/.arcane` was rebuilt in four modules and only registry.ts read ARCANE_HOME, so the
 * isolation vitest.config.ts sets up covered the registry and nothing else. cache.test.ts
 * kept writing fixtures into the developer's real cache, and one of them - a directory
 * holding nothing but `skills/`, stored under the name `v2` - became the newest entry
 * there. The next `arcane update` took it as the offline fallback, found no profiles in
 * it, and proposed removing 1038 skills, rules and agents across 13 real projects.
 *
 * Two independent failures had to line up, so both are pinned here: state escaping the
 * test sandbox, and an unusable directory passing for a content root.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = path.join(REPO_ROOT, "src");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      out.push(...sourceFiles(full));
    } else if (entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("the arcane home has one definition", () => {
  it("should be resolved from homedir() in utils.ts and nowhere else", () => {
    // Arrange: the guard. A fifth copy is how the fourth one went unnoticed - each looked
    // reasonable on its own, and nothing made them agree.
    const offenders: string[] = [];

    // Act
    for (const file of sourceFiles(SRC)) {
      const text = fs.readFileSync(file, "utf-8");
      for (const line of text.split(/\r?\n/)) {
        if (!line.includes("homedir()")) continue;
        if (!line.includes(".arcane")) continue;
        if (path.basename(file) === "utils.ts") continue;
        offenders.push(`${path.relative(REPO_ROOT, file)}: ${line.trim()}`);
      }
    }

    // Assert
    expect(offenders, "use arcaneHome() from utils.ts instead").toEqual([]);
  });
});

describe("ARCANE_HOME keeps state out of the real home", () => {
  let home: string;
  let previousHome: string | undefined;

  beforeEach(() => {
    previousHome = process.env.ARCANE_HOME;
    home = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-isolation-"));
    process.env.ARCANE_HOME = home;
    vi.resetModules();
  });

  afterEach(() => {
    if (previousHome === undefined) delete process.env.ARCANE_HOME;
    else process.env.ARCANE_HOME = previousHome;
    if (fs.existsSync(home)) {
      fs.rmSync(home, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
    vi.resetModules();
  });

  it("should store cached content under ARCANE_HOME and leave the real cache alone", async () => {
    // Arrange
    const content = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-content-"));
    fs.mkdirSync(path.join(content, "skills"), { recursive: true });
    fs.mkdirSync(path.join(content, "profiles"), { recursive: true });
    const realEntry = path.join(os.homedir(), ".arcane", "cache", "isolation-probe");

    try {
      // Act
      const { getCachePath, storeInCache } = await import("../cache.js");
      const target = getCachePath("isolation-probe");

      // Assert: check where the write is headed *before* making it. Test files share a
      // process, so an env restore racing this one would otherwise have this very test
      // write the pollution it exists to catch.
      expect(target.startsWith(home), `cache path escaped ARCANE_HOME: ${target}`).toBe(true);
      expect(storeInCache("isolation-probe", content)).toBe(target);
      expect(fs.existsSync(realEntry)).toBe(false);
    } finally {
      fs.rmSync(content, { recursive: true, force: true });
    }
  });

  it("should keep the update-check stamp under ARCANE_HOME", async () => {
    // Arrange: read the module's own idea of where it writes rather than triggering a
    // network check, so the assertion stays about the path and nothing else.
    const { arcaneHome } = await import("../utils.js");

    // Act
    const resolved = arcaneHome();

    // Assert
    expect(resolved).toBe(home);
    expect(path.join(resolved, "last-check.json").startsWith(home)).toBe(true);
  });
});

describe("a cache entry has to be usable to count", () => {
  let home: string;
  let previousHome: string | undefined;
  let previousSource: string | undefined;

  function writeEntry(name: string, dirs: string[], cachedAt: string): void {
    const dir = path.join(home, "cache", name);
    for (const d of dirs) fs.mkdirSync(path.join(dir, d), { recursive: true });
    fs.writeFileSync(
      path.join(dir, ".cache-meta.json"),
      JSON.stringify({ version: name, cached_at: cachedAt }, null, 2),
    );
  }

  beforeEach(() => {
    previousHome = process.env.ARCANE_HOME;
    previousSource = process.env.ARCANE_SOURCE;
    home = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-cachepick-"));
    process.env.ARCANE_HOME = home;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (previousHome === undefined) delete process.env.ARCANE_HOME;
    else process.env.ARCANE_HOME = previousHome;
    if (previousSource === undefined) delete process.env.ARCANE_SOURCE;
    else process.env.ARCANE_SOURCE = previousSource;
    if (fs.existsSync(home)) {
      fs.rmSync(home, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
    vi.resetModules();
  });

  it("should not consider a directory without profiles cached", async () => {
    // Arrange
    writeEntry("skills-only", ["skills"], "2026-09-07T13:34:20.000Z");

    // Act
    const { isCached } = await import("../cache.js");

    // Assert
    expect(isCached("skills-only")).toBe(false);
  });

  it("should skip an unusable newer entry when falling back offline", async () => {
    // Arrange: the incident. The junk fixture is the newest entry, so picking by date
    // alone picks it - and every profile lookup against it then fails silently.
    writeEntry("real-content", ["skills", "profiles", "agents"], "2026-09-07T13:11:19.000Z");
    writeEntry("junk-fixture", ["skills"], "2026-09-07T13:34:20.000Z");
    delete process.env.ARCANE_SOURCE;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limit exceeded", { status: 403 })),
    );

    // Act
    const { resolveContentSource } = await import("../content-source.js");
    const source = await resolveContentSource({ quiet: true });

    // Assert
    expect(source.type).toBe("cache");
    expect(await source.getVersion()).toBe("real-content");
  });
});
