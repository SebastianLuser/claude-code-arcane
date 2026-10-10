import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { ProfileDefinition, MergedProfile } from "./types.js";

export function parseProfile(filePath: string): ProfileDefinition {
  const raw = yaml.load(fs.readFileSync(filePath, "utf-8")) as Record<
    string,
    unknown
  >;
  const rules = (raw.rules ?? {}) as Record<string, string[]>;
  const perms = (raw.permissions ?? {}) as Record<string, string[]>;

  return {
    name: String(raw.name ?? path.basename(filePath, ".yaml")),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? "other"),
    skills: (raw.skills as string[]) ?? [],
    rules: {
      universal: rules.universal ?? [],
      gamedev: rules.gamedev ?? [],
    },
    agents: (raw.agents as string[]) ?? [],
    hooks: (raw.hooks as string[]) ?? [],
    output_styles: (raw.output_styles as string[]) ?? [],
    permissions: {
      allow: perms.allow ?? [],
      deny: perms.deny ?? [],
    },
  };
}

// Display order for profile categories. Categories not listed here (including
// the "other" fallback for profiles without a category) render last.
export const CATEGORY_ORDER: ReadonlyArray<{ id: string; label: string }> = [
  { id: "backend", label: "Backend" },
  { id: "frontend", label: "Frontend & Design" },
  { id: "mobile", label: "Mobile" },
  { id: "gamedev", label: "Gamedev" },
  { id: "platform", label: "Platform & Quality" },
  { id: "management", label: "Project Management" },
  { id: "business", label: "Business" },
  { id: "personal", label: "Personal" },
  { id: "utilities", label: "Utilities" },
];

export function groupByCategory(
  profiles: ProfileDefinition[],
): Array<{ id: string; label: string; profiles: ProfileDefinition[] }> {
  const known = new Set(CATEGORY_ORDER.map((c) => c.id));
  const groups = CATEGORY_ORDER.map((c) => ({
    ...c,
    profiles: profiles.filter((p) => p.category === c.id),
  }));
  const rest = profiles.filter((p) => !known.has(p.category));
  if (rest.length > 0) {
    groups.push({ id: "other", label: "Other", profiles: rest });
  }
  return groups.filter((g) => g.profiles.length > 0);
}

/**
 * Old profile name -> current name. A project installed before a rename keeps
 * the old name in arcane-manifest.json, and `arcane update` reads it back from
 * there, so dropping an entry breaks every install made before that rename.
 */
export const PROFILE_RENAMES: Readonly<Record<string, string>> = {
  "backend-ts": "backend-typescript",
  frontend: "frontend-react-vite",
  mobile: "mobile-react-native",
  flutter: "mobile-flutter",
  "ios-native": "mobile-ios-swift",
  "android-native": "mobile-android-kotlin",
};

export function canonicalProfileName(name: string): string {
  return PROFILE_RENAMES[name] ?? name;
}

/** True when both names refer to the same profile, across a rename. */
export function sameProfile(a: string, b: string): boolean {
  return canonicalProfileName(a) === canonicalProfileName(b);
}

/**
 * Finds the YAML for `name` in `profilesDir`. The name as given wins; then its
 * current name; then any old name for it. The last case matters for `remove`,
 * which reads the definitions of the installed version, where a profile may
 * still live under its old name.
 */
export function resolveProfile(
  profilesDir: string,
  name: string,
): { name: string; file: string } | null {
  const canonical = canonicalProfileName(name);
  const oldNames = Object.keys(PROFILE_RENAMES).filter((o) => PROFILE_RENAMES[o] === canonical);
  for (const candidate of [name, canonical, ...oldNames]) {
    const file = path.join(profilesDir, `${candidate}.yaml`);
    if (fs.existsSync(file)) return { name: candidate, file };
  }
  return null;
}

export function listProfiles(profilesDir: string): ProfileDefinition[] {
  if (!fs.existsSync(profilesDir)) return [];
  return fs
    .readdirSync(profilesDir)
    .filter((f) => f.endsWith(".yaml") && f !== "core.yaml")
    .map((f) => parseProfile(path.join(profilesDir, f)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeProfiles(
  profilesDir: string,
  profileNames: string[],
): MergedProfile {
  const namesToLoad = ["core", ...profileNames];
  const loaded: string[] = [];

  const seenSkills = new Set<string>();
  const seenRulesUniv = new Set<string>();
  const seenRulesGamedev = new Set<string>();
  const seenAgents = new Set<string>();
  const seenHooks = new Set<string>();
  const seenOutputStyles = new Set<string>();
  const allPermAllow: string[] = [];
  const allPermDeny: string[] = [];

  const skills: string[] = [];
  const rulesUniv: string[] = [];
  const rulesGamedev: string[] = [];
  const agents: string[] = [];
  const hooks: string[] = [];
  const outputStyles: string[] = [];

  for (const name of namesToLoad) {
    const resolved = resolveProfile(profilesDir, name);
    if (!resolved) {
      console.warn(`  WARN: Profile '${name}.yaml' not found, skipping`);
      continue;
    }
    if (resolved.name !== name && resolved.name === canonicalProfileName(name)) {
      console.warn(`  NOTE: Profile '${name}' is now '${resolved.name}'`);
    }
    if (loaded.includes(resolved.name)) continue;
    const profile = parseProfile(resolved.file);
    loaded.push(resolved.name);

    for (const s of profile.skills) {
      if (!seenSkills.has(s)) {
        seenSkills.add(s);
        skills.push(s);
      }
    }
    for (const r of profile.rules.universal) {
      if (!seenRulesUniv.has(r)) {
        seenRulesUniv.add(r);
        rulesUniv.push(r);
      }
    }
    for (const r of profile.rules.gamedev) {
      if (!seenRulesGamedev.has(r)) {
        seenRulesGamedev.add(r);
        rulesGamedev.push(r);
      }
    }
    for (const a of profile.agents) {
      if (!seenAgents.has(a)) {
        seenAgents.add(a);
        agents.push(a);
      }
    }
    for (const h of profile.hooks) {
      if (!seenHooks.has(h)) {
        seenHooks.add(h);
        hooks.push(h);
      }
    }
    for (const o of profile.output_styles) {
      if (!seenOutputStyles.has(o)) {
        seenOutputStyles.add(o);
        outputStyles.push(o);
      }
    }
    allPermAllow.push(...profile.permissions.allow);
    allPermDeny.push(...profile.permissions.deny);
  }

  return {
    loaded,
    skills,
    rules: { universal: rulesUniv, gamedev: rulesGamedev },
    agents,
    hooks,
    output_styles: outputStyles,
    permissions: {
      allow: [...new Set(allPermAllow)],
      deny: [...new Set(allPermDeny)],
    },
  };
}
