import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  agentCount,
  agentEntryLabel,
  agentSourcePath,
  copyAgentEntry,
  isGranular,
  parseAgentEntry,
  removeAgentEntry,
} from "../agent-entries.js";

/**
 * Divisions are thematic, not functional: qa-lead, ux-designer and
 * performance-analyst live in game/ but generic profiles want them. Before
 * granular entries the only way to reach one was to install all 30 agents of
 * game/ - the token bloat profiles exist to avoid.
 */

let root: string;
let claudeDir: string;

function writeAgent(division: string, name: string): void {
  const dir = path.join(root, "agents", division);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${name}.md`),
    `---\nname: ${name}\ndescription: "test"\n---\n\nbody\n`,
  );
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-entries-"));
  claudeDir = path.join(root, "target", ".claude");
  writeAgent("game", "qa-lead");
  writeAgent("game", "unity-specialist");
  writeAgent("game", "art-director");
  writeAgent("quality", "qa-director");
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("parseAgentEntry", () => {
  it("should read a bare name as a whole division when no slash is present", () => {
    expect(parseAgentEntry("game")).toEqual({ raw: "game", division: "game" });
    expect(isGranular("game")).toBe(false);
  });

  it("should split division from agent when a slash is present", () => {
    expect(parseAgentEntry("game/qa-lead")).toEqual({
      raw: "game/qa-lead",
      division: "game",
      agent: "qa-lead",
    });
    expect(isGranular("game/qa-lead")).toBe(true);
  });

  it("should tolerate surrounding whitespace and a trailing slash", () => {
    expect(parseAgentEntry("  game/  ")).toEqual({ raw: "game", division: "game" });
  });
});

describe("agentSourcePath and agentCount", () => {
  it("should resolve a division to its directory and count every agent in it", () => {
    expect(agentSourcePath(root, "game")).toBe(path.join(root, "agents", "game"));
    expect(agentCount(root, "game")).toBe(3);
  });

  it("should resolve a granular entry to one file and count exactly one", () => {
    expect(agentSourcePath(root, "game/qa-lead")).toBe(
      path.join(root, "agents", "game", "qa-lead.md"),
    );
    expect(agentCount(root, "game/qa-lead")).toBe(1);
  });

  it("should return null and count zero for an entry that does not exist", () => {
    expect(agentSourcePath(root, "game/nope")).toBeNull();
    expect(agentSourcePath(root, "nope")).toBeNull();
    expect(agentCount(root, "game/nope")).toBe(0);
  });
});

describe("copyAgentEntry", () => {
  it("should copy every agent of a division", () => {
    const count = copyAgentEntry(root, claudeDir, "game");

    expect(count).toBe(3);
    expect(fs.readdirSync(path.join(claudeDir, "agents", "game")).sort()).toEqual([
      "art-director.md",
      "qa-lead.md",
      "unity-specialist.md",
    ]);
  });

  it("should copy only the named agent for a granular entry", () => {
    const count = copyAgentEntry(root, claudeDir, "game/qa-lead");

    expect(count).toBe(1);
    expect(fs.readdirSync(path.join(claudeDir, "agents", "game"))).toEqual([
      "qa-lead.md",
    ]);
  });

  it("should return null without writing anything when the entry does not resolve", () => {
    const count = copyAgentEntry(root, claudeDir, "game/nope");

    expect(count).toBeNull();
    expect(fs.existsSync(path.join(claudeDir, "agents", "game"))).toBe(false);
  });
});

describe("removeAgentEntry", () => {
  it("should delete the whole directory for a division entry", () => {
    copyAgentEntry(root, claudeDir, "game");

    expect(removeAgentEntry(claudeDir, "game")).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "agents", "game"))).toBe(false);
  });

  it("should delete only the named file and leave its siblings in place", () => {
    copyAgentEntry(root, claudeDir, "game");

    expect(removeAgentEntry(claudeDir, "game/qa-lead")).toBe(true);
    expect(fs.readdirSync(path.join(claudeDir, "agents", "game")).sort()).toEqual([
      "art-director.md",
      "unity-specialist.md",
    ]);
  });

  it("should drop the division directory once the last agent in it is removed", () => {
    copyAgentEntry(root, claudeDir, "game/qa-lead");

    expect(removeAgentEntry(claudeDir, "game/qa-lead")).toBe(true);
    expect(fs.existsSync(path.join(claudeDir, "agents", "game"))).toBe(false);
  });

  it("should report false when there is nothing to remove", () => {
    expect(removeAgentEntry(claudeDir, "game")).toBe(false);
    expect(removeAgentEntry(claudeDir, "game/qa-lead")).toBe(false);
  });
});

describe("agentEntryLabel", () => {
  it("should render a division as a directory and an agent as a file", () => {
    expect(agentEntryLabel("game")).toBe("agents/game/");
    expect(agentEntryLabel("game/qa-lead")).toBe("agents/game/qa-lead.md");
  });
});
