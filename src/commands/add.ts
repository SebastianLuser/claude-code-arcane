import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { parseProfile } from "../profiles.js";
import { readManifest, writeManifest } from "../manifest.js";
import { copyDirSync } from "../utils.js";
import { resolveContentSource } from "../content-source.js";
import type { MergedProfile } from "../types.js";

export async function addCommand(items: string[]): Promise<void> {
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

  const added: string[] = [];
  const skipped: string[] = [];

  for (const item of items) {
    if (item.startsWith("+")) {
      const profileName = item.slice(1);
      const profilePath = path.join(root, "profiles", `${profileName}.yaml`);
      if (!fs.existsSync(profilePath)) {
        console.error(chalk.red(`  Profile '${profileName}' not found`));
        continue;
      }
      const profile = parseProfile(profilePath);
      for (const skill of profile.skills) {
        const result = addSkill(root, target, skill, manifest.installed_skills);
        if (result === "added") added.push(skill);
        else skipped.push(skill);
      }
      if (!manifest.profiles.includes(profileName)) {
        manifest.profiles.push(profileName);
      }
    } else {
      const result = addSkill(root, target, item, manifest.installed_skills);
      if (result === "added") added.push(item);
      else skipped.push(item);
    }
  }

  manifest.installed_skills.push(...added);
  manifest.total_skills = manifest.installed_skills.length;

  const merged: MergedProfile = {
    loaded: manifest.profiles,
    skills: manifest.installed_skills,
    rules: { universal: manifest.installed_rules, gamedev: [] },
    agents: manifest.installed_agents,
    hooks: [],
    permissions: { allow: [], deny: [] },
  };
  writeManifest(target, merged, manifest.profile_command, root);

  console.log(chalk.bold(`\nAdded ${added.length} skills:`));
  for (const s of added) console.log(chalk.green(`  [ok] ${s}`));
  for (const s of skipped)
    console.log(chalk.dim(`  [skip] ${s} (already installed)`));
}

function addSkill(
  root: string,
  target: string,
  skill: string,
  installed: string[],
): "added" | "skipped" {
  if (installed.includes(skill)) return "skipped";
  const src = path.join(root, "skills", skill);
  if (!fs.existsSync(src)) {
    console.error(chalk.red(`  Skill '${skill}' not found in skills/`));
    return "skipped";
  }
  const dst = path.join(target, ".claude", "skills", skill);
  copyDirSync(src, dst);
  return "added";
}
