import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

export function getPackageRoot(): string {
  const thisFile = fileURLToPath(import.meta.url);
  // dist/cli.js → repo root (go up from dist/)
  // src/cli.ts → repo root (go up from src/) during dev
  return path.resolve(path.dirname(thisFile), "..");
}

export function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
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

export function safeRemove(p: string): void {
  if (isSymlinkOrJunction(p)) {
    fs.unlinkSync(p);
  } else if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}
