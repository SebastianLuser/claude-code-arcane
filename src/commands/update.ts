import { execSync } from "node:child_process";
import chalk from "chalk";

interface UpdateOpts {
  quiet?: boolean;
}

export async function updateCommand(opts: UpdateOpts): Promise<void> {
  try {
    const current = getCurrentVersion();
    const latest = getLatestVersion();

    if (!latest) {
      if (!opts.quiet) {
        console.log(chalk.yellow("Could not check for updates."));
      }
      return;
    }

    if (current === latest) {
      if (!opts.quiet) {
        console.log(chalk.green(`Already up to date (v${current}).`));
      }
      return;
    }

    if (opts.quiet) {
      console.log(
        `Arcane update available: ${current} -> ${latest}. Run: npm update -g claude-code-arcane`,
      );
      return;
    }

    console.log(
      chalk.bold(`\nUpdate available: ${chalk.red(current)} -> ${chalk.green(latest)}`),
    );
    console.log(
      chalk.dim("  Run: npm update -g claude-code-arcane"),
    );
  } catch {
    if (!opts.quiet) {
      console.log(chalk.yellow("Could not check for updates."));
    }
  }
}

function getCurrentVersion(): string {
  try {
    const pkg = JSON.parse(
      execSync("npm list -g claude-code-arcane --json", {
        encoding: "utf-8",
        timeout: 10_000,
        stdio: ["pipe", "pipe", "ignore"],
      }),
    );
    return (
      pkg?.dependencies?.["claude-code-arcane"]?.version ?? "unknown"
    );
  } catch {
    return "unknown";
  }
}

function getLatestVersion(): string | null {
  try {
    return execSync("npm view claude-code-arcane version", {
      encoding: "utf-8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}
