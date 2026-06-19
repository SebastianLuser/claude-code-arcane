import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import chalk from "chalk";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { readManifest } from "../manifest.js";
import { registerInstallation } from "../registry.js";
import { getPackageRoot } from "../utils.js";
import {
  getWorktreeInfo,
  createGitWorktree,
  defaultWorktreePath,
  detectPackageManager,
} from "../worktree.js";

interface WorktreeOpts {
  profile?: string;
  path?: string;
  base?: string;
  installDeps?: boolean;
  isolate?: boolean;
  dryRun?: boolean;
  share?: boolean;
}

export async function worktreeCommand(
  branch: string,
  opts: WorktreeOpts,
): Promise<void> {
  const cwd = process.cwd();

  const wtInfo = getWorktreeInfo(cwd);
  if (!wtInfo) {
    console.error(chalk.red("Not a git repository."));
    process.exit(1);
  }

  const repoRoot = wtInfo.isWorktree ? wtInfo.mainWorktreePath : cwd;
  const worktreePath = opts.path
    ? path.resolve(opts.path)
    : defaultWorktreePath(repoRoot, branch);

  if (fs.existsSync(worktreePath)) {
    console.error(
      chalk.red(`Path already exists: ${worktreePath}`),
    );
    process.exit(1);
  }

  let profileExpr = opts.profile;
  if (!profileExpr) {
    const manifest = readManifest(cwd);
    if (manifest) {
      profileExpr = manifest.profile_command;
      console.log(
        chalk.dim(
          `  Inheriting profile from current installation: ${profileExpr}`,
        ),
      );
    }
  }

  if (!profileExpr) {
    console.error(
      chalk.red(
        "No profile specified and no existing installation to inherit from.\n" +
          "Use --profile to specify one: npx arcane worktree feat/api --profile backend-ts+agile",
      ),
    );
    process.exit(1);
  }

  console.log(chalk.bold("\nCreating worktree:"));
  console.log(`  Branch:  ${chalk.cyan(branch)}`);
  console.log(`  Path:    ${worktreePath}`);
  console.log(`  Profile: ${chalk.green(profileExpr)}`);
  if (opts.base) console.log(`  Base:    ${opts.base}`);

  if (opts.dryRun) {
    console.log(chalk.yellow("\n  [dry-run] Would create worktree and install Arcane."));
    return;
  }

  console.log("\n  Creating git worktree...");
  try {
    createGitWorktree(repoRoot, worktreePath, branch, opts.base);
    console.log(chalk.green("  [ok] Git worktree created"));
  } catch (err) {
    console.error(
      chalk.red(`  Failed to create worktree: ${(err as Error).message}`),
    );
    process.exit(1);
  }

  console.log("  Installing Arcane...");
  const root = getPackageRoot();
  const profilesDir = path.join(root, "profiles");
  const profileNames = profileExpr.split("+").filter(Boolean);
  const merged = mergeProfiles(profilesDir, profileNames);

  const shareFrom = opts.share !== false ? cwd : undefined;

  const installer = new Installer(merged, {
    target: worktreePath,
    dryRun: false,
    force: true,
    shareFrom,
  });

  installer.run(profileExpr, {
    is_worktree: true,
    main_worktree: repoRoot,
  });
  registerInstallation(worktreePath);
  console.log(chalk.green("  [ok] Arcane installed"));

  if (opts.installDeps) {
    const pm = detectPackageManager(worktreePath);
    if (pm) {
      console.log(`  Running ${pm.command}...`);
      try {
        execSync(pm.command, {
          cwd: worktreePath,
          encoding: "utf-8",
          stdio: "pipe",
          timeout: 120_000,
        });
        console.log(chalk.green(`  [ok] Dependencies installed`));
      } catch {
        console.warn(
          chalk.yellow("  WARN: Dependency install failed. Run manually."),
        );
      }
    }
  }

  if (opts.isolate) {
    const isolateScript = path.join(
      worktreePath,
      ".claude",
      "skills",
      "worktree-isolation",
    );
    if (fs.existsSync(isolateScript)) {
      console.log("  Applying worktree isolation...");
      try {
        execSync(
          "python3 scripts/apply.py --cwd . --verbose --force",
          {
            cwd: isolateScript,
            encoding: "utf-8",
            stdio: "pipe",
            timeout: 30_000,
          },
        );
        console.log(chalk.green("  [ok] Worktree isolation applied"));
      } catch {
        console.warn(
          chalk.yellow(
            "  WARN: Worktree isolation failed. Run /worktree-isolation manually.",
          ),
        );
      }
    } else {
      console.warn(
        chalk.yellow(
          "  WARN: worktree-isolation skill not installed. Add it with: npx arcane add worktree-isolation",
        ),
      );
    }
  }

  console.log(chalk.bold.green("\nWorktree ready:"));
  console.log(`  ${chalk.cyan(`cd ${worktreePath}`)}`);
  console.log(`  ${chalk.dim("claude")}\n`);
}
