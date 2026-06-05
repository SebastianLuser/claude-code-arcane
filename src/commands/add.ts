import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { parseProfile } from "../profiles.js";
import { readManifest, writeManifest } from "../manifest.js";
import { copyDirSync, ensureDir, readJsonSync, writeJsonSync } from "../utils.js";
import { resolveContentSource } from "../content-source.js";
import type { MergedProfile } from "../types.js";

type AddResult = "added" | "skipped" | "not-found";

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

  const claudeDir = path.join(target, ".claude");
  const added: string[] = [];
  const skipped: string[] = [];
  const notFound: string[] = [];
  const addedRules: string[] = [];
  const addedAgents: string[] = [];
  let statuslineAdded = false;

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
        else if (result === "not-found") notFound.push(skill);
        else skipped.push(skill);
      }

      for (const rule of profile.rules.universal) {
        if (!manifest.installed_rules.includes(rule)) {
          const src = path.join(root, "rules", `${rule}.md`);
          if (fs.existsSync(src)) {
            ensureDir(path.join(claudeDir, "rules"));
            fs.copyFileSync(src, path.join(claudeDir, "rules", `${rule}.md`));
            manifest.installed_rules.push(rule);
            addedRules.push(rule);
          }
        }
      }

      for (const rule of profile.rules.gamedev) {
        if (!manifest.installed_rules.includes(rule)) {
          const src = path.join(root, "rules", "gamedev", `${rule}.md`);
          if (fs.existsSync(src)) {
            ensureDir(path.join(claudeDir, "rules"));
            fs.copyFileSync(src, path.join(claudeDir, "rules", `${rule}.md`));
            manifest.installed_rules.push(rule);
            addedRules.push(rule);
          }
        }
      }

      for (const agentDir of profile.agents) {
        if (!manifest.installed_agents.includes(agentDir)) {
          const src = path.join(root, "agents", agentDir);
          if (fs.existsSync(src)) {
            const dst = path.join(claudeDir, "agents", agentDir);
            copyDirSync(src, dst);
            manifest.installed_agents.push(agentDir);
            addedAgents.push(agentDir);
          }
        }
      }

      if (profileName === "statusline") {
        const statuslineSrc = path.join(root, "hooks", "statusline.sh");
        if (fs.existsSync(statuslineSrc)) {
          fs.copyFileSync(statuslineSrc, path.join(claudeDir, "statusline.sh"));
          statuslineAdded = true;
        }
      }

      if (profile.permissions.allow.length > 0 || profile.permissions.deny.length > 0) {
        mergePermissions(claudeDir, profile.permissions);
      }

      if (!manifest.profiles.includes(profileName)) {
        manifest.profiles.push(profileName);
        manifest.profile_command = manifest.profiles
          .filter((p) => p !== "core")
          .join("+");
      }

      if (statuslineAdded) {
        addStatuslineToSettings(claudeDir);
      }
    } else {
      const result = addSkill(root, target, item, manifest.installed_skills);
      if (result === "added") added.push(item);
      else if (result === "not-found") notFound.push(item);
      else skipped.push(item);
    }
  }

  manifest.installed_skills.push(...added);
  manifest.total_skills = manifest.installed_skills.length;
  manifest.total_rules = manifest.installed_rules.length;

  const merged: MergedProfile = {
    loaded: manifest.profiles,
    skills: manifest.installed_skills,
    rules: { universal: manifest.installed_rules, gamedev: [] },
    agents: manifest.installed_agents,
    hooks: [],
    permissions: { allow: [], deny: [] },
  };
  writeManifest(target, merged, manifest.profile_command, root);

  const totalAdded = added.length + addedRules.length + addedAgents.length + (statuslineAdded ? 1 : 0);
  console.log(chalk.bold(`\nAdded ${totalAdded} items:`));
  for (const s of added) console.log(chalk.green(`  [ok] skill: ${s}`));
  for (const r of addedRules) console.log(chalk.green(`  [ok] rule: ${r}`));
  for (const a of addedAgents) console.log(chalk.green(`  [ok] agents: ${a}/`));
  if (statuslineAdded) console.log(chalk.green("  [ok] statusline.sh"));
  for (const s of skipped)
    console.log(chalk.dim(`  [skip] ${s} (already installed)`));
  for (const s of notFound)
    console.log(chalk.red(`  [miss] ${s} (not found in source)`));
}

function addSkill(
  root: string,
  target: string,
  skill: string,
  installed: string[],
): AddResult {
  if (installed.includes(skill)) return "skipped";
  const src = path.join(root, "skills", skill);
  if (!fs.existsSync(src)) return "not-found";
  const dst = path.join(target, ".claude", "skills", skill);
  copyDirSync(src, dst);
  return "added";
}

function mergePermissions(
  claudeDir: string,
  newPerms: { allow: string[]; deny: string[] },
): void {
  const settingsPath = path.join(claudeDir, "settings.json");
  if (!fs.existsSync(settingsPath)) return;

  const settings = readJsonSync<Record<string, unknown>>(settingsPath);
  const perms = (settings.permissions ?? { allow: [], deny: [] }) as {
    allow: string[];
    deny: string[];
  };

  const allowSet = new Set(perms.allow);
  for (const a of newPerms.allow) allowSet.add(a);
  perms.allow = [...allowSet];

  const denySet = new Set(perms.deny);
  for (const d of newPerms.deny) denySet.add(d);
  perms.deny = [...denySet];

  settings.permissions = perms;
  writeJsonSync(settingsPath, settings);
}

function addStatuslineToSettings(claudeDir: string): void {
  const settingsPath = path.join(claudeDir, "settings.json");
  if (!fs.existsSync(settingsPath)) return;

  const settings = readJsonSync<Record<string, unknown>>(settingsPath);
  if (settings.statusLine) return;

  settings.statusLine = {
    type: "command",
    command: "bash .claude/statusline.sh",
  };
  writeJsonSync(settingsPath, settings);
}
