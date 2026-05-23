import chalk from "chalk";
import { readManifest } from "../manifest.js";

export async function statusCommand(): Promise<void> {
  const target = process.cwd();
  const manifest = readManifest(target);

  if (!manifest) {
    console.log(
      chalk.yellow("No Arcane installation found in this project."),
    );
    console.log(chalk.dim("Run `npx arcane install <profile>` to install."));
    return;
  }

  const profiles = manifest.profiles.filter((p) => p !== "core");

  console.log(chalk.bold("\n=== Arcane Status ===\n"));
  console.log(`  Profiles:  ${chalk.cyan(profiles.join(" + "))}`);
  console.log(`  Installed: ${manifest.installed_at}`);
  console.log(`  Version:   ${manifest.arcane_version}`);
  console.log(`  CLI:       ${manifest.cli}`);
  console.log(`  Source:    ${chalk.dim(manifest.source)}`);

  if (manifest.worktree) {
    const wt = manifest.worktree;
    console.log(
      `  Worktree:  ${wt.is_worktree ? chalk.blue("yes") : "no"} (main: ${chalk.dim(wt.main_worktree)})`,
    );
    if (wt.shared_dirs.length > 0) {
      console.log(
        `  Shared:    ${chalk.blue(wt.shared_dirs.join(", "))} (symlinked)`,
      );
    }
  }

  console.log(chalk.bold(`\n  Skills (${manifest.total_skills}):`));
  const skills = manifest.installed_skills ?? [];
  for (let i = 0; i < skills.length; i += 5) {
    const row = skills
      .slice(i, i + 5)
      .map((s) => s.padEnd(25))
      .join("");
    console.log(`    ${row}`);
  }

  console.log(chalk.bold(`\n  Rules (${manifest.total_rules}):`));
  const rules = manifest.installed_rules ?? [];
  console.log(`    ${rules.join(", ")}`);

  console.log(chalk.bold("\n  Agents:"));
  const agents = manifest.installed_agents ?? [];
  console.log(`    ${agents.join(", ")}`);
  console.log();
}
