import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { parseProfile, listProfiles, groupByCategory } from "../profiles.js";
import { listSkills } from "../skills-catalog.js";
import { runAddWizard } from "../wizard.js";
import { readManifest, updateManifestFields } from "../manifest.js";
import {
  agentEntryLabel,
  copyAgentEntry,
  isGranular,
  parseAgentEntry,
} from "../agent-entries.js";
import { copyDirSync, ensureDir, readJsonSync, writeJsonSync } from "../utils.js";
import { resolveContentSource } from "../content-source.js";
import { computeContentHashes } from "../content-hash.js";
import type { ArcaneManifest } from "../types.js";

type AddResult = "added" | "skipped" | "not-found";

export async function addCommand(items: string[] = []): Promise<void> {
  const target = process.cwd();
  const source = await resolveContentSource({ quiet: true });
  const root = await source.getContentRoot();
  const manifest = readManifest(target);

  if (!manifest) {
    console.error(
      chalk.red(
        "No arcane-manifest.json found. Run `npx claude-code-arcane install` first.",
      ),
    );
    process.exit(1);
  }

  if (items.length === 0) {
    if (!(process.stdin.isTTY && process.stdout.isTTY)) {
      printCatalog(root, manifest.profiles, manifest.installed_skills);
      return;
    }
    const selected = await runAddWizard({
      profiles: listProfiles(path.join(root, "profiles")),
      skills: listSkills(path.join(root, "skills")),
      installedProfiles: manifest.profiles,
      installedSkills: manifest.installed_skills,
    });
    if (!selected) return;
    items = selected;
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

      for (const entry of profile.agents) {
        // A division already installed covers its own agents, so a granular
        // entry under it is a no-op rather than a second copy.
        const { division } = parseAgentEntry(entry);
        if (manifest.installed_agents.includes(entry)) continue;
        if (isGranular(entry) && manifest.installed_agents.includes(division)) continue;

        if (copyAgentEntry(root, claudeDir, entry) !== null) {
          manifest.installed_agents.push(entry);
          addedAgents.push(entry);
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

  persistAdditions(target, claudeDir, manifest, {
    skills: added,
    rules: addedRules,
    agents: addedAgents,
  });

  const totalAdded =
    added.length + addedRules.length + addedAgents.length + (statuslineAdded ? 1 : 0);

  console.log(
    chalk.bold(
      totalAdded === 0 ? "\nNothing added." : `\nAdded ${totalAdded} items:`,
    ),
  );
  for (const s of added) console.log(chalk.green(`  [ok] skill: ${s}`));
  for (const r of addedRules) console.log(chalk.green(`  [ok] rule: ${r}`));
  for (const a of addedAgents) console.log(chalk.green(`  [ok] ${agentEntryLabel(a)}`));
  if (statuslineAdded) console.log(chalk.green("  [ok] statusline.sh"));
  for (const s of skipped)
    console.log(chalk.dim(`  [skip] ${s} (already installed)`));
  for (const s of notFound)
    console.log(chalk.red(`  [miss] ${s} (not found in source)`));
  if (totalAdded > 0) {
    console.log(
      chalk.dim(
        `\n  Now installed: ${manifest.installed_skills.length} skills, ${manifest.installed_rules.length} rules, ${manifest.installed_agents.length} agents.`,
      ),
    );
  }
}

/**
 * Persist what `add` just installed, touching only the fields it changed.
 *
 * It used to call writeManifest(), which rebuilds the file from a MergedProfile and keeps
 * nothing that is not in one - `content_hashes` included. So a single `arcane add` erased
 * the update plan's memory of what Arcane had installed: locally edited skills lost the
 * skip-customized protection that needs a manifest hash to detect, and `installed_at`,
 * `source_version` and the worktree block were rewritten as a side effect of adding one
 * skill.
 *
 * The hashes are extended, never recomputed wholesale. computeContentHashes() reads the
 * entire `.claude/` tree, so storing all of it would have the manifest claim hand-written
 * skills sitting next to the installed ones - and `update` deletes what the manifest
 * claims. An install with no hashes at all stays that way: ownership then falls back to
 * the installed_* lists, which this does update, and inventing a partial hash map would
 * make everything absent from it look foreign.
 */
function persistAdditions(
  target: string,
  claudeDir: string,
  manifest: ArcaneManifest,
  addedItems: { skills: string[]; rules: string[]; agents: string[] },
): void {
  const updates: Partial<ArcaneManifest> = {
    profiles: manifest.profiles,
    profile_command: manifest.profile_command,
    installed_skills: manifest.installed_skills,
    installed_rules: manifest.installed_rules,
    installed_agents: manifest.installed_agents,
    total_skills: manifest.total_skills,
    total_rules: manifest.total_rules,
    updated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  };

  const hashes = manifest.content_hashes;
  if (hashes) {
    const fresh = computeContentHashes(claudeDir);
    for (const skill of addedItems.skills) {
      if (fresh.skills[skill]) hashes.skills[skill] = fresh.skills[skill];
    }
    for (const rule of addedItems.rules) {
      const key = rule.endsWith(".md") ? rule : `${rule}.md`;
      if (fresh.rules[key]) hashes.rules[key] = fresh.rules[key];
    }
    for (const entry of addedItems.agents) {
      const { division } = parseAgentEntry(entry);
      if (fresh.agents[division]) hashes.agents[division] = fresh.agents[division];
    }
    updates.content_hashes = hashes;
  }

  updateManifestFields(target, updates);
}

/**
 * Fallback for `add` with no arguments outside a TTY (CI, piped output):
 * the wizard needs a terminal, so print what could be added instead.
 */
function printCatalog(
  root: string,
  installedProfiles: string[],
  installedSkills: string[],
): void {
  const profiles = listProfiles(path.join(root, "profiles")).filter(
    (pr) => !installedProfiles.includes(pr.name),
  );
  const skills = listSkills(path.join(root, "skills")).filter(
    (sk) => !installedSkills.includes(sk.name),
  );

  if (profiles.length === 0 && skills.length === 0) {
    console.log(chalk.dim("\nEverything in the catalog is already installed.\n"));
    return;
  }

  console.log(chalk.bold("\nProfiles you can add:\n"));
  for (const group of groupByCategory(profiles)) {
    console.log(chalk.cyan(`  ${group.label}:`));
    for (const pr of group.profiles) {
      console.log(
        `    ${chalk.green(`+${pr.name}`.padEnd(20))} ${pr.description}`,
      );
    }
    console.log();
  }
  console.log(
    chalk.dim(`  Plus ${skills.length} individual skills — see \`arcane list\`.`),
  );
  console.log(
    chalk.dim("  Usage: npx claude-code-arcane add +testing docker-setup\n"),
  );
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
