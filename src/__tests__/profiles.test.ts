import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseProfile, listProfiles, mergeProfiles } from "../profiles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.resolve(__dirname, "..", "..", "profiles");

describe("parseProfile", () => {
  it("parses core.yaml with all fields", () => {
    const profile = parseProfile(path.join(PROFILES_DIR, "core.yaml"));

    expect(profile.name).toBe("core");
    expect(profile.type).toBe("base");
    expect(profile.skills).toContain("commit");
    expect(profile.skills).toContain("help");
    expect(profile.rules.universal).toContain("data-files");
    expect(profile.agents).toContain("quality");
    expect(profile.hooks.length).toBeGreaterThan(0);
    expect(profile.permissions.allow.length).toBeGreaterThan(0);
    expect(profile.permissions.deny.length).toBeGreaterThan(0);
  });

  it("parses an addon profile", () => {
    const profile = parseProfile(path.join(PROFILES_DIR, "testing.yaml"));

    expect(profile.name).toBe("testing");
    expect(profile.type).toBe("addon");
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
