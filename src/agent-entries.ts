import fs from "node:fs";
import path from "node:path";
import { copyDirSync, ensureDir, safeRemove } from "./utils.js";

/**
 * A profile's `agents:` entry names either a whole division or a single agent.
 *
 *   agents:
 *     - game            # the whole division, 30 agents
 *     - game/qa-lead    # just that one
 *
 * Division-only was the original form and stays the default. The granular form
 * exists because divisions are thematic, not functional: `qa-lead`, `ux-designer`
 * and `performance-analyst` live in `game/` but are wanted by profiles that have
 * nothing to do with games. Before this, the only way to reach one was to pull
 * in all 30 - which is exactly the token bloat profiles exist to avoid.
 */
export interface AgentEntry {
  /** the entry as written in the profile, e.g. "game" or "game/qa-lead" */
  raw: string;
  /** division directory under agents/ */
  division: string;
  /** agent slug when the entry is granular, undefined for a whole division */
  agent?: string;
}

export function parseAgentEntry(raw: string): AgentEntry {
  const trimmed = raw.trim().replace(/\/+$/, "");
  const slash = trimmed.indexOf("/");
  if (slash < 0) return { raw: trimmed, division: trimmed };
  return {
    raw: trimmed,
    division: trimmed.slice(0, slash),
    agent: trimmed.slice(slash + 1),
  };
}

export function isGranular(raw: string): boolean {
  return parseAgentEntry(raw).agent !== undefined;
}

/** Absolute source path in the repo for an entry, or null if it does not exist. */
export function agentSourcePath(root: string, raw: string): string | null {
  const { division, agent } = parseAgentEntry(raw);
  const p = agent
    ? path.join(root, "agents", division, `${agent}.md`)
    : path.join(root, "agents", division);
  return fs.existsSync(p) ? p : null;
}

/** How many agent files an entry brings in. 0 when the entry does not resolve. */
export function agentCount(root: string, raw: string): number {
  const src = agentSourcePath(root, raw);
  if (!src) return 0;
  if (parseAgentEntry(raw).agent) return 1;
  return fs
    .readdirSync(src, { recursive: true })
    .filter((f) => String(f).endsWith(".md")).length;
}

/**
 * Copy an entry into `<claudeDir>/agents/`. Returns the number of agent files
 * written, or null when the entry does not resolve in the repo.
 */
export function copyAgentEntry(root: string, claudeDir: string, raw: string): number | null {
  const src = agentSourcePath(root, raw);
  if (!src) return null;
  const { division, agent } = parseAgentEntry(raw);
  const dstDir = path.join(claudeDir, "agents", division);

  if (agent) {
    ensureDir(dstDir);
    fs.copyFileSync(src, path.join(dstDir, `${agent}.md`));
    return 1;
  }
  copyDirSync(src, dstDir);
  return fs
    .readdirSync(dstDir, { recursive: true })
    .filter((f) => String(f).endsWith(".md")).length;
}

/**
 * Remove an entry from `<claudeDir>/agents/`. A granular entry deletes one file
 * and takes the division directory with it only if nothing is left inside -
 * otherwise it would remove agents another profile still needs.
 * Returns true when something was actually deleted.
 */
export function removeAgentEntry(claudeDir: string, raw: string): boolean {
  const { division, agent } = parseAgentEntry(raw);
  const dstDir = path.join(claudeDir, "agents", division);

  if (!agent) {
    if (!fs.existsSync(dstDir)) return false;
    fs.rmSync(dstDir, { recursive: true, force: true });
    return true;
  }

  const file = path.join(dstDir, `${agent}.md`);
  if (!fs.existsSync(file)) return false;
  safeRemove(file);
  if (fs.existsSync(dstDir) && fs.readdirSync(dstDir).length === 0) {
    fs.rmSync(dstDir, { recursive: true, force: true });
  }
  return true;
}

/**
 * Display label for install/remove logs: `agents/game/` for a division,
 * `agents/game/qa-lead.md` for a single agent.
 */
export function agentEntryLabel(raw: string): string {
  const { division, agent } = parseAgentEntry(raw);
  return agent ? `agents/${division}/${agent}.md` : `agents/${division}/`;
}
