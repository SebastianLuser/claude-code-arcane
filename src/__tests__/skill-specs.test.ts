import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `skills-selftest/skills/` holds behavioural specs for skills. 25 of them
 * described skills inherited from CCGS that were never ported, and nothing
 * noticed: `/skill-test` reads a spec by name, so a spec without its skill just
 * sits there looking like coverage. agent-specs.test.ts already guards the
 * agent side; this is the same check for skills.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SPECS_DIR = path.join(repoRoot, "skills-selftest", "skills");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const specs = walk(SPECS_DIR).map((file) => {
  const raw = fs.readFileSync(file, "utf-8");
  const name = /^#\s*Skill Test Spec:\s*\/?([\w:-]+)/m.exec(raw)?.[1] ?? null;
  return { file: path.relative(repoRoot, file).replace(/\\/g, "/"), name };
});

describe("skills-selftest skill specs", () => {
  it("finds specs to check", () => {
    expect(specs.length).toBeGreaterThan(0);
  });

  it("every spec declares the skill it tests", () => {
    const unnamed = specs.filter((s) => s.name === null).map((s) => s.file);
    expect(unnamed).toEqual([]);
  });

  it("every spec tests a skill that exists", () => {
    const orphans = specs
      .filter((s) => s.name && !fs.existsSync(path.join(repoRoot, "skills", s.name, "SKILL.md")))
      .map((s) => `${s.file} -> /${s.name}`);
    expect(orphans).toEqual([]);
  });
});
