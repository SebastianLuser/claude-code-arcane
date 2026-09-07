import fs from "node:fs";
import path from "node:path";
import { arcaneHome } from "./utils.js";

/** Resolved per call, never cached in a const: see arcaneHome(). */
function cacheDir(): string {
  return path.join(arcaneHome(), "cache");
}

export interface CacheMeta {
  version: string;
  cached_at: string;
  source_sha?: string;
}

export function getCacheDir(): string {
  return cacheDir();
}

export function getCachePath(version: string): string {
  return path.join(cacheDir(), version);
}

/**
 * Whether a directory can actually serve as a content root.
 *
 * A cache entry used to count as valid on the strength of its metadata file alone, so
 * any directory under `cache/` qualified - including a test fixture holding nothing but
 * `skills/`. `findLatestCache()` picked it as the newest entry, `mergeProfiles()` found
 * no profiles in it and returned an empty profile rather than failing, and the update
 * plan read every installed skill as an orphan. Content the installer needs is the only
 * honest test of whether an entry is usable.
 */
export function isUsableContentRoot(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "profiles")) && fs.existsSync(path.join(dir, "skills"))
  );
}

export function isCached(version: string): boolean {
  const versionDir = getCachePath(version);
  return (
    fs.existsSync(versionDir) &&
    fs.existsSync(path.join(versionDir, ".cache-meta.json")) &&
    isUsableContentRoot(versionDir)
  );
}

export function getCachedContentRoot(version: string): string | null {
  if (!isCached(version)) return null;
  return getCachePath(version);
}

export function storeInCache(version: string, contentDir: string): string {
  const versionDir = getCachePath(version);

  if (fs.existsSync(versionDir)) {
    fs.rmSync(versionDir, { recursive: true, force: true });
  }
  fs.mkdirSync(versionDir, { recursive: true });

  for (const dir of ["skills", "rules", "agents", "hooks", "profiles", "templates", "docs", "output-styles"]) {
    const src = path.join(contentDir, dir);
    if (fs.existsSync(src)) {
      copyDirRecursive(src, path.join(versionDir, dir));
    }
  }

  const meta: CacheMeta = {
    version,
    cached_at: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(versionDir, ".cache-meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
  );

  return versionDir;
}

export function pruneCache(keepCount: number = 3): void {
  if (!fs.existsSync(cacheDir())) return;

  const entries = fs.readdirSync(cacheDir(), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const metaPath = path.join(cacheDir(), e.name, ".cache-meta.json");
      let cachedAt = 0;
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as CacheMeta;
          cachedAt = new Date(meta.cached_at).getTime();
        } catch {
          cachedAt = 0;
        }
      }
      return { name: e.name, cachedAt };
    })
    .sort((a, b) => b.cachedAt - a.cachedAt);

  for (const entry of entries.slice(keepCount)) {
    fs.rmSync(path.join(cacheDir(), entry.name), { recursive: true, force: true });
  }
}

export function listCachedVersions(): Array<{ version: string; cachedAt: string }> {
  if (!fs.existsSync(cacheDir())) return [];

  return fs.readdirSync(cacheDir(), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const metaPath = path.join(cacheDir(), e.name, ".cache-meta.json");
      let cachedAt = "unknown";
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as CacheMeta;
          cachedAt = meta.cached_at;
        } catch {
          // ignore
        }
      }
      return { version: e.name, cachedAt };
    });
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
