import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The counts printed in the docs drifted three times before this test existed:
 * README claimed 337 skills while the tree comment said 333 and the filesystem
 * had 361. Nobody notices, because nothing checks. This does.
 *
 * It asserts what the docs *state* against the filesystem, and each catalog
 * section header against its own rows. It deliberately does NOT require the
 * catalog to list every skill: the table is incomplete by a known margin and
 * closing that is content work, not a counter fix.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(relative: string): string {
  return fs.readFileSync(path.join(repoRoot, relative), "utf-8");
}

function countSkills(): number {
  const skillsDir = path.join(repoRoot, "skills");
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(skillsDir, entry.name, "SKILL.md"))).length;
}

function countFiles(dir: string, extension: string): number {
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.isDirectory()) total += countFiles(path.join(dir, entry.name), extension);
    else if (entry.name.endsWith(extension)) total += 1;
  }
  return total;
}

/** Captures the single number a pattern matches, failing loudly if the phrase moved. */
function stated(source: string, label: string, pattern: RegExp): number {
  const match = source.match(pattern);
  expect(match, `phrase not found in ${label}: ${pattern}. Update the test or the doc.`).toBeTruthy();
  return Number(match![1]);
}

describe("documented counts match the filesystem", () => {
  const real = {
    skills: countSkills(),
    rules: countFiles("rules", ".md"),
    agents: countFiles("agents", ".md"),
    hooks: countFiles("hooks", ".sh"),
  };

  it("README headline", () => {
    const readme = read("README.md");
    const headline = /> \*\*(\d+) skills, (\d+) agents, (\d+) hooks and (\d+) rules/;
    const match = readme.match(headline);
    expect(match, "README headline phrase not found").toBeTruthy();
    const [, skills, agents, hooks, rules] = match!.map(Number);
    expect({ skills, agents, hooks, rules }).toEqual(real);
  });

  it("README repository tree", () => {
    const readme = read("README.md");
    expect(stated(readme, "README tree", /# (\d+) skills \(flat, one dir per skill\)/)).toBe(real.skills);
    expect(stated(readme, "README tree", /# (\d+) rules \(Markdown\)/)).toBe(real.rules);
  });

  it("USER-GUIDE intro and token note", () => {
    const guide = read("docs/USER-GUIDE.md");
    const intro = /\*\*(\d+) skills\*\*, \*\*(\d+) agents\*\*, \*\*(\d+) hooks\*\*, and \*\*(\d+) rules\*\*/;
    const match = guide.match(intro);
    expect(match, "USER-GUIDE intro phrase not found").toBeTruthy();
    const [, skills, agents, hooks, rules] = match!.map(Number);
    expect({ skills, agents, hooks, rules }).toEqual(real);
    expect(stated(guide, "USER-GUIDE token note", /loading all (\d+) skills/)).toBe(real.skills);
  });

  it("agent-hierarchy roster header", () => {
    // This file claimed a 143-agent roster while 109 shipped. The 34 that were
    // never written are where 62 dead delegation references came from.
    const hierarchy = read("docs/agent-hierarchy.md");
    expect(stated(hierarchy, "agent-hierarchy roster", /## Roster Completo \((\d+) Agentes\)/)).toBe(
      real.agents,
    );
  });

  it("directory-structure agents tree", () => {
    // It claimed 80 agents in 12 divisions, omitting five whole divisions.
    const tree = read("docs/directory-structure.md");
    expect(stated(tree, "directory-structure total", /agents\/\s+# (\d+) agent definitions/)).toBe(
      real.agents,
    );

    const divisions = fs
      .readdirSync(path.join(repoRoot, "agents"), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    const listed = [...tree.matchAll(/^│\s+[├└]── (\S+)\/\s+# (\d+) agents?$/gm)].map((m) => ({
      division: m[1],
      count: Number(m[2]),
    }));
    expect(listed.map((l) => l.division)).toEqual(divisions);

    for (const { division, count } of listed) {
      expect(count, `division ${division}`).toBe(countFiles(path.join("agents", division), ".md"));
    }
  });

  it("SKILLS-CATALOG intro", () => {
    const catalog = read("docs/SKILLS-CATALOG.md");
    expect(stated(catalog, "catalog intro", /Los (\d+) skills disponibles/)).toBe(real.skills);
    // The table is knowingly incomplete; the stated coverage has to stay true too.
    const rows = (catalog.match(/^\| `\//gm) ?? []).length;
    expect(stated(catalog, "catalog coverage", /La tabla cubre (\d+)/)).toBe(rows);
    expect(stated(catalog, "catalog gap", /hay (\d+) skills instalables/)).toBe(real.skills - rows);
  });
});

describe("SKILLS-CATALOG section headers", () => {
  it("each header matches the rows under it", () => {
    const catalog = read("docs/SKILLS-CATALOG.md");
    const sections = catalog.split(/^## /m).slice(1);
    const mismatches: string[] = [];

    for (const section of sections) {
      const header = section.split("\n")[0];
      const claimed = header.match(/\((\d+) skills\)/);
      if (!claimed) continue;
      const rows = (section.match(/^\| `\//gm) ?? []).length;
      if (Number(claimed[1]) !== rows) {
        mismatches.push(`${header.split(" (")[0]}: says ${claimed[1]}, has ${rows}`);
      }
    }

    expect(mismatches).toEqual([]);
  });
});
