import path from "node:path";
import chalk from "chalk";
import { listProfiles, mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import {
  getWorktreeInfo,
  findMainArcaneInstall,
} from "../worktree.js";
import { resolveContentSource, type SourcePreference } from "../content-source.js";
import { registerInstallation } from "../registry.js";

interface InstallOpts {
  target?: string;
  dryRun?: boolean;
  force?: boolean;
  shareFrom?: string;
  source?: SourcePreference;
}

export async function installCommand(
  profileExpr: string | undefined,
  opts: InstallOpts,
): Promise<void> {
  const source = await resolveContentSource({
    source: opts.source ?? "auto",
    quiet: !profileExpr,
  });
  const root = await source.getContentRoot();
  const profilesDir = path.join(root, "profiles");
  const target = path.resolve(opts.target ?? process.cwd());

  if (!profileExpr) {
    const profiles = listProfiles(profilesDir);
    const bases = profiles.filter((p) => p.type === "base");
    const addons = profiles.filter((p) => p.type === "addon");

    console.log(chalk.bold("\nAvailable profiles:\n"));
    console.log(chalk.cyan("  Base (pick one):"));
    for (const p of bases) {
      console.log(`    ${chalk.green(p.name.padEnd(20))} ${p.description}`);
    }
    console.log(chalk.cyan("\n  Addons (combine with +):"));
    for (const p of addons) {
      console.log(
        `    ${chalk.green(("+" + p.name).padEnd(20))} ${p.description}`,
      );
    }
    console.log(
      chalk.dim("\n  Usage: npx arcane install backend-ts+agile+testing\n"),
    );
    return;
  }

  const profileNames = profileExpr.split("+").filter(Boolean);
  console.log(
    chalk.bold(`\nInstalling profile: ${chalk.cyan(profileExpr)}`),
  );
  console.log(`  Target: ${target}`);

  const wtInfo = getWorktreeInfo(target);
  let shareFrom = opts.shareFrom;
  let worktreeMeta:
    | { is_worktree: boolean; main_worktree: string }
    | undefined;

  if (wtInfo?.isWorktree) {
    console.log(chalk.blue(`  Worktree: yes (main: ${wtInfo.mainWorktreePath})`));
    worktreeMeta = {
      is_worktree: true,
      main_worktree: wtInfo.mainWorktreePath,
    };

    if (!shareFrom && findMainArcaneInstall(wtInfo.mainWorktreePath)) {
      shareFrom = wtInfo.mainWorktreePath;
      console.log(
        chalk.blue("  Sharing: hooks + docs from main worktree"),
      );
    }
  } else if (wtInfo) {
    worktreeMeta = { is_worktree: false, main_worktree: target };
  }

  if (opts.dryRun) console.log(chalk.yellow("  Mode: dry-run\n"));

  const merged = mergeProfiles(profilesDir, profileNames);

  console.log(`  Profiles loaded: ${merged.loaded.join(", ")}`);
  console.log(`  Skills: ${merged.skills.length}`);
  console.log(
    `  Rules: ${merged.rules.universal.length + merged.rules.gamedev.length}`,
  );
  console.log(`  Agents: ${merged.agents.length}`);

  const installer = new Installer(merged, {
    target,
    dryRun: opts.dryRun ?? false,
    force: opts.force ?? false,
    shareFrom,
    contentRoot: root,
  });
  installer.run(profileExpr, worktreeMeta);

  if (!opts.dryRun) {
    registerInstallation(target);
    console.log(chalk.green("\n  Installation complete."));
  }
}
