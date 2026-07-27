import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

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

export function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (COPY_SKIP.has(entry.name) || entry.name.endsWith(".pyc")) continue;
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
