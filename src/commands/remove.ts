import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { readManifest } from "../manifest.js";
import { getPackageRoot, writeJsonSync } from "../utils.js";

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

export async function removeCommand(skills: string[]): Promise<void> {
  const target = process.cwd();
  const manifest = readManifest(target);

  if (!manifest) {
    console.error(
      chalk.red(
        "No arcane-manifest.json found. Run `npx arcane install` first.",
      ),
    );
    process.exit(1);
  }

  const removed: string[] = [];
  const skipped: string[] = [];

  for (const skill of skills) {
    if (CORE_SKILLS.includes(skill)) {
      console.warn(
        chalk.yellow(`  WARNING: '${skill}' is a core skill. Skipping.`),
      );
      skipped.push(skill);
      continue;
    }

    const skillDir = path.join(target, ".claude", "skills", skill);
    if (!fs.existsSync(skillDir)) {
      skipped.push(skill);
      continue;
    }
    fs.rmSync(skillDir, { recursive: true, force: true });
    manifest.installed_skills = manifest.installed_skills.filter(
      (s) => s !== skill,
    );
    removed.push(skill);
  }

  manifest.total_skills = manifest.installed_skills.length;
  const manifestPath = path.join(target, ".claude", "arcane-manifest.json");
  writeJsonSync(manifestPath, manifest);

  console.log(chalk.bold(`\nRemoved ${removed.length} skills:`));
  for (const s of removed) console.log(chalk.green(`  [ok] ${s}`));
  for (const s of skipped)
    console.log(chalk.dim(`  [skip] ${s} (not installed or core)`));
}
