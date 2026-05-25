import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { listProfiles } from "../profiles.js";
import { readManifest } from "../manifest.js";
import { getPackageRoot } from "../utils.js";

export async function listCommand(): Promise<void> {
  const root = getPackageRoot();
  const profilesDir = path.join(root, "profiles");
  const skillsDir = path.join(root, "skills");
  const target = process.cwd();
  const manifest = readManifest(target);

  const profiles = listProfiles(profilesDir);
  const bases = profiles.filter((p) => p.type === "base");
  const addons = profiles.filter((p) => p.type === "addon");

  const installedSkills = new Set(manifest?.installed_skills ?? []);

  console.log(chalk.bold("\n=== Available Profiles ===\n"));
  console.log(chalk.cyan("Base:"));
  for (const p of bases) {
    const tag = manifest?.profiles.includes(p.name)
      ? chalk.green(" [installed]")
      : "";
    console.log(
      `  ${chalk.green(p.name.padEnd(20))} ${p.description}${tag}`,
    );
  }
  console.log(chalk.cyan("\nAddons:"));
  for (const p of addons) {
    const tag = manifest?.profiles.includes(p.name)
      ? chalk.green(" [installed]")
      : "";
    console.log(
      `  ${chalk.green(("+" + p.name).padEnd(20))} ${p.description}${tag}`,
    );
  }

  if (fs.existsSync(skillsDir)) {
    const allSkills = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          !d.name.startsWith("_") &&
          fs.existsSync(path.join(skillsDir, d.name, "SKILL.md")),
      )
      .map((d) => d.name)
      .sort();

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
