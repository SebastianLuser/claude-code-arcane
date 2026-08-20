import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { listProfiles, groupByCategory } from "../profiles.js";
import { listSkills } from "../skills-catalog.js";
import { readManifest } from "../manifest.js";
import { resolveContentSource } from "../content-source.js";

export async function listCommand(): Promise<void> {
  const source = await resolveContentSource({ quiet: true });
  const root = await source.getContentRoot();
  const profilesDir = path.join(root, "profiles");
  const skillsDir = path.join(root, "skills");
  const target = process.cwd();
  const manifest = readManifest(target);

  const profiles = listProfiles(profilesDir);
  const installedSkills = new Set(manifest?.installed_skills ?? []);

  console.log(chalk.bold("\n=== Available Profiles ===\n"));
  console.log(chalk.dim("Profiles combine freely: install a+b+c\n"));
  for (const group of groupByCategory(profiles)) {
    console.log(chalk.cyan(`${group.label}:`));
    for (const p of group.profiles) {
      const tag = manifest?.profiles.includes(p.name)
        ? chalk.green(" [installed]")
        : "";
      console.log(
        `  ${chalk.green(p.name.padEnd(20))} ${p.description}${tag}`,
      );
    }
    console.log();
  }

  if (fs.existsSync(skillsDir)) {
    const allSkills = listSkills(skillsDir).map((s) => s.name);

    console.log(chalk.bold(`\n=== Skills (${allSkills.length}) ===\n`));
    const cols = 3;
    for (let i = 0; i < allSkills.length; i += cols) {
      const row = allSkills.slice(i, i + cols).map((s) => {
        const tag = installedSkills.has(s) ? chalk.green("*") : " ";
        return `${tag} ${s.padEnd(30)}`;
      });
      console.log("  " + row.join(""));
    }
    if (manifest) {
      console.log(chalk.dim("\n  * = installed in current project"));
    }
  }
}
