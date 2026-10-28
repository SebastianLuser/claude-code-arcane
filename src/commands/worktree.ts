import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import chalk from "chalk";
import { mergeProfiles } from "../profiles.js";
import { Installer } from "../installer.js";
import { readManifest } from "../manifest.js";
import { registerInstallation } from "../registry.js";
import { resolveContentSourceForVersion } from "../content-source.js";
import {
  getWorktreeInfo,
  checkBranchExists,
  createGitWorktree,
  defaultWorktreePath,
  detectPackageManager,
  findMainArcaneInstall,
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
  const wtInfo = getWorktreeInfo(process.cwd());
  if (!wtInfo) {
    console.error(chalk.red("Not a git repository."));
    process.exit(1);
  }

  // From a subdirectory or another worktree, the manifest is at this checkout's
  // root and the new worktree belongs next to the main checkout.
  const here = wtInfo.toplevel;
  const repoRoot = wtInfo.mainWorktreePath;
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
    const manifest = readManifest(here);
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
          "Use --profile to specify one: npx claude-code-arcane worktree feat/api --profile backend-typescript+agile",
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

  // Before the worktree exists: a source that cannot be resolved leaves nothing behind.
  // The main checkout's version, because its hooks and docs are what gets shared.
  const source = await resolveContentSourceForVersion(
    readManifest(repoRoot)?.source_version,
  );
  const root = await source.getContentRoot();
  const merged = mergeProfiles(
    path.join(root, "profiles"),
    profileExpr.split("+").filter(Boolean),
  );

  console.log("\n  Creating git worktree...");
  const branchExisted = checkBranchExists(repoRoot, branch);
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
  // Shared from the main checkout: a link into another worktree breaks when that one is removed.
  const shareFrom =
    opts.share !== false && findMainArcaneInstall(repoRoot) ? repoRoot : undefined;

  try {
    const installer = new Installer(merged, {
      target: worktreePath,
      dryRun: false,
      force: true,
      shareFrom,
      contentRoot: root,
      sourceVersion: await source.getVersion(),
      sourceType: source.type,
    });
    installer.run(profileExpr, {
      is_worktree: true,
      main_worktree: repoRoot,
    });
  } catch (err) {
    // The worktree was created a moment ago and holds nothing of the user's yet.
    execFileSync("git", ["worktree", "remove", "--force", worktreePath], { cwd: repoRoot, stdio: "pipe" });
    if (!branchExisted) execFileSync("git", ["branch", "-D", branch], { cwd: repoRoot, stdio: "pipe" });
    console.error(chalk.red(`  Install failed, worktree removed: ${(err as Error).message}`));
    process.exit(1);
  }
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
        execFileSync(
          process.execPath,
          ["scripts/apply.mjs", "--cwd", worktreePath, "--verbose", "--force"],
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
          "  WARN: worktree-isolation skill not installed. Add it with: npx claude-code-arcane add worktree-isolation",
        ),
      );
    }
  }

  console.log(chalk.bold.green("\nWorktree ready:"));
  console.log(`  ${chalk.cyan(`cd ${worktreePath}`)}`);
  console.log(`  ${chalk.dim("claude")}\n`);
}
