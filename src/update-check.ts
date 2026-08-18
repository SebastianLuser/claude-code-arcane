import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";
import { readManifest } from "./manifest.js";
import { getPackageVersion } from "./utils.js";
import { isGloballyInstalled } from "./self-update.js";

const CHECK_FILE = path.join(os.homedir(), ".arcane", "last-check.json");
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

const GITHUB_OWNER = "SebastianLuser";
const GITHUB_REPO = "Claude-Code-Arcane";
const GITHUB_BRANCH = "main";
const PACKAGE_NAME = "claude-code-arcane";

/** Git object names, as stored in the manifest by SHA-stamped installs. */
const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

interface CheckResult {
  checked_at: string;
  local_version: string;
  remote_sha: string;
  update_available: boolean;
  /** Fields below are absent in caches written before the CLI check existed. */
  content_update_available?: boolean;
  cli_version?: string;
  latest_cli_version?: string;
  cli_update_available?: boolean;
}

/**
 * Compare two semver strings by their release parts. Returns >0 when `a` is
 * newer than `b`. Prereleases sort below the release they lead to, which is
 * enough to keep `2.6.0-rc.1` from being offered as an update over `2.6.0`.
 */
export function compareSemver(a: string, b: string): number {
  const release = (v: string) => v.trim().replace(/^v/, "").split(/[-+]/)[0];
  const parts = (v: string) =>
    release(v)
      .split(".")
      .map((n) => Number.parseInt(n, 10) || 0);

  const [aMajor = 0, aMinor = 0, aPatch = 0] = parts(a);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parts(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  if (aPatch !== bPatch) return aPatch - bPatch;

  const aPre = /-/.test(a.trim());
  const bPre = /-/.test(b.trim());
  if (aPre !== bPre) return aPre ? -1 : 1;
  return 0;
}

/**
 * The remote content identity is a commit SHA, so only a SHA-shaped local
 * version can be compared against it.
 *
 * Manifests written by a bundled install record a semver instead, and a project
 * with no manifest at all records nothing. Both used to be compared against the
 * remote SHA directly, which can never match — that is why the notice fired on
 * every single command no matter how current the install was.
 */
export function isContentUpdateAvailable(
  localVersion: string,
  remoteSha: string,
): boolean {
  if (!SHA_PATTERN.test(localVersion)) return false;
  return !remoteSha.startsWith(localVersion) && !localVersion.startsWith(remoteSha);
}

export async function checkForUpdates(opts: {
  quiet?: boolean;
  force?: boolean;
} = {}): Promise<boolean> {
  try {
    const cached = readCachedCheck();
    if (cached && !opts.force) {
      const age = Date.now() - new Date(cached.checked_at).getTime();
      if (age < CHECK_INTERVAL_MS) {
        if (cached.update_available && !opts.quiet) {
          printUpdateNotice(cached);
        }
        return cached.update_available;
      }
    }

    const manifest = readManifest(process.cwd());
    const localVersion = manifest?.source_version ?? manifest?.arcane_version ?? "unknown";
    const cliVersion = getPackageVersion();

    const [remoteSha, latestCli] = await Promise.all([
      getLatestCommitSha(),
      getLatestNpmVersion(),
    ]);

    const shortSha = remoteSha ? remoteSha.substring(0, 12) : (cached?.remote_sha ?? "");
    const contentUpdate = shortSha !== "" && isContentUpdateAvailable(localVersion, shortSha);
    const cliUpdate = latestCli !== null && compareSemver(latestCli, cliVersion) > 0;

    if (!remoteSha && latestCli === null) return false;

    const result: CheckResult = {
      checked_at: new Date().toISOString(),
      local_version: localVersion,
      remote_sha: shortSha,
      update_available: contentUpdate || cliUpdate,
      content_update_available: contentUpdate,
      cli_version: cliVersion,
      latest_cli_version: latestCli ?? undefined,
      cli_update_available: cliUpdate,
    };
    writeCachedCheck(result);

    if (result.update_available && !opts.quiet) {
      printUpdateNotice(result);
    }

    return result.update_available;
  } catch {
    return false;
  }
}

export async function checkForUpdatesHook(): Promise<string> {
  try {
    const cached = (await checkForUpdates({ quiet: true })) ? readCachedCheck() : null;
    if (!cached) return "";

    const notices: string[] = [];
    if (cached.cli_update_available) {
      notices.push(
        `Arcane CLI ${cached.cli_version} → ${cached.latest_cli_version}. Run: npm install -g ${PACKAGE_NAME}@latest`,
      );
    }
    // Caches predating the CLI check have no content flag; treat them as content-only.
    if (cached.content_update_available ?? true) {
      notices.push("Arcane content update available. Run: arcane update");
    }
    return notices.join(" ");
  } catch {
    return "";
  }
}

function printUpdateNotice(result: CheckResult): void {
  if (result.cli_update_available) {
    console.log(
      chalk.yellow(
        `\n  Arcane CLI update: ${result.cli_version} → ${result.latest_cli_version}`,
      ),
    );
    const how = isGloballyInstalled()
      ? `  Run: npm install -g ${PACKAGE_NAME}@latest`
      : `  You are on an older CLI. Latest: ${PACKAGE_NAME}@${result.latest_cli_version}`;
    console.log(chalk.dim(how));
  }

  if (result.content_update_available ?? true) {
    console.log(
      chalk.yellow(
        `\n  Arcane content update: ${result.local_version} → ${result.remote_sha}`,
      ),
    );
    console.log(chalk.dim("  Run: arcane update (--dry-run to preview)"));
  }

  console.log("");
}

async function getLatestCommitSha(): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`,
      {
        headers: {
          "User-Agent": "arcane-cli",
          Accept: "application/vnd.github.v3+json",
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { sha: string };
    return data.sha;
  } catch {
    return null;
  }
}

/**
 * Latest published version of the CLI itself. Without this the notice only ever
 * tracked content, so a CLI several minors behind never surfaced as stale — the
 * user kept installing new skills with a binary that could not read them.
 */
async function getLatestNpmVersion(): Promise<string | null> {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
      {
        headers: { "User-Agent": "arcane-cli", Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

function readCachedCheck(): CheckResult | null {
  try {
    if (!fs.existsSync(CHECK_FILE)) return null;
    return JSON.parse(fs.readFileSync(CHECK_FILE, "utf-8")) as CheckResult;
  } catch {
    return null;
  }
}

function writeCachedCheck(result: CheckResult): void {
  try {
    const dir = path.dirname(CHECK_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CHECK_FILE, JSON.stringify(result, null, 2) + "\n");
  } catch {
    // ignore write failures
  }
}
