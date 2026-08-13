import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseProfile,
  listProfiles,
  mergeProfiles,
  groupByCategory,
  CATEGORY_ORDER,
} from "../profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.resolve(__dirname, "..", "..", "profiles");

describe("parseProfile", () => {
  it("parses core.yaml with all fields", () => {
    const profile = parseProfile(path.join(PROFILES_DIR, "core.yaml"));

    expect(profile.name).toBe("core");
    expect(profile.category).toBe("core");
    expect(profile.skills).toContain("commit");
    expect(profile.skills).toContain("help");
    expect(profile.rules.universal).toContain("data-files");
    expect(profile.agents).toContain("quality");
    expect(profile.hooks.length).toBeGreaterThan(0);
    expect(profile.permissions.allow.length).toBeGreaterThan(0);
    expect(profile.permissions.deny.length).toBeGreaterThan(0);
  });

  it("parses a categorized profile", () => {
    const profile = parseProfile(path.join(PROFILES_DIR, "testing.yaml"));

    expect(profile.name).toBe("testing");
    expect(profile.category).toBe("platform");
    expect(profile.skills).toContain("contract-testing");
    expect(profile.description).toBeTruthy();
  });

  it("returns empty arrays for missing optional fields", () => {
    const profile = parseProfile(path.join(PROFILES_DIR, "testing.yaml"));

    expect(profile.rules.gamedev).toEqual([]);
    expect(profile.permissions.deny).toEqual([]);
  });
});

describe("listProfiles", () => {
  it("lists all profiles except core.yaml", () => {
    const profiles = listProfiles(PROFILES_DIR);

    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles.find((p) => p.name === "core")).toBeUndefined();
    expect(profiles.find((p) => p.name === "testing")).toBeDefined();
  });

  it("returns profiles sorted by name", () => {
    const profiles = listProfiles(PROFILES_DIR);
    const names = profiles.map((p) => p.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sorted);
  });

  it("returns empty array for non-existent directory", () => {
    const profiles = listProfiles("/nonexistent/profiles");
    expect(profiles).toEqual([]);
  });
});

describe("groupByCategory", () => {
  it("every profile in the repo has a known category", () => {
    // A typo'd or missing category silently lands in "Other" and breaks the
    // curated grouping — catch it here.
    const known = new Set(CATEGORY_ORDER.map((c) => c.id));
    const stray = listProfiles(PROFILES_DIR).filter(
      (p) => !known.has(p.category),
    );
    expect(stray.map((p) => `${p.name}: ${p.category}`)).toEqual([]);
  });

  it("groups profiles in CATEGORY_ORDER order, skipping empty groups", () => {
    const groups = groupByCategory(listProfiles(PROFILES_DIR));
    const ids = groups.map((g) => g.id);
    const expected = CATEGORY_ORDER.map((c) => c.id).filter((id) =>
      ids.includes(id),
    );
    expect(ids).toEqual(expected);
    for (const g of groups) {
      expect(g.profiles.length).toBeGreaterThan(0);
    }
  });

  it("collects unknown categories into a trailing Other group", () => {
    const fake = [
      { category: "backend" },
      { category: "does-not-exist" },
    ] as ReturnType<typeof listProfiles>;
    const groups = groupByCategory(fake);
    expect(groups.at(-1)?.id).toBe("other");
    expect(groups.at(-1)?.profiles.length).toBe(1);
  });
});

describe("mergeProfiles", () => {
  it("always includes core profile", () => {
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    expect(merged.loaded).toContain("core");
    expect(merged.loaded).toContain("testing");
  });

  it("deduplicates skills from overlapping profiles", () => {
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const skillCounts = new Map<string, number>();
    for (const s of merged.skills) {
      skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
    }
    for (const [skill, count] of skillCounts) {
      expect(count, `skill '${skill}' should appear only once`).toBe(1);
    }
  });

  it("merges permissions with deduplication", () => {
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const allowSet = new Set(merged.permissions.allow);
    expect(allowSet.size).toBe(merged.permissions.allow.length);
  });

  it("deduplicates agents across profiles", () => {
    // core and testing both have "quality" agent
    const merged = mergeProfiles(PROFILES_DIR, ["testing"]);

    const agentCounts = new Map<string, number>();
    for (const a of merged.agents) {
      agentCounts.set(a, (agentCounts.get(a) ?? 0) + 1);
    }
    expect(agentCounts.get("quality")).toBe(1);
  });

  it("skips missing profiles without throwing", () => {
    const merged = mergeProfiles(PROFILES_DIR, ["nonexistent-profile"]);

    expect(merged.loaded).toContain("core");
    expect(merged.loaded).not.toContain("nonexistent-profile");
  });
});

/**
 * `agents:` is a list of directory names copied wholesale by the installer
 * (installer.ts). A name that does not match a real directory is skipped in
 * silence: the install prints no agents line and nobody notices until an agent
 * is invoked and does not exist. Same for an empty directory.
 */
describe("profile agent dirs resolve to real agents", () => {
  const AGENTS_DIR = path.resolve(__dirname, "..", "..", "agents");

  it("every agents: entry points to a directory with at least one agent", () => {
    const broken: string[] = [];

    for (const entry of fs.readdirSync(PROFILES_DIR)) {
      if (!entry.endsWith(".yaml")) continue;
      const profile = parseProfile(path.join(PROFILES_DIR, entry));
      for (const dir of profile.agents) {
        const full = path.join(AGENTS_DIR, dir);
        if (!fs.existsSync(full)) {
          broken.push(`${entry}: agents/${dir}/ does not exist`);
          continue;
        }
        const agents = fs.readdirSync(full).filter((f) => f.endsWith(".md"));
        if (agents.length === 0) broken.push(`${entry}: agents/${dir}/ has no .md files`);
      }
    }

    expect(broken).toEqual([]);
  });

  // They exist to give a *fresh-context* second opinion and hand findings back.
  // One that could Write would edit the very CV or proposal it is reviewing, and
  // docs/agent-hierarchy.md states agents never write files directly.
  it.each([
    ["career", 4],
    ["freelance", 4],
  ])("%s agents are read-only (%i of them)", (dir, expected) => {
    const offenders: string[] = [];
    const agentDir = path.join(AGENTS_DIR, dir);
    const files = fs.readdirSync(agentDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const front = fs.readFileSync(path.join(agentDir, file), "utf-8").split("---")[1] ?? "";
      const tools = front.match(/^tools:\s*(.+)$/m)?.[1] ?? "";
      const writers = ["Write", "Edit", "NotebookEdit"].filter((t) => tools.includes(t));
      if (writers.length) offenders.push(`${dir}/${file}: tools includes ${writers.join(", ")}`);
    }

    expect(offenders).toEqual([]);
    expect(files.length).toBe(expected);
  });
});
