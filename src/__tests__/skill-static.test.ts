import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

/**
 * The structural half of `/skill-test static`, run on every skill in CI.
 *
 * Those checks used to live only as prose in skills/skill-test/references/static-checks.md,
 * applied by a model on request. Nothing ran them, so 304 of 437 skills failed without
 * anyone noticing - and 288 of those failures came from one rule written for a gamedev
 * framework where every skill was a gate: "every skill emits PASS/FAIL". Most skills
 * never judge anything, and several that do say it in their own words (CLEAN / WARNINGS
 * / CRITICAL, HEALTHY / NEEDS ATTENTION / CRITICAL).
 *
 * The rules here are the ones that can be decided mechanically. The judgment calls
 * (ask before writing, next-step handoff, fork complexity, argument hint vs. modes)
 * stay with `/skill-test static`.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS_DIR = path.join(repoRoot, "skills");

/** Every skill has to declare these, even as an empty string. */
const REQUIRED_FIELDS = ["name", "description", "argument-hint", "user-invocable", "allowed-tools"];

/** A skill this short reads fine as one block; past it, sections are what make it navigable. */
const SECTION_THRESHOLD_LINES = 40;

interface CatalogSkill {
  name: string;
  category?: string;
  verdict?: unknown;
}

const catalog = yaml.load(
  fs.readFileSync(path.join(repoRoot, "skills-selftest", "catalog.yaml"), "utf-8"),
) as { skills: CatalogSkill[] };

const skills = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(SKILLS_DIR, e.name, "SKILL.md")))
  .map((e) => {
    const raw = fs.readFileSync(path.join(SKILLS_DIR, e.name, "SKILL.md"), "utf-8").replace(/\r\n/g, "\n");
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
    return {
      dir: e.name,
      frontmatter: fm ? ((yaml.load(fm[1]) as Record<string, unknown>) ?? {}) : null,
      body: fm ? raw.slice(fm[0].length) : raw,
      lines: raw.split("\n").length,
    };
  });

/** SKILL.md plus everything under references/, where several skills keep their report template. */
function skillText(dir: string): string {
  const parts = [fs.readFileSync(path.join(SKILLS_DIR, dir, "SKILL.md"), "utf-8")];
  const refs = path.join(SKILLS_DIR, dir, "references");
  if (fs.existsSync(refs)) {
    for (const f of fs.readdirSync(refs, { recursive: true }) as string[]) {
      if (String(f).endsWith(".md")) parts.push(fs.readFileSync(path.join(refs, f), "utf-8"));
    }
  }
  return parts.join("\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("skill structure (static checks 1-3)", () => {
  it("finds skills to check", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  it("every skill has frontmatter with the required fields", () => {
    const missing = skills.flatMap((s) =>
      s.frontmatter === null
        ? [`${s.dir}: no frontmatter`]
        : REQUIRED_FIELDS.filter((f) => !(f in s.frontmatter!)).map((f) => `${s.dir}: ${f}`),
    );
    expect(missing).toEqual([]);
  });

  it("every skill's name matches its directory", () => {
    const wrong = skills
      .filter((s) => s.frontmatter && s.frontmatter.name !== s.dir)
      .map((s) => `${s.dir}: name is ${String(s.frontmatter!.name)}`);
    expect(wrong).toEqual([]);
  });

  it(`skills longer than ${SECTION_THRESHOLD_LINES} lines are split into sections`, () => {
    const flat = skills
      .filter((s) => s.lines > SECTION_THRESHOLD_LINES)
      .filter((s) => (s.body.match(/^## /gm) ?? []).length < 2)
      .map((s) => `${s.dir}: ${s.lines} lines, fewer than two ## sections`);
    expect(flat).toEqual([]);
  });
});

describe("skills-selftest catalog", () => {
  const listed = new Map(catalog.skills.map((s) => [s.name, s]));

  it("lists every skill", () => {
    expect(skills.map((s) => s.dir).filter((d) => !listed.has(d))).toEqual([]);
  });

  it("lists only skills that exist", () => {
    const dirs = new Set(skills.map((s) => s.dir));
    expect(catalog.skills.map((s) => s.name).filter((n) => !dirs.has(n))).toEqual([]);
  });

  it("gives every skill a category", () => {
    expect(catalog.skills.filter((s) => !s.category).map((s) => s.name)).toEqual([]);
  });
});

describe("evaluator skills keep their verdict", () => {
  const evaluators = catalog.skills.filter((s) => s.verdict !== undefined);

  it("declares verdicts as a non-empty list of values", () => {
    const malformed = evaluators
      .filter((s) => !Array.isArray(s.verdict) || s.verdict.length === 0
        || !s.verdict.every((v) => typeof v === "string" && v.trim() !== ""))
      .map((s) => s.name);
    expect(malformed).toEqual([]);
  });

  it("defines every declared verdict value in the skill", () => {
    // Whole-value match: CRITICAL must not pass on the strength of "CRITICAL ISSUES".
    const missing = evaluators.flatMap((s) => {
      const text = skillText(s.name);
      return (s.verdict as string[])
        .filter((v) => !new RegExp(`(?<![\\p{L}\\-])${escapeRegExp(v)}(?![\\p{L}\\-])`, "u").test(text))
        .map((v) => `${s.name}: ${v}`);
    });
    expect(missing).toEqual([]);
  });
});
