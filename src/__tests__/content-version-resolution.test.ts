import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import { GitHubContentSource, resolveContentSource } from "../content-source.js";
import type { ArcaneManifest } from "../types.js";

/**
 * Resolving the content version used to cost two GitHub API requests per call - a HEAD
 * for "is it reachable?" and a GET for the sha - and `update` paid that per installation.
 * Thirteen registered installs spent 26 of the 60 requests an unauthenticated hour
 * allows, so a dry-run plus the real run exhausted the limit mid-way.
 *
 * What made it durable rather than annoying: on failure `getVersion()` answered
 * `github-${Date.now()}`, and that string became an identity. It stamped `source_version`
 * in three real manifests, named a cache directory, and left those installs unable to
 * match any real version ever again - every later run reported an update, no run settled.
 *
 * The window between the two requests is exactly where it happened: the HEAD spent the
 * last request of the hour, the GET came back 403, and the caller had already committed
 * to the github source.
 */

const REPO_ROOT = getPackageRoot();

const COMMIT_URL = "https://api.github.com/repos/";

function okSha(sha: string): Response {
  return new Response(JSON.stringify({ sha }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function rateLimited(): Response {
  return new Response("rate limit exceeded", { status: 403 });
}

describe("GitHubContentSource version resolution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should ask GitHub once to answer both isAvailable and getVersion", async () => {
    // Arrange
    const fetchMock = vi.fn(async () => okSha("abcdef1234567890"));
    vi.stubGlobal("fetch", fetchMock);
    const source = new GitHubContentSource();

    // Act
    const available = await source.isAvailable();
    const version = await source.getVersion();

    // Assert
    expect(available).toBe(true);
    expect(version).toBe("abcdef123456");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should throw instead of inventing a version when the API refuses", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn(async () => rateLimited()));
    const source = new GitHubContentSource();

    // Act + Assert
    await expect(source.getVersion()).rejects.toThrow(/rate limit|Could not read/i);
  });

  it("should report itself unavailable when the API refuses", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn(async () => rateLimited()));

    // Act
    const available = await new GitHubContentSource().isAvailable();

    // Assert
    expect(available).toBe(false);
  });

  it("should survive the limit running out between the two requests it used to make", async () => {
    // Arrange: the production failure, exactly. The first request succeeds and spends the
    // last of the hour; the second comes back 403. With two requests per resolution the
    // caller had already committed to the github source and then fabricated a version for
    // it. With one request there is no window to fall into.
    const previous = process.env.ARCANE_SOURCE;
    delete process.env.ARCANE_SOURCE;
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => (++calls === 1 ? okSha("5322d3ee1404aaaa") : rateLimited())),
    );

    try {
      // Act
      const source = await resolveContentSource({ quiet: true });
      const version = await source.getVersion();

      // Assert
      expect(version).not.toMatch(/^github-/);
      expect(version).toBe("5322d3ee1404");
    } finally {
      if (previous === undefined) delete process.env.ARCANE_SOURCE;
      else process.env.ARCANE_SOURCE = previous;
    }
  });

  it("should never hand back a fabricated version through auto resolution", async () => {
    // Arrange: the shape of the bug, from the caller's side. Whatever "auto" falls back
    // to - cache on a developer machine, bundled on CI - it has to be a version something
    // else can recognise later.
    const previous = process.env.ARCANE_SOURCE;
    delete process.env.ARCANE_SOURCE;
    vi.stubGlobal("fetch", vi.fn(async () => rateLimited()));

    try {
      // Act
      const source = await resolveContentSource({ quiet: true });
      const version = await source.getVersion();

      // Assert
      expect(source.type).not.toBe("github");
      expect(version).not.toMatch(/^github-/);
      expect(version.length).toBeGreaterThan(0);
    } finally {
      if (previous === undefined) delete process.env.ARCANE_SOURCE;
      else process.env.ARCANE_SOURCE = previous;
    }
  });
});

describe("updateCommand content source", () => {
  let homeDir: string;
  let originalArcaneHome: string | undefined;
  let originalArcaneSource: string | undefined;
  let originalCwd: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  const cleanup: string[] = [];

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    originalArcaneHome = process.env.ARCANE_HOME;
    originalArcaneSource = process.env.ARCANE_SOURCE;
    originalCwd = process.cwd();
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-home-"));
    process.env.ARCANE_HOME = homeDir;
    cleanup.push(homeDir);
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.unstubAllGlobals();
    process.chdir(originalCwd);
    if (originalArcaneHome === undefined) delete process.env.ARCANE_HOME;
    else process.env.ARCANE_HOME = originalArcaneHome;
    if (originalArcaneSource === undefined) delete process.env.ARCANE_SOURCE;
    else process.env.ARCANE_SOURCE = originalArcaneSource;
    for (const dir of cleanup) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      }
    }
    cleanup.length = 0;
  });

  it("should resolve the version once for the whole run, not once per installation", async () => {
    // Arrange: two registered installs, and a GitHub that refuses - so the run falls back
    // without downloading anything. The count is the whole point: one request for the run,
    // not one (or two) per target.
    const repoA = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-a-"));
    const repoB = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-b-"));
    cleanup.push(repoA, repoB);
    for (const repo of [repoA, repoB]) {
      const merged = mergeProfiles(path.join(REPO_ROOT, "profiles"), ["testing"]);
      new Installer(merged, { target: repo, dryRun: false, force: false }).run("testing");
      const manifestPath = path.join(repo, ".claude", "arcane-manifest.json");
      const manifest: ArcaneManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      manifest.source_version = "0.0.1";
      manifest.arcane_version = "0.0.1";
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    }
    const { registerInstallation } = await import("../registry.js");
    registerInstallation(repoA);
    registerInstallation(repoB);

    delete process.env.ARCANE_SOURCE;
    const fetchMock = vi.fn(async (_url: unknown) => rateLimited());
    vi.stubGlobal("fetch", fetchMock);

    // Act
    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ dryRun: true, selfUpdate: false, quiet: true });

    // Assert
    const apiCalls = fetchMock.mock.calls.filter((c) => String(c[0]).startsWith(COMMIT_URL));
    expect(apiCalls.length).toBe(1);
  });

  it("should make no request at all when there is nothing to update", async () => {
    // Arrange: an empty registry used to still pay for a resolution per invocation.
    delete process.env.ARCANE_SOURCE;
    const fetchMock = vi.fn(async () => rateLimited());
    vi.stubGlobal("fetch", fetchMock);
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-empty-"));
    cleanup.push(empty);
    process.chdir(empty);

    // Act
    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ dryRun: true, selfUpdate: false, quiet: true });

    // Assert
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
