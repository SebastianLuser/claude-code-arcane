#!/usr/bin/env node

import { Command } from "commander";
import { installCommand } from "./commands/install.js";
import { addCommand } from "./commands/add.js";
import { removeCommand } from "./commands/remove.js";
import { listCommand } from "./commands/list.js";
import { statusCommand } from "./commands/status.js";
import { updateCommand } from "./commands/update.js";
import { cleanCommand } from "./commands/clean.js";
import { worktreeCommand } from "./commands/worktree.js";
import { globalCommand } from "./commands/global.js";
import { getPackageVersion } from "./utils.js";

const program = new Command();

program
  .name("arcane")
  .description(
    "Claude Code Arcane — Skills, agents, hooks and rules for Claude Code",
  )
  .version(getPackageVersion());

program
  .command("install [profile]")
  .description(
    "Install a profile (e.g., backend-ts+agile). Without args, shows available profiles.",
  )
  .option("-t, --target <dir>", "Target project directory", process.cwd())
  .option("-n, --dry-run", "Show what would be installed without changing files")
  .option("-f, --force", "Overwrite without backup prompt")
  .option(
    "-s, --share-from <dir>",
    "Share hooks/docs from an existing Arcane installation (e.g., main worktree)",
  )
  .option("--source <source>", "Content source: auto, github, or bundled", "auto")
  .action(async (profile: string | undefined, opts) => {
    await installCommand(profile, opts);
  });

program
  .command("add <items...>")
  .description(
    "Add skills or profiles. Use +profileName for profiles, skillName for individual skills.",
  )
  .action(async (items: string[]) => {
    await addCommand(items);
  });

program
  .command("remove <items...>")
  .description(
    "Remove skills or profiles. Use +profileName for profiles, skillName for individual skills.",
  )
  .action(async (items: string[]) => {
    await removeCommand(items);
  });

program
  .command("list")
  .description("List all available profiles and skills.")
  .action(async () => {
    await listCommand();
  });

program
  .command("status")
  .description("Show current Arcane installation status.")
  .action(async () => {
    await statusCommand();
  });

program
  .command("update")
  .description("Update installed Arcane content to latest version.")
  .option("-q, --quiet", "Quiet mode for hook usage")
  .option("-n, --dry-run", "Show what would change without applying")
  .option("-f, --force", "Overwrite even locally modified files")
  .option("--source <source>", "Content source: auto, github, or bundled", "auto")
  .action(async (opts) => {
    await updateCommand(opts);
  });

program
  .command("clean")
  .description("Remove Arcane installation from current project.")
  .option("-f, --force", "Skip confirmation")
  .action(async (opts) => {
    await cleanCommand(opts);
  });

program
  .command("worktree <branch>")
  .description(
    "Create a git worktree with Arcane pre-installed.",
  )
  .option(
    "-p, --profile <profile>",
    "Profile to install (inherits from current installation if omitted)",
  )
  .option("--path <dir>", "Custom worktree directory path")
  .option(
    "-b, --base <branch>",
    "Base branch for new branch (default: current HEAD)",
  )
  .option("--install-deps", "Install dependencies after creation")
  .option(
    "--isolate",
    "Apply worktree-isolation for Docker port deconfliction",
  )
  .option("-n, --dry-run", "Show what would be done without making changes")
  .option("--no-share", "Don't share hooks/docs from current installation")
  .action(async (branch: string, opts) => {
    await worktreeCommand(branch, opts);
  });

program
  .command("global")
  .description(
    "Install or manage global hooks (worktree-isolation auto-apply on SessionStart).",
  )
  .option("--remove", "Remove global hooks")
  .option("--status", "Show global hooks status")
  .action(async (opts) => {
    await globalCommand(opts);
  });

program.parse();
