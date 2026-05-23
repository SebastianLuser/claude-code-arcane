import path from "node:path";
import type { ArcaneManifest, MergedProfile } from "./types.js";
import { fileExists, readJsonSync, writeJsonSync } from "./utils.js";

const MANIFEST_FILE = "arcane-manifest.json";

export function manifestPath(target: string): string {
  return path.join(target, ".claude", MANIFEST_FILE);
}

export function readManifest(target: string): ArcaneManifest | null {
  const p = manifestPath(target);
  if (!fileExists(p)) return null;
  return readJsonSync<ArcaneManifest>(p);
}

export function writeManifest(
  target: string,
  merged: MergedProfile,
  profileCommand: string,
  packageRoot: string,
): void {
  const manifest: ArcaneManifest = {
    arcane_version: "1.0.0",
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
  };
  writeJsonSync(manifestPath(target), manifest);
}
