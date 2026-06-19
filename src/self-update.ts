import { spawnSync } from "node:child_process";
import { getPackageRoot, getPackageVersion } from "./utils.js";

const PACKAGE_NAME = "claude-code-arcane";

export interface SelfUpdateOptions {
  quiet?: boolean;
  dryRun?: boolean;
  /** Set false to skip the npm self-update entirely (--no-self-update). */
  selfUpdate?: boolean;
}

export interface SelfUpdateResult {
  /** Whether `npm install -g` was actually run and succeeded. */
  updated: boolean;
  /** True when the step was intentionally not performed. */
  skipped: boolean;
  reason?: string;
  fromVersion?: string;
}

/**
 * Heuristic: is this CLI running from a globally-installed npm package (vs an
 * ephemeral `npx` run or a local dev checkout)? `npx` extracts packages under a
 * `_npx` cache dir; dev/CI runs from the repo (no node_modules ancestor).
 */
export function isGloballyInstalled(): boolean {
  const root = getPackageRoot().replace(/\\/g, "/");

  if (root.includes("/_npx/")) return false;
  if (!root.includes("/node_modules/")) return false;

  return true;
}

/**
 * Update the globally-installed Arcane npm package to the latest version.
 *
 * Skips automatically (returning a reason) when: explicitly disabled, running
 * under tests (VITEST) or a pinned content source (ARCANE_SOURCE), or when not
 * running from a global install. In dry-run mode it reports the intended action
 * without spawning npm.
 */
export async function selfUpdateNpm(
  opts: SelfUpdateOptions = {},
): Promise<SelfUpdateResult> {
  const fromVersion = safeVersion();

  if (opts.selfUpdate === false) {
    return { updated: false, skipped: true, reason: "disabled (--no-self-update)", fromVersion };
  }
  if (process.env.VITEST || process.env.ARCANE_SOURCE) {
    return { updated: false, skipped: true, reason: "dev/test environment", fromVersion };
  }
  if (!isGloballyInstalled()) {
    return { updated: false, skipped: true, reason: "not a global npm install", fromVersion };
  }
  if (opts.dryRun) {
    return { updated: false, skipped: true, reason: "dry-run", fromVersion };
  }

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(
    npm,
    ["install", "-g", `${PACKAGE_NAME}@latest`],
    {
      stdio: opts.quiet ? "ignore" : "inherit",
      encoding: "utf-8",
      timeout: 120_000,
    },
  );

  if (result.status === 0) {
    return { updated: true, skipped: false, fromVersion };
  }

  const reason = result.error
    ? result.error.message
    : `npm exited with code ${result.status ?? "unknown"}`;
  return { updated: false, skipped: false, reason, fromVersion };
}

function safeVersion(): string | undefined {
  try {
    return getPackageVersion();
  } catch {
    return undefined;
  }
}
