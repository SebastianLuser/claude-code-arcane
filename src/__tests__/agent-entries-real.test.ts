import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  agentCount,
  copyAgentEntry,
  removeAgentEntry,
} from "../agent-entries.js";

/**
 * The unit tests for agent-entries run against a synthetic fixture. This one
 * runs against the real repo, because the payoff of granular entries is a claim
 * about real data: that `quality/security-architect` brings one agent where
 * `quality` brings three.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
let tmp: string | null = null;

function target(): string {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-real-"));
  return path.join(tmp, ".claude");
}

afterEach(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe("granular entries against the real agents tree", () => {
  it("should count one agent for a granular entry and the whole set for its division", () => {
    const division = agentCount(repoRoot, "quality");
    const single = agentCount(repoRoot, "quality/security-architect");

    expect(single).toBe(1);
    expect(division).toBeGreaterThan(single);
  });

  it("should install only the named agent, not its division", () => {
    const claudeDir = target();

    const written = copyAgentEntry(repoRoot, claudeDir, "quality/security-architect");

    expect(written).toBe(1);
    expect(fs.readdirSync(path.join(claudeDir, "agents", "quality"))).toEqual([
      "security-architect.md",
    ]);
  });

  it("should leave the other agents of the division alone when removing one", () => {
    const claudeDir = target();
    copyAgentEntry(repoRoot, claudeDir, "quality");
    const before = fs.readdirSync(path.join(claudeDir, "agents", "quality"));

    const removed = removeAgentEntry(claudeDir, "quality/security-architect");
    const after = fs.readdirSync(path.join(claudeDir, "agents", "quality"));

    expect(removed).toBe(true);
    expect(after).toHaveLength(before.length - 1);
    expect(after).not.toContain("security-architect.md");
  });

  it("should keep the installed agent readable and valid after a granular copy", () => {
    const claudeDir = target();
    copyAgentEntry(repoRoot, claudeDir, "game/qa-lead");

    const body = fs.readFileSync(
      path.join(claudeDir, "agents", "game", "qa-lead.md"),
      "utf-8",
    );

    expect(body.startsWith("---")).toBe(true);
    expect(body).toContain("name: qa-lead");
  });
});

describe("the profiles that use granular entries", () => {
  it("should install exactly the agents they name and nothing else", () => {
    // profiles/security.yaml declares `quality/security-architect`, so a
    // security install must not drag in qa-director and qa-engineer.
    const raw = fs.readFileSync(path.join(repoRoot, "profiles", "security.yaml"), "utf-8");
    const entries = [
      ...(/^agents:\s*\n((?:\s+-\s+\S+\n)*)/m.exec(raw)?.[1] ?? "").matchAll(/-\s+(\S+)/g),
    ].map((m) => m[1]);

    expect(entries).toContain("quality/security-architect");

    const claudeDir = target();
    let total = 0;
    for (const e of entries) total += copyAgentEntry(repoRoot, claudeDir, e) ?? 0;

    expect(total).toBe(entries.length);
  });
});
