import path from "node:path";
import os from "node:os";
import { ensureDir, fileExists, readJsonSync, writeJsonSync } from "./utils.js";
import { manifestPath } from "./manifest.js";

const REGISTRY_VERSION = 1 as const;

export interface RegistryEntry {
  path: string;
  registered_at: string;
}

interface Registry {
  version: typeof REGISTRY_VERSION;
  installations: RegistryEntry[];
}

/**
 * Root directory for Arcane's machine-global state (registry, cache, update
 * check). Overridable via ARCANE_HOME so tests never touch the real ~/.arcane.
 */
export function arcaneHome(): string {
  return process.env.ARCANE_HOME ?? path.join(os.homedir(), ".arcane");
}

function registryPath(): string {
  return path.join(arcaneHome(), "installations.json");
}

function readRegistryFile(): Registry {
  const p = registryPath();
  if (!fileExists(p)) {
    return { version: REGISTRY_VERSION, installations: [] };
  }
  try {
    const data = readJsonSync<Partial<Registry>>(p);
    return {
      version: REGISTRY_VERSION,
      installations: Array.isArray(data.installations) ? data.installations : [],
    };
  } catch {
    return { version: REGISTRY_VERSION, installations: [] };
  }
}

function writeRegistryFile(registry: Registry): void {
  try {
    ensureDir(arcaneHome());
    writeJsonSync(registryPath(), registry);
  } catch {
    // Registry is best-effort; never fail a command because it can't be written.
  }
}

/** Returns the registered installation entries. */
export function readRegistry(): RegistryEntry[] {
  return readRegistryFile().installations;
}

/**
 * Record an Arcane installation directory. Resolves to an absolute path and
 * deduplicates — no-op if the path is already registered. Best-effort: silently
 * ignores write failures.
 */
export function registerInstallation(target: string): void {
  const abs = path.resolve(target);
  const registry = readRegistryFile();

  if (registry.installations.some((e) => e.path === abs)) {
    return;
  }

  registry.installations.push({
    path: abs,
    registered_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  });
  writeRegistryFile(registry);
}

/**
 * Drop registered paths that no longer have an Arcane manifest (deleted repos,
 * uninstalled Arcane), persist the pruned list, and return the survivors.
 */
export function pruneRegistry(): RegistryEntry[] {
  const registry = readRegistryFile();
  const alive = registry.installations.filter((e) => fileExists(manifestPath(e.path)));

  if (alive.length !== registry.installations.length) {
    writeRegistryFile({ version: REGISTRY_VERSION, installations: alive });
  }

  return alive;
}
