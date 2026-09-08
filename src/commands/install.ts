import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import * as p from "@clack/prompts";
import { listProfiles, mergeProfiles, groupByCategory } from "../profiles.js";
import { detectStack } from "../detect.js";
import { runInstallWizard } from "../wizard.js";
import { Installer } from "../installer.js";
import { getPackageRoot } from "../utils.js";
import {
  getWorktreeInfo,
  findMainArcaneInstall,
} from "../worktree.js";
import { resolveContentSource, type SourcePreference } from "../content-source.js";
import { registerInstallation } from "../registry.js";

const PACKAGE_NAME = "claude-code-arcane";

interface InstallOpts {
  target?: string;
  dryRun?: boolean;
  force?: boolean;
  shareFrom?: string;
  source?: SourcePreference;
}

/**
 * Is `dir` a copy of Arcane's own source tree rather than a project to install into?
 *
 * Matched on the package name, not on marker directories: `profiles/` and `skills/`
 * also exist in the content cache and can exist in a user's repo by coincidence,
 * while the name is exact.
 */
export function isArcaneSourceTree(dir: string): boolean {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(dir, "package.json"), "utf-8"),
    ) as { name?: string };
    return pkg.name === PACKAGE_NAME;
  } catch {
    return false;
  }
}

/**
 * Stop an install that would land in Arcane's own source tree instead of a project.
 *
 * A first-time user downloaded the source zip from the Releases page and ran the
 * install inside the extracted folder. `install` targets the current directory, so
 * that deploys the whole profile — 94 skills and four agent divisions for
 * backend-ts+agile — into a download they were about to delete, and reports success.
 * Nothing in the output said the target was wrong, because as far as the installer
 * knew it wasn't.
 *
 * A dry-run is let through: it writes nothing, and seeing the resolved target is
 * exactly how someone notices the mistake. `--force` is the non-interactive escape,
 * which is also how this repo installs into its own `.claude/` for dogfooding.
 *
 * Returns true when the caller should stop.
 */
async function refusesSelfInstall(
  target: string,
  profileExpr: string | undefined,
  opts: InstallOpts,
): Promise<boolean> {
  if (!isArcaneSourceTree(target)) return false;

  console.log(
    chalk.yellow("\n  This directory is Arcane's own source tree, not a project."),
  );
  console.log(chalk.dim(`  Target: ${target}`));

  if (opts.force || opts.dryRun) return false;

  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const proceed = interactive
    ? await p.confirm({ message: "Install here anyway?", initialValue: false })
    : false;

  if (!p.isCancel(proceed) && proceed) return false;

  console.log(
    chalk.dim(
      `\n  cd to your project first, then: npx ${PACKAGE_NAME} install ${profileExpr ?? "<profile>"}`,
    ),
  );
  console.log(chalk.dim("  Or pass --force to install here on purpose.\n"));
  return true;
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

  // Before the wizard, not after: picking profiles first and then being turned away
  // is worse than being told the target is wrong while it can still be fixed.
  if (await refusesSelfInstall(target, profileExpr, opts)) return;

  if (!profileExpr) {
    const profiles = listProfiles(profilesDir);

    if (process.stdin.isTTY && process.stdout.isTTY) {
      const selected = await runInstallWizard(profiles, detectStack(target));
      if (!selected) return;
      profileExpr = selected.join("+");
    } else {
      console.log(chalk.bold("\nAvailable profiles (combine freely with +):\n"));
      for (const group of groupByCategory(profiles)) {
        console.log(chalk.cyan(`  ${group.label}:`));
        for (const p of group.profiles) {
          console.log(
            `    ${chalk.green(p.name.padEnd(20))} ${p.description}`,
          );
        }
        console.log();
      }
      console.log(
        chalk.dim("  Usage: npx claude-code-arcane install backend-ts+agile+testing\n"),
      );
      return;
    }
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
