import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/**
 * Root of Arcane's machine-global state: the installation registry, the content
 * cache and the update-check stamp. `ARCANE_HOME` redirects all of it, which is how
 * the test suite stays off the real `~/.arcane`.
 *
 * The single definition is the point. This path used to be rebuilt in four places and
 * only one of them read the variable, so `vitest.config.ts` isolated the registry while
 * `cache.ts` kept writing to the developer's real cache. A fixture named `v2` landed
 * there during `npm test`, `findLatestCache()` picked it as the newest entry, no profile
 * in it resolved, and the next `arcane update` read every installed skill as an orphan:
 * 1038 removals proposed across 13 projects.
 *
 * Lazy on purpose. As a module-level constant it would freeze at import time, and a test
 * that sets the variable in `beforeEach` would have no effect - which is exactly how the
 * broken copies were written.
 */
export function arcaneHome(): string {
  return process.env.ARCANE_HOME ?? path.join(os.homedir(), ".arcane");
}

export function getPackageRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // dist/cli.js → repo root (go up from dist/)
  // src/cli.ts → repo root (go up from src/) during dev
  return path.resolve(path.dirname(thisFile), "..");
}

// Build artifacts of the source tree, never content: skill scripts are Python,
// so running one (or compileall in CI) leaves __pycache__ next to it, and
// copying that into every install ships stale bytecode as if it were an asset.
const COPY_SKIP = new Set(["__pycache__", ".pytest_cache"]);

/**
 * Whether a directory entry is a build artifact of the source tree rather than
 * content to ship.
 *
 * Copying and hashing have to agree on this, and they did not. The installer
 * skipped __pycache__ while the content hashes counted it, so any source tree
 * where a Python skill had run produced a source hash that no install could
 * ever match: `update` listed that skill as changed, copied it, computed the
 * same mismatch again, and offered it forever without converging.
 */
export function isBuildArtifact(name: string): boolean {
  return COPY_SKIP.has(name) || name.endsWith(".pyc");
}

export function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (isBuildArtifact(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function fileExists(p: string): boolean {
  return fs.existsSync(p);
}

export function readJsonSync<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

export function writeJsonSync(p: string, data: unknown): void {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export function isSymlinkOrJunction(p: string): boolean {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

export function getPackageVersion(): string {
  const pkgPath = path.join(getPackageRoot(), "package.json");
  const pkg = readJsonSync<{ version: string }>(pkgPath);
  return pkg.version;
}

export function safeRemove(p: string): void {
  if (isSymlinkOrJunction(p)) {
    fs.unlinkSync(p);
  } else if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}
