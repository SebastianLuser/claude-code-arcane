import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { readManifest } from "../manifest.js";
import { mergeProfiles, parseProfile, resolveProfile, sameProfile } from "../profiles.js";
import {
  isGranular,
  parseAgentEntry,
  removeAgentEntry,
} from "../agent-entries.js";
import { moveToTrash, TRASH_DIR, writeJsonSync } from "../utils.js";
import {
  resolveContentSource,
  resolveContentSourceForVersion,
  type SourcePreference,
} from "../content-source.js";

/** Skills `remove` refuses to touch. */
function coreSkills(root: string): string[] {
  const core = resolveProfile(path.join(root, "profiles"), "core");
  return core ? parseProfile(core.file).skills : [];
}

export interface RemoveOpts {
  source?: SourcePreference;
}

export async function removeCommand(
  items: string[],
  opts: RemoveOpts = {},
): Promise<void> {
  const target = process.cwd();
  const manifest = readManifest(target);

  if (!manifest) {
    console.error(
      chalk.red(
        "No arcane-manifest.json found. Run `npx claude-code-arcane install` first.",
      ),
    );
    process.exit(1);
  }

  // Read the manifest before resolving content: what gets deleted comes from the
  // profile YAML, so it has to be the YAML of the version that was installed.
  // Resolving the current version instead is how `remove +profile` ended up
  // reporting success while leaving that profile's agent directories on disk.
  const source = opts.source
    ? await resolveContentSource({ source: opts.source })
    : await resolveContentSourceForVersion(
        manifest.source_version ?? manifest.arcane_version,
      );
  const root = await source.getContentRoot();

  const removedSkills: string[] = [];
  const removedAgents: string[] = [];
  const removedProfiles: string[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    if (item.startsWith("+")) {
      const profileName = item.slice(1);
      const result = removeProfile(
        root,
        target,
        profileName,
        manifest,
      );
      removedSkills.push(...result.skills);
      removedAgents.push(...result.agents);
      if (result.removed) removedProfiles.push(profileName);
      else skipped.push(item);
    } else {
      const result = removeSkill(root, target, item, manifest);
      if (result === "removed") removedSkills.push(item);
      else skipped.push(item);
    }
  }

  manifest.total_skills = manifest.installed_skills.length;
  manifest.total_rules =
    manifest.installed_rules.length;
  const mp = path.join(target, ".claude", "arcane-manifest.json");
  writeJsonSync(mp, manifest);

  const totalRemoved =
    removedSkills.length + removedAgents.length + removedProfiles.length;
  console.log(chalk.bold(`\nRemoved ${totalRemoved} items:`));
  for (const p of removedProfiles)
    console.log(chalk.magenta(`  [ok] +${p} (profile)`));
  for (const s of removedSkills)
    console.log(chalk.green(`  [ok] ${s} (skill)`));
  for (const a of removedAgents)
    console.log(chalk.cyan(`  [ok] ${a} (agent dir)`));
  for (const s of skipped)
    console.log(chalk.dim(`  [skip] ${s}`));
  if (totalRemoved > 0) console.log(chalk.dim(`  Removed files are in .claude/${TRASH_DIR}/`));
}

function removeSkill(
  root: string,
  target: string,
  skill: string,
  manifest: ReturnType<typeof readManifest> & {},
): "removed" | "skipped" {
  if (coreSkills(root).includes(skill)) {
    console.warn(
      chalk.yellow(`  WARNING: '${skill}' is a core skill. Skipping.`),
    );
    return "skipped";
  }

  const skillDir = path.join(target, ".claude", "skills", skill);
  if (!fs.existsSync(skillDir)) return "skipped";

  moveToTrash(path.join(target, ".claude"), path.join("skills", skill));
  manifest.installed_skills = manifest.installed_skills.filter(
    (s) => s !== skill,
  );
  return "removed";
}

