import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { getPackageRoot, getPackageVersion } from "./utils.js";
import {
  getCachedContentRoot,
  isCached,
  storeInCache,
  pruneCache,
  listCachedVersions,
} from "./cache.js";

const GITHUB_OWNER = "SebastianLuser";
const GITHUB_REPO = "Claude-Code-Arcane";
const GITHUB_BRANCH = "main";

export interface ContentSource {
  readonly type: "bundled" | "github" | "cache";
  getContentRoot(): Promise<string>;
  isAvailable(): Promise<boolean>;
  getVersion(): Promise<string>;
}

export class BundledContentSource implements ContentSource {
  readonly type = "bundled" as const;

  async getContentRoot(): Promise<string> {
    return getPackageRoot();
  }

  async isAvailable(): Promise<boolean> {
    const root = getPackageRoot();
    return fs.existsSync(path.join(root, "skills"));
  }

  async getVersion(): Promise<string> {
    return getPackageVersion();
  }
}

export class CachedContentSource implements ContentSource {
  readonly type = "cache" as const;
  private version: string;

  constructor(version: string) {
    this.version = version;
  }

  async getContentRoot(): Promise<string> {
    const cached = getCachedContentRoot(this.version);
    if (!cached) throw new Error(`Cache miss for version ${this.version}`);
    return cached;
  }

  async isAvailable(): Promise<boolean> {
    return isCached(this.version);
  }

  async getVersion(): Promise<string> {
    return this.version;
  }
}

export class GitHubContentSource implements ContentSource {
  readonly type = "github" as const;
  private owner: string;
  private repo: string;
  private branch: string;
  private resolvedVersion: string | null = null;

