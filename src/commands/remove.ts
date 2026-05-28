import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { readManifest } from "../manifest.js";
import { parseProfile } from "../profiles.js";
import { writeJsonSync } from "../utils.js";
import { resolveContentSource } from "../content-source.js";

const CORE_SKILLS = [
  "commit",
  "create-pr",
  "changelog",
  "check",
  "code-review",
  "context-prime",
  "help",
  "start",
  "fix-issue",
  "hotfix",
  "brainstorm",
  "scope-check",
  "reverse-document",
  "skill-improve",
  "skill-test",
  "tech-debt",
  "arcane-status",
  "arcane-list",
  "arcane-add",
  "arcane-remove",
  "arcane-clean",
];

export async function removeCommand(items: string[]): Promise<void> {
  const target = process.cwd();
  const source = await resolveContentSource({ quiet: true });
  const root = await source.getContentRoot();
  const manifest = readManifest(target);

  if (!manifest) {
    console.error(
      chalk.red(
        "No arcane-manifest.json found. Run `npx arcane install` first.",
      ),
    );
    process.exit(1);
  }

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
      const result = removeSkill(target, item, manifest);
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
}

function removeSkill(
  target: string,
  skill: string,
  manifest: ReturnType<typeof readManifest> & {},
): "removed" | "skipped" {
  if (CORE_SKILLS.includes(skill)) {
    console.warn(
      chalk.yellow(`  WARNING: '${skill}' is a core skill. Skipping.`),
    );
    return "skipped";
  }

  const skillDir = path.join(target, ".claude", "skills", skill);
  if (!fs.existsSync(skillDir)) return "skipped";

  fs.rmSync(skillDir, { recursive: true, force: true });
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

  if (!manifest.profiles.includes(profileName)) {
    console.warn(
      chalk.yellow(`  WARNING: Profile '${profileName}' is not installed.`),
    );
    return { removed: false, skills: [], agents: [] };
  }

  const profilePath = path.join(root, "profiles", `${profileName}.yaml`);
  if (!fs.existsSync(profilePath)) {
    console.warn(
      chalk.yellow(`  WARNING: Profile '${profileName}.yaml' not found.`),
    );
    return { removed: false, skills: [], agents: [] };
  }

  const profile = parseProfile(profilePath);

  const remainingProfiles = manifest.profiles.filter(
    (p) => p !== profileName,
  );
  const sharedSkills = new Set<string>();
  const sharedAgents = new Set<string>();
  const sharedRules = new Set<string>();

  for (const rp of remainingProfiles) {
    const rpPath = path.join(root, "profiles", `${rp}.yaml`);
    if (!fs.existsSync(rpPath)) continue;
    const rpDef = parseProfile(rpPath);
    rpDef.skills.forEach((s) => sharedSkills.add(s));
    rpDef.agents.forEach((a) => sharedAgents.add(a));
    rpDef.rules.universal.forEach((r) => sharedRules.add(r));
    rpDef.rules.gamedev.forEach((r) => sharedRules.add(r));
  }

  const removedSkills: string[] = [];
  for (const skill of profile.skills) {
    if (sharedSkills.has(skill)) continue;
    if (CORE_SKILLS.includes(skill)) continue;
    const skillDir = path.join(target, ".claude", "skills", skill);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
      removedSkills.push(skill);
    }
    manifest.installed_skills = manifest.installed_skills.filter(
      (s) => s !== skill,
    );
  }

  const removedAgents: string[] = [];
  for (const agent of profile.agents) {
    if (sharedAgents.has(agent)) continue;
    const agentDir = path.join(target, ".claude", "agents", agent);
    if (fs.existsSync(agentDir)) {
      fs.rmSync(agentDir, { recursive: true, force: true });
      removedAgents.push(agent);
    }
    manifest.installed_agents = manifest.installed_agents.filter(
      (a) => a !== agent,
    );
  }

  for (const rule of [
    ...profile.rules.universal,
    ...profile.rules.gamedev,
  ]) {
    if (sharedRules.has(rule)) continue;
    const ruleFile = path.join(target, ".claude", "rules", `${rule}.md`);
    if (fs.existsSync(ruleFile)) {
      fs.rmSync(ruleFile);
    }
    manifest.installed_rules = manifest.installed_rules.filter(
      (r) => r !== rule,
    );
  }

  manifest.profiles = remainingProfiles;
  manifest.profile_command = remainingProfiles
    .filter((p) => p !== "core")
    .join("+");

  return { removed: true, skills: removedSkills, agents: removedAgents };
}
