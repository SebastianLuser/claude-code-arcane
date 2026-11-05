import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { MAINTAINER_SKILLS, REPO_ROOT, skillDirs } from "./skill-roots.js";

/**
 * Contributor-only skills send Claude to the repo files that hold the rules
 * (arcane-author's "Sources" table) instead of copying them, so they never go stale
 * in silence. That only works while the files exist: a test or doc renamed or
 * deleted would leave the skill pointing at nothing, and Claude would fall back on
 * memory. Every repo path a contributor skill names in backticks has to exist.
 */

/** A repo path in backticks: under a top-level folder, or a root doc. Placeholders (`<name>`) are skipped. */
const REPO_PATH =
  /`((?:src|docs|skills-selftest|profiles|rules|agents|hooks|skills|maintainers)\/[^`\s]*|CLAUDE\.md|README\.md)`/g;

function markdown(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return markdown(p);
    return e.name.endsWith(".md") ? [p] : [];
  });
}

const skills = skillDirs([MAINTAINER_SKILLS]).map((s) => {
  const named = markdown(s.dir).flatMap((file) =>
    [...fs.readFileSync(file, "utf-8").matchAll(REPO_PATH)].map((m) => m[1]).filter((p) => !/[<>*[\]]/.test(p)),
  );
  return { name: s.name, paths: [...new Set(named)] };
});

describe("contributor-only skills", () => {
  it("arcane-author still names its sources", () => {
    // A format change that hid every path from the pattern would make the next test pass on nothing.
    const author = skills.find((s) => s.name === "arcane-author");
    expect(author?.paths.length ?? 0).toBeGreaterThanOrEqual(10);
  });

  it("name only repo files that exist", () => {
    const missing = skills.flatMap((s) =>
      s.paths.filter((p) => !fs.existsSync(path.join(REPO_ROOT, p))).map((p) => `${s.name} -> ${p}`),
    );
    expect(missing).toEqual([]);
  });
});
