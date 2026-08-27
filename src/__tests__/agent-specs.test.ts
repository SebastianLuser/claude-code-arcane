import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * `skills-selftest/agents/` holds 44 agent test specs. Nothing executed them:
 * no test in src/ or tests/ referenced the directory, which is how they drifted
 * out of sight entirely - during an audit they were mistaken for a second, rival
 * set of agent definitions, because nothing said otherwise.
 *
 * Their behavioural half cannot run here and says so itself: "No automated
 * runner; review manually or via /skill-test". The Test Cases are prose - an
 * input and the behaviour expected of a model.
 *
 * What IS mechanical is everything the spec asserts ABOUT the agent definition:
 * the declared model tier, the category, and whether the agent exists at all.
 * That is what this file checks, so a spec and its agent can no longer disagree
 * in silence.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SPECS_DIR = path.join(repoRoot, "skills-selftest", "agents");

/**
 * Specs describing an agent that was never written. They are design documents
 * for roles the roster planned and dropped, and they are useful as such - each
 * one states the domain, the boundaries and the tier a future agent would need.
 *
 * SHRINK ONLY: writing one of these agents removes its line. Adding a line
 * means a spec was written for an agent that does not exist, which is the
 * confusion this file exists to prevent.
 */
const SPECS_WITHOUT_AGENT = [
  "community-manager",
  "engine-programmer",
  "localization-lead",
  "prototyper",
  "qa-tester",
  "security-engineer",
  "tools-programmer",
  "ui-programmer",
  "unity-addressables-specialist",
  "unity-dots-specialist",
  "unity-ui-specialist",
];

const REQUIRED_SECTIONS = [
  "## Agent Summary",
  "## Static Assertions",
  "## Test Cases",
  "## Protocol Compliance",
];