  constructor(
    owner: string = GITHUB_OWNER,
    repo: string = GITHUB_REPO,
    branch: string = GITHUB_BRANCH,
  ) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
  }

  async getContentRoot(): Promise<string> {
    const version = await this.getVersion();

    if (isCached(version)) {
      return getCachedContentRoot(version)!;
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-github-"));

    try {
      await this.downloadAndExtract(tmpDir);
      const contentRoot = storeInCache(version, this.findExtractedRoot(tmpDir));
      pruneCache(3);
      return contentRoot;
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  /**
   * The head commit of the branch, or null when GitHub cannot answer.
   *
   * One request, memoized, shared by isAvailable() and getVersion(). It used to be
   * two - a HEAD to answer "is it reachable?" and a GET to read the sha - against an
   * endpoint that allows 60 requests an hour unauthenticated. That doubled the cost of
   * every resolution and, worse, opened a window between the two calls: the HEAD spent
   * the last request of the hour, the GET came back 403, and the caller had already
   * committed to the github source. That window is where the fabricated versions came
   * from.
   */
  private async resolveVersion(): Promise<string | null> {
    if (this.resolvedVersion) return this.resolvedVersion;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/commits/${this.branch}`,
        {
          headers: {
            "User-Agent": "arcane-cli",
            Accept: "application/vnd.github.v3+json",
          },
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) return null;

      const data = (await response.json()) as { sha: string };
      this.resolvedVersion = data.sha.substring(0, 12);
      return this.resolvedVersion;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    return (await this.resolveVersion()) !== null;
  }

  /**
   * Throws when the version cannot be read, rather than inventing one.
   *
   * It used to answer `github-${Date.now()}` on any failure, and that string went on to
   * be an identity: it stamped `source_version` in the manifest, named a cache directory,
   * and made the install permanently un-diffable against any real version - it never
   * matched again, so every later run reported an update and no run ever settled. A
   * transient 403 became durable state on disk. Callers that cannot proceed without a
   * version now fall back to the cache, which knows a real one.
   */
  async getVersion(): Promise<string> {
    const version = await this.resolveVersion();
    if (!version) {
      throw new Error(
        "Could not read the content version from GitHub (offline, or the unauthenticated " +
          "API rate limit is exhausted - it resets hourly).",
      );
    }
    return version;
  }

  private async downloadAndExtract(destDir: string): Promise<void> {
    const tarballUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/tarball/${this.branch}`;

    const response = await fetch(tarballUrl, {
      headers: {
        "User-Agent": "arcane-cli",
        Accept: "application/vnd.github.v3.tarball",
      },
      signal: AbortSignal.timeout(60000),
      redirect: "follow",
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to download tarball: ${response.status}`);
    }

    const tar = await import("tar");
    const tarballPath = path.join(destDir, "repo.tar.gz");
    const fileStream = fs.createWriteStream(tarballPath);

    const reader = response.body.getReader();
    const writable = new WritableStream({
      write(chunk) {
        fileStream.write(chunk);
      },
      close() {
        fileStream.end();
      },
    });

    await reader.read().then(async function process({ done, value }): Promise<void> {
      if (done) {
        fileStream.end();
        return;
      }
      fileStream.write(value);
      return reader.read().then(process);
    });

    await new Promise<void>((resolve) => fileStream.on("finish", resolve));

    await tar.extract({
      file: tarballPath,
      cwd: destDir,
    });
  }

  private findExtractedRoot(tmpDir: string): string {
    const entries = fs.readdirSync(tmpDir, { withFileTypes: true });
    const dirs = entries.filter(
      (e) => e.isDirectory() && e.name !== "." && e.name !== "..",
    );
    if (dirs.length === 1) {
      return path.join(tmpDir, dirs[0].name);
    }
    return tmpDir;
  }
}

export type SourcePreference = "auto" | "github" | "bundled";

export interface ResolveOptions {
  source?: SourcePreference;
  quiet?: boolean;
}

export async function resolveContentSource(
  opts: ResolveOptions = {},
): Promise<ContentSource> {
  const envSource = process.env.ARCANE_SOURCE as SourcePreference | undefined;
  const preference = envSource ?? opts.source ?? "auto";
  const log = opts.quiet ? () => {} : console.log;

  if (preference === "bundled") {
    return new BundledContentSource();
  }

  if (preference === "github" || preference === "auto") {
    const github = new GitHubContentSource();

    if (await github.isAvailable()) {
      // Memoized by the same request isAvailable() just made, so this cannot fail here.
      const version = await github.getVersion();

      if (isCached(version)) {
        if (!opts.quiet) log(`  Source: cache (${version})`);
        return new CachedContentSource(version);
      }

      if (!opts.quiet) log("  Source: github");
      return github;
    }

    if (preference === "github") {
      throw new Error(
        "GitHub source requested but not available. Check your internet connection, or " +
          "wait for the unauthenticated API rate limit to reset (hourly).",
      );
    }

    const cached = findLatestCache();
    if (cached) {
      if (!opts.quiet) log(`  Source: cache (${cached}, offline fallback)`);
      return new CachedContentSource(cached);
    }

    if (!opts.quiet) log("  Source: bundled (offline fallback)");
    return new BundledContentSource();
  }

  return new BundledContentSource();
}

/**
 * Resolve the content a given version was installed from, falling back to the
 * normal preference order when that version is no longer cached.
 *
 * `remove` computes what to delete from the profile YAML, so it has to read the
 * same definitions the install read. Resolving "auto" instead reads whatever
 * version is current, and a profile whose skill or agent list grew since then
 * deletes the wrong set. That failure is silent in the worst way: the command
 * prints "Removed +profile" over files that are still on disk.
 *
 * When the installed version is gone from the cache there is nothing better to
 * use, so the fallback is the current source plus a warning. Guessing quietly is
 * what produced the bug; saying which definitions were used is the fix.
 */
export async function resolveContentSourceForVersion(
  version: string | undefined,
  opts: ResolveOptions = {},
): Promise<ContentSource> {
  if (version && isCached(version)) {
    if (!opts.quiet) console.log(`  Source: cache (${version}, as installed)`);
    return new CachedContentSource(version);
  }

  const source = await resolveContentSource(opts);

  if (version) {
    const resolved = await source.getVersion();
    if (resolved !== version && !opts.quiet) {
      console.warn(
        `  WARNING: installed v${version} is not cached, using v${resolved} definitions.\n` +
          "  If a profile changed between those versions, some files may be left behind.",
      );
    }
  }

  return source;
}

/**
 * Newest cache entry that can actually serve as a content root, or null.
 *
 * It used to rebuild the cache path itself and trust every directory it found. That is
 * how a `skills/`-only test fixture became the offline fallback for 13 installations.
 * Reading the entries through cache.ts keeps one definition of where they live, and
 * `isCached()` keeps one definition of what makes one usable.
 */
function findLatestCache(): string | null {
  const usable = listCachedVersions()
    .filter((entry) => isCached(entry.version))
    .map((entry) => ({
      version: entry.version,
      cachedAt: new Date(entry.cachedAt).getTime() || 0,
    }))
    .sort((a, b) => b.cachedAt - a.cachedAt);

  return usable.length > 0 ? usable[0].version : null;
}
