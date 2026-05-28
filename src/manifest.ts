import path from "node:path";
import type { ArcaneManifest, MergedProfile } from "./types.js";
import { fileExists, readJsonSync, writeJsonSync, getPackageVersion } from "./utils.js";
import type { ContentHashes } from "./content-hash.js";

const MANIFEST_FILE = "arcane-manifest.json";

export function manifestPath(target: string): string {
  return path.join(target, ".claude", MANIFEST_FILE);
}

export function readManifest(target: string): ArcaneManifest | null {
  const p = manifestPath(target);
  if (!fileExists(p)) return null;
  return readJsonSync<ArcaneManifest>(p);
}

export interface WriteManifestOptions {
  contentHashes?: ContentHashes;
  sourceType?: "bundled" | "github" | "cache";
  worktree?: {
    is_worktree: boolean;
    main_worktree: string;
    shared_dirs: string[];
  };
}

export function writeManifest(
  target: string,
  merged: MergedProfile,
  profileCommand: string,
  packageRoot: string,
  worktreeOrOpts?:
    | { is_worktree: boolean; main_worktree: string; shared_dirs: string[] }
    | WriteManifestOptions,
): void {
  let opts: WriteManifestOptions = {};

  if (worktreeOrOpts) {
    if ("is_worktree" in worktreeOrOpts) {
      opts = { worktree: worktreeOrOpts };
    } else {
      opts = worktreeOrOpts;
    }
  }

  const version = getPackageVersion();
  const manifest: ArcaneManifest = {
    arcane_version: version,
    cli: "npm",
    profile_command: profileCommand,
    profiles: merged.loaded,
    installed_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    total_skills: merged.skills.length,
    total_rules:
      merged.rules.universal.length + merged.rules.gamedev.length,
    installed_skills: merged.skills,
    installed_rules: [
      ...merged.rules.universal,
      ...merged.rules.gamedev,
    ],
    installed_agents: merged.agents,
    source: packageRoot,
    source_version: version,
  };
  if (opts.worktree) {
    manifest.worktree = opts.worktree;
  }
  if (opts.contentHashes) {
    manifest.content_hashes = opts.contentHashes;
  }
  if (opts.sourceType) {
    manifest.source_type = opts.sourceType;
  }
  writeJsonSync(manifestPath(target), manifest);
}

export function updateManifestFields(
  target: string,
  updates: Partial<ArcaneManifest>,
): void {
  const manifest = readManifest(target);
  if (!manifest) return;
  Object.assign(manifest, updates);
  writeJsonSync(manifestPath(target), manifest);
}