interface Spec {
  file: string;
  name: string | null;
  tier: string | null;
  category: string | null;
  raw: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const specs: Spec[] = walk(SPECS_DIR).map((file) => {
  const raw = fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
  const name = /^#\s*Agent Test Spec:\s*(\S+)/m.exec(raw)?.[1] ?? null;
  const tier = /\*\*Model tier\*\*:\s*([A-Za-z0-9]+)/.exec(raw)?.[1]?.toLowerCase() ?? null;
  const category = /\*\*Category\*\*:\s*(\S+)/.exec(raw)?.[1] ?? null;
  return { file: path.relative(repoRoot, file).replace(/\\/g, "/"), name, tier, category, raw };
});

interface Agent {
  slug: string;
  division: string;
  model: string | null;
}

function loadAgents(): Map<string, Agent> {
  const dir = path.join(repoRoot, "agents");
  const map = new Map<string, Agent>();
  for (const division of fs.readdirSync(dir)) {
    const divPath = path.join(dir, division);
    if (!fs.statSync(divPath).isDirectory()) continue;
    for (const f of fs.readdirSync(divPath)) {
      if (!f.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(divPath, f), "utf-8").replace(/\r\n/g, "\n");
      const fm = raw.slice(0, raw.indexOf("\n---", 3));
      map.set(f.slice(0, -3), {
        slug: f.slice(0, -3),
        division,
        model: /^model:\s*(\S+)/m.exec(fm)?.[1] ?? null,
      });
    }
  }
  return map;
}

const agents = loadAgents();

describe("agent test specs are well formed", () => {
  it("should find the spec directory with every spec in it", () => {
    expect(specs.length).toBeGreaterThanOrEqual(44);
  });

  it("should name the agent it covers in its title", () => {
    const untitled = specs.filter((s) => !s.name).map((s) => s.file);
    expect(untitled).toEqual([]);
  });

  it("should have the spec filename match the agent it names", () => {
    const mismatched = specs
      .filter((s) => s.name && path.basename(s.file, ".md") !== s.name)
      .map((s) => `${s.file}: covers ${s.name}`);
    expect(mismatched).toEqual([]);
  });

  it("should carry all four required sections", () => {
    const incomplete: string[] = [];
    for (const s of specs) {
      const missing = REQUIRED_SECTIONS.filter((sec) => !s.raw.includes(sec));
      if (missing.length) incomplete.push(`${s.file}: missing ${missing.join(", ")}`);
    }
    expect(incomplete).toEqual([]);
  });

  it("should state at least one test case with a situation and an expectation", () => {
    // The specs come in two generations, like the agents themselves:
    //   A (16): **Input**: … / **Expected behavior**: …
    //   B (28): **Scenario:** … / **Expected:** … / **Assertions:** …
    // Both are legitimate. What matters is that a case gives the model a
    // situation and states what should come back - not which wording it uses.
    const situation = /\*\*(?:Input|Scenario)\*?\*?:/;
    const expectation = /\*\*Expected(?: behavior)?\*?\*?:/;
    const thin = specs
      .filter((s) => !situation.test(s.raw) || !expectation.test(s.raw))
      .map((s) => s.file);
    expect(thin).toEqual([]);
  });

  it("should number its cases so a failure can be pointed at one", () => {
    const unnumbered = specs.filter((s) => !/^###\s*Case\s*\d+/m.test(s.raw)).map((s) => s.file);
    expect(unnumbered).toEqual([]);
  });
});

describe("agent test specs agree with the agents they describe", () => {
  it("should declare the same model tier as the agent's frontmatter", () => {
    // A spec asserting "Model tier: Sonnet" against an agent running opus makes
    // the spec's own Static Assertions section wrong.
    const disagree: string[] = [];
    for (const s of specs) {
      if (!s.name || !s.tier) continue;
      const agent = agents.get(s.name);
      if (!agent?.model) continue;
      if (agent.model.toLowerCase() !== s.tier) {
        disagree.push(`${s.file}: spec says ${s.tier}, agent declares ${agent.model}`);
      }
    }
    expect(disagree).toEqual([]);
  });

  it("should not claim a category that contradicts the agent's division", () => {
    // Only checked where the spec states one; most do not.
    const disagree: string[] = [];
    for (const s of specs) {
      if (!s.name || !s.category) continue;
      const agent = agents.get(s.name);
      if (!agent) continue;
      // Spec categories are the selftest tree's own grouping (qa, operations,
      // specialists…), so this only fails on an outright contradiction: the
      // spec naming a real division that is not the agent's.
      const divisions = new Set([...agents.values()].map((a) => a.division));
      if (divisions.has(s.category) && s.category !== agent.division) {
        disagree.push(
          `${s.file}: spec says category ${s.category}, agent lives in ${agent.division}/`,
        );
      }
    }
    expect(disagree).toEqual([]);
  });

  it("should have an agent on disk, except for the known unwritten roles", () => {
    const orphans = specs
      .filter((s) => s.name && !agents.has(s.name))
      .map((s) => s.name!)
      .sort();
    expect(orphans).toEqual([...SPECS_WITHOUT_AGENT].sort());
  });

  it("should keep the orphan list free of roles that now exist", () => {
    // Writing one of these agents must shrink the list, not leave a stale line.
    const stale = SPECS_WITHOUT_AGENT.filter((name) => agents.has(name));
    expect(stale).toEqual([]);
  });
});

describe("agent test spec coverage", () => {
  it("should not drop below the agents already covered", () => {
    // 33 of 115 agents have a spec. This is a ratchet, not a target: it stops
    // coverage from silently regressing when agents get added.
    const covered = specs.filter((s) => s.name && agents.has(s.name)).length;
    expect(covered).toBeGreaterThanOrEqual(33);
  });

  it("should report which divisions have no spec coverage at all", () => {
    // Informational, and deliberately not an assertion on the list's contents:
    // it prints the gap so it stays visible instead of being rediscovered.
    const covered = new Set(
      specs.filter((s) => s.name && agents.has(s.name)).map((s) => agents.get(s.name!)!.division),
    );
    const all = new Set([...agents.values()].map((a) => a.division));
    const uncovered = [...all].filter((d) => !covered.has(d)).sort();
    // eslint-disable-next-line no-console
    console.log(
      `  agent spec coverage: ${specs.filter((s) => s.name && agents.has(s.name)).length}/${agents.size} agents; ` +
        `divisions with no spec: ${uncovered.join(", ") || "none"}`,
    );
    expect(Array.isArray(uncovered)).toBe(true);
  });
});
