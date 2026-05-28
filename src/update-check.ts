import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";
import { readManifest } from "./manifest.js";

const CHECK_FILE = path.join(os.homedir(), ".arcane", "last-check.json");
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

const GITHUB_OWNER = "SebastianLuser";
const GITHUB_REPO = "Claude-Code-Arcane";
const GITHUB_BRANCH = "main";

interface CheckResult {
  checked_at: string;
  local_version: string;
  remote_sha: string;
  update_available: boolean;
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
          printUpdateNotice(cached.local_version, cached.remote_sha);
        }
        return cached.update_available;
      }
    }

    const manifest = readManifest(process.cwd());
    const localVersion = manifest?.source_version ?? manifest?.arcane_version ?? "unknown";

    const remoteSha = await getLatestCommitSha();
    if (!remoteSha) return false;

    const shortSha = remoteSha.substring(0, 12);
    const updateAvailable = localVersion !== shortSha && !remoteSha.startsWith(localVersion);

    const result: CheckResult = {
      checked_at: new Date().toISOString(),
      local_version: localVersion,
      remote_sha: shortSha,
      update_available: updateAvailable,
    };
    writeCachedCheck(result);

    if (updateAvailable && !opts.quiet) {
      printUpdateNotice(localVersion, shortSha);
    }

    return updateAvailable;
  } catch {
    return false;
  }
}

export async function checkForUpdatesHook(): Promise<string> {
  try {
    const updateAvailable = await checkForUpdates({ quiet: true });
    if (updateAvailable) {
      return "Arcane update available. Run: arcane update";
    }
    return "";
  } catch {
    return "";
  }
}

function printUpdateNotice(localVersion: string, remoteSha: string): void {
  console.log(
    chalk.yellow(`\n  Arcane update available: ${localVersion} → ${remoteSha}`),
  );
  console.log(
    chalk.dim("  Run: arcane update (--dry-run to preview)\n"),
  );
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