function removeProfile(
  root: string,
  target: string,
  profileName: string,
  manifest: ReturnType<typeof readManifest> & {},
): { removed: boolean; skills: string[]; agents: string[] } {
  if (profileName === "core") {
    console.warn(
      chalk.yellow("  WARNING: Cannot remove core profile. Skipping."),
    );
    return { removed: false, skills: [], agents: [] };
  }

  // The command names what the user installed; workflows come with those profiles.
  const command = manifest.profile_command.split("+").filter(Boolean);
  // The manifest may hold a profile under the name it had when it was installed.
  const installedName = command.find((p) => sameProfile(p, profileName));
  if (!installedName) {
    const bringers = manifest.profiles.some((p) => sameProfile(p, profileName))
      ? ` It comes with another profile; remove that one instead.`
      : "";
    console.warn(
      chalk.yellow(`  WARNING: Profile '${profileName}' is not installed on its own.${bringers}`),
    );
    return { removed: false, skills: [], agents: [] };
  }

  const profilesDir = path.join(root, "profiles");
  if (!resolveProfile(profilesDir, installedName)) {
    console.warn(
      chalk.yellow(`  WARNING: Profile '${installedName}.yaml' not found.`),
    );
    return { removed: false, skills: [], agents: [] };
  }

  // What the profile brought, with its workflows, against what the rest still brings
  // (core included): only the difference goes.
  const profile = mergeProfiles(profilesDir, [installedName]);
  const remainingCommand = command.filter((p) => p !== installedName);
  const kept = mergeProfiles(profilesDir, remainingCommand);
  const sharedSkills = new Set(kept.skills);
  const sharedAgents = new Set(kept.agents);
  const sharedRules = new Set([...kept.rules.universal, ...kept.rules.gamedev]);

  const removedSkills: string[] = [];
  for (const skill of profile.skills) {
    if (sharedSkills.has(skill)) continue;
    const skillDir = path.join(target, ".claude", "skills", skill);
    if (fs.existsSync(skillDir)) {
      moveToTrash(path.join(target, ".claude"), path.join("skills", skill));
      removedSkills.push(skill);
    }
    manifest.installed_skills = manifest.installed_skills.filter(
      (s) => s !== skill,
    );
  }

  const removedAgents: string[] = [];
  const claudeDir = path.join(target, ".claude");
  for (const entry of profile.agents) {
    if (sharedAgents.has(entry)) continue;
    // A whole division still wanted by another active profile outranks this
    // granular entry: removing the file would break that profile.
    const { division } = parseAgentEntry(entry);
    if (isGranular(entry) && sharedAgents.has(division)) continue;

    if (removeAgentEntry(claudeDir, entry)) removedAgents.push(entry);
    manifest.installed_agents = manifest.installed_agents.filter(
      (a) => a !== entry,
    );
  }

  for (const rule of [
    ...profile.rules.universal,
    ...profile.rules.gamedev,
  ]) {
    if (sharedRules.has(rule)) continue;
    const ruleFile = path.join(target, ".claude", "rules", `${rule}.md`);
    if (fs.existsSync(ruleFile)) {
      moveToTrash(claudeDir, path.join("rules", `${rule}.md`));
    }
    manifest.installed_rules = manifest.installed_rules.filter(
      (r) => r !== rule,
    );
  }

  if (profileName === "statusline") {
    const statuslineFile = path.join(target, ".claude", "statusline.sh");
    if (fs.existsSync(statuslineFile)) {
      moveToTrash(claudeDir, "statusline.sh");
    }
    removeStatuslineFromSettings(path.join(target, ".claude"));
  }

  manifest.profiles = kept.loaded;
  manifest.profile_command = remainingCommand.join("+");

  return { removed: true, skills: removedSkills, agents: removedAgents };
}

function removeStatuslineFromSettings(claudeDir: string): void {
  const settingsPath = path.join(claudeDir, "settings.json");
  if (!fs.existsSync(settingsPath)) return;

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  } catch {
    console.warn(chalk.yellow("  WARNING: settings.json is not valid JSON; remove statusLine by hand."));
    return;
  }
  if (settings.statusLine) {
    delete settings.statusLine;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
  }
}
