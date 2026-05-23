import chalk from "chalk";
import { clean } from "../installer.js";
import { readManifest } from "../manifest.js";

interface CleanOpts {
  force?: boolean;
}

export async function cleanCommand(opts: CleanOpts): Promise<void> {
  const target = process.cwd();
  const manifest = readManifest(target);

  if (!manifest) {
    console.log(chalk.yellow("No Arcane installation found."));
    return;
  }

  console.log(chalk.bold("\nThis will remove:"));
  console.log(`  - ${manifest.total_skills} skills in .claude/skills/`);
  console.log(`  - ${manifest.total_rules} rules in .claude/rules/`);
  console.log(
    `  - ${manifest.installed_agents?.length ?? 0} agent dirs in .claude/agents/`,
  );
  console.log("  - hooks/ directory");
  console.log("  - settings.json");
  console.log("  - arcane-manifest.json");

  if (!opts.force) {
    console.log(
      chalk.yellow("\n  Pass --force to confirm removal.\n"),
    );
    return;
  }

  clean(target);
  console.log(
    chalk.green("\n  Run `npx arcane install` to reinstall.\n"),
  );
}
