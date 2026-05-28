import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { getPackageRoot, getPackageVersion } from "./utils.js";
import { getCachedContentRoot, isCached, storeInCache, pruneCache } from "./cache.js";

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

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/commits/${this.branch}`,
        {
          method: "HEAD",
          headers: { "User-Agent": "arcane-cli" },
          signal: AbortSignal.timeout(5000),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async getVersion(): Promise<string> {
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

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = (await response.json()) as { sha: string };
      this.resolvedVersion = data.sha.substring(0, 12);
      return this.resolvedVersion;
    } catch {
      this.resolvedVersion = `github-${Date.now()}`;
      return this.resolvedVersion;
    }
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
      const version = await github.getVersion();

      if (isCached(version)) {
        if (!opts.quiet) log(`  Source: cache (${version})`);
        return new CachedContentSource(version);
      }

      if (!opts.quiet) log("  Source: github");
      return github;
    }

    if (preference === "github") {
      throw new Error("GitHub source requested but not available. Check your internet connection.");
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

function findLatestCache(): string | null {
  const cacheDir = path.join(os.homedir(), ".arcane", "cache");
  if (!fs.existsSync(cacheDir)) return null;

  const entries = fs.readdirSync(cacheDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const metaPath = path.join(cacheDir, e.name, ".cache-meta.json");
      let cachedAt = 0;
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
          cachedAt = new Date(meta.cached_at).getTime();
        } catch {
          cachedAt = 0;
        }
      }
      return { name: e.name, cachedAt };
    })
    .sort((a, b) => b.cachedAt - a.cachedAt);

  return entries.length > 0 ? entries[0].name : null;
}
