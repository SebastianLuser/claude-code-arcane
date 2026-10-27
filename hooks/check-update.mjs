// SessionStart update check against GitHub, cached for 4 hours. Run by check-update.sh.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CHECK_INTERVAL_MS = 4 * 3600 * 1000;
const GITHUB_API = "https://api.github.com/repos/SebastianLuser/Claude-Code-Arcane/commits/main";
const MANIFEST = path.join(".claude", "arcane-manifest.json");

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
};

/** "available", "current" or "stale" from the cache file. */
export function cached(checkFile, now = Date.now()) {
  const data = readJson(checkFile);
  const at = Date.parse(data?.checked_at ?? "");
  if (Number.isNaN(at) || now - at >= CHECK_INTERVAL_MS) return "stale";
  return data.update_available ? "available" : "current";
}

async function remoteSha() {
  try {
    const res = await fetch(GITHUB_API, {
      headers: { "User-Agent": "arcane-cli", Accept: "application/vnd.github.v3+json" },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? String((await res.json()).sha).slice(0, 12) : "";
  } catch {
    return "";
  }
}

/** Returns the line to print, or "" for nothing. */
export async function check({
  cwd = process.cwd(),
  checkFile = path.join(os.homedir(), ".arcane", "last-check.json"),
  cmd = "npx claude-code-arcane",
  now = Date.now(),
  fetchSha = remoteSha,
} = {}) {
  const manifest = path.join(cwd, MANIFEST);
  if (!fs.existsSync(manifest)) return "";

  const state = cached(checkFile, now);
  if (state === "available") return `Arcane update available. Run: ${cmd} update`;
  if (state === "current") return "";

  const remote = await fetchSha();
  if (!remote) return "";
  const data = readJson(manifest);
  const local = String(data?.source_version ?? data?.arcane_version ?? "unknown");

  // Parity with isContentUpdateAvailable() in src/update-check.ts: the remote content
  // identity is a commit SHA, so only a SHA-shaped local version can be compared against
  // it. A bundled install — which is every `npx claude-code-arcane install` — records a
  // semver instead, and "2.9.6" never equals a SHA. The CLI got this guard; the hook did
  // not, so it announced an update on every single session no matter how current the
  // install was, and pointed at a command npx users do not have.
  const available = /^[0-9a-f]{7,40}$/i.test(local) && local !== remote && !remote.startsWith(local);

  try {
    fs.mkdirSync(path.dirname(checkFile), { recursive: true });
    fs.writeFileSync(
      checkFile,
      JSON.stringify(
        {
          checked_at: new Date(now).toISOString().replace(/\.\d+Z$/, "Z"),
          local_version: local,
          remote_sha: remote,
          update_available: available,
        },
        null,
        2,
      ) + "\n",
    );
  } catch {}
  return available ? `Arcane update available: ${local} → ${remote}. Run: ${cmd} update` : "";
}

if (process.argv[1] && path.basename(process.argv[1]) === path.basename(fileURLToPath(import.meta.url))) {
  const line = await check({ cmd: process.argv[2] || undefined }).catch(() => "");
  if (line) console.log(line);
}
