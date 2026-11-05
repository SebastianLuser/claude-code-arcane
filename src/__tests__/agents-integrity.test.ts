import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeProfiles, parseProfile } from "../profiles.js";

/**
 * Agents and skills point at each other by name, and until this test existed
 * nothing checked that the names resolved. An audit found 130 dead references:
 * 66 `skills:` entries naming skills that are not on disk, and 64 delegation
 * instructions naming agents that do not exist. Worse, 12 skills declared
 * `agent:` without `context: fork`, which makes the field inert - so the
 * declared agent never ran, and nobody noticed because nothing read the field.
 *
 * The installer copies division directories verbatim and validates nothing, so
 * a broken agent installs silently. That is what this closes.
 *
 * ALLOWLIST RULE: entries may be removed, never added. A new dead reference is
 * a failing test, not a new allowlist line. If you are here because the test
 * failed, fix the reference - do not widen the list.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Fields Claude Code actually reads from an agent definition.
 *  Source: code.claude.com/docs/en/sub-agents */
const AGENT_FIELDS = new Set([
  "name",
  "description",
  "tools",
  "disallowedTools",
  "model",
  "permissionMode",
  "maxTurns",
  "skills",
  "mcpServers",
  "hooks",
  "memory",
  "background",
  "effort",
  "isolation",
  "color",
  "initialPrompt",
]);

/** Fields Claude Code actually reads from a SKILL.md.
 *  Source: code.claude.com/docs/en/skills
 *  `category` is a repo-local convention the runtime ignores; src/ uses it. */
const SKILL_FIELDS = new Set([
  "name",
  "description",
  "when_to_use",
  "argument-hint",
  "arguments",
  "disable-model-invocation",
  "user-invocable",
  "allowed-tools",
  "disallowed-tools",
  "model",
  "effort",
  "context",
  "agent",
  "background",
  "hooks",
  "paths",
  "shell",
  "metadata",
  "license",
  "compatibility",
  "category",
]);

/**
 * Agents whose `skills:` or delegation targets are still dead. Shrink only.
 * Each line is a debt, not a decision.
 */
const KNOWN_DEAD_REFS: Record<string, string[]> = {};

type Frontmatter = Record<string, string>;

interface Parsed {
  file: string;
  slug: string;
  fm: Frontmatter;
  /** top-level keys, in file order */
  keys: string[];
  body: string;
}

function parse(file: string): Parsed | null {
  // The repo is checked out CRLF on Windows. Normalise first: in JS `.` does not
  // match `\r`, so `(.*)$` never closes on a CRLF line and every field silently
  // fails to parse.
  const raw = fs.readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4);
  const fm: Frontmatter = {};
  const keys: string[] = [];
  for (const line of block.split("\n")) {
    if (/^\s/.test(line)) continue; // nested map entry
    const m = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!m) continue;
    keys.push(m[1]);
    fm[m[1]] = m[2].trim();
  }
  const slug = path.basename(file) === "SKILL.md"
    ? path.basename(path.dirname(file))
    : path.basename(file, ".md");
  return { file: path.relative(repoRoot, file).replace(/\\/g, "/"), slug, fm, keys, body };
}

function walk(dir: string, match: (name: string) => boolean): string[] {
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) return [];
  const out: string[] = [];
  const rec = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) rec(p);
      else if (match(e.name)) out.push(p);
    }
  };
  rec(full);
  return out;
}

// ---------------------------------------------------------------- fixtures

const agents = walk("agents", (n) => n.endsWith(".md"))
  .map(parse)
  .filter((a): a is Parsed => a !== null);

const skills = walk("skills", (n) => n === "SKILL.md")
  .map(parse)
  .filter((s): s is Parsed => s !== null);

/** Contributor-only skills: no agent or profile reaches them, but their frontmatter follows the same rules. */
const maintainerSkills = walk(path.join("maintainers", "skills"), (n) => n === "SKILL.md")
  .map(parse)
  .filter((s): s is Parsed => s !== null);

const agentNames = new Set(agents.map((a) => a.slug));
const agentDivision = new Map(
  agents.map((a) => [a.slug, a.file.split("/")[1]] as [string, string]),
);
const skillNames = new Set(skills.map((s) => s.slug));

interface Profile {
  name: string;
  agents: string[];
  skills: string[];
}

// Parsed with the installer's own reader: a hand-rolled block regex stopped at the
// first comment inside `agents:` and read the profile as shipping no agents.
const profiles: Profile[] = fs
  .readdirSync(path.join(repoRoot, "profiles"))
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => parseProfile(path.join(repoRoot, "profiles", f)))
  .filter((p) => !p.renamed_to)
  .map((p) => ({ name: p.name, agents: p.agents, skills: p.skills }));

/** profiles that ship a given skill */
function shippedBy(skill: string): Profile[] {
  return profiles.filter((p) => p.skills.includes(skill));
}

/**
 * Whether a profile makes a named agent available. An `agents:` entry is either
 * a whole division (`game`) or a single agent (`game/qa-lead`), so reachability
 * is not just "is the division listed".
 */
function profileProvides(profile: Profile, agentSlug: string): boolean {
  const division = agentDivision.get(agentSlug);
  if (!division) return false;
  return profile.agents.some(
    (raw) => raw === division || raw === `${division}/${agentSlug}`,
  );
}

function listField(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((x) => x.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function allowed(file: string, ref: string): boolean {
  return (KNOWN_DEAD_REFS[file] ?? []).includes(ref);
}

// ---------------------------------------------------------------- tests

describe("agent definitions", () => {
  it("all parse and have name + description", () => {
    expect(agents.length).toBeGreaterThan(100);
    const broken = agents.filter((a) => !a.fm.name || !a.fm.description);
    expect(broken.map((b) => b.file)).toEqual([]);
  });

  it("name matches filename", () => {
    const mismatched = agents
      .filter((a) => a.fm.name !== a.slug)
      .map((a) => `${a.file}: name=${a.fm.name}`);
    expect(mismatched).toEqual([]);
  });

  it("declare only fields Claude Code reads", () => {
    const unknown: string[] = [];
    for (const a of agents) {
      for (const k of a.keys) {
        if (!AGENT_FIELDS.has(k)) unknown.push(`${a.file}: ${k}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("never declare a field with an empty value", () => {
    // `disallowedTools:` with nothing after it reads as a guard and is a no-op.
    const empty: string[] = [];
    for (const a of agents) {
      for (const k of a.keys) {
        if (a.fm[k] === "") empty.push(`${a.file}: ${k}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it("every description says when to invoke the agent", () => {
    // The description is the only thing that decides whether an agent gets
    // picked or ignored. A description that only says what the agent *is*
    // leaves that decision to chance.
    // "Use when / for / as / before / to …" all count. What does not count is
    // a description that never says when.
    const trigger = /\buse (when|for|as|before|after|to|this agent|it)\b|trigger:/i;
    const silent = agents
      .filter((a) => !trigger.test(a.fm.description ?? ""))
      .map((a) => a.file);
    expect(silent).toEqual([]);
  });

  it("no description runs past 400 characters", () => {
    const bloated = agents
      .filter((a) => (a.fm.description ?? "").length > 400)
      .map((a) => `${a.file}: ${(a.fm.description ?? "").length} chars`);
    expect(bloated).toEqual([]);
  });

  it("maxTurns is one of the three tier budgets", () => {
    // docs/agent-hierarchy.md defines Director 30 / Lead 20 / Specialist 15.
    // Nine agents carried 10, 12 or 25, which belongs to no tier.
    const offSpec = agents
      .filter((a) => !["15", "20", "30"].includes(a.fm.maxTurns ?? ""))
      .map((a) => `${a.file}: maxTurns=${a.fm.maxTurns}`);
    expect(offSpec).toEqual([]);
  });

  it("consultants cannot write and executors declare permissionMode", () => {
    // A subagent cannot ask anything: AskUserQuestion is not in its tool pool.
    // So an agent either writes on its own (permissionMode: acceptEdits) or is
    // read-only by construction. Holding Write/Edit plus an approval gate in the
    // body is the deadlock this split removes.
    const wrong: string[] = [];
    for (const a of agents) {
      const canWrite = /\b(Write|Edit)\b/.test(a.fm.tools ?? "");
      const denied = /\b(Write|Edit)\b/.test(a.fm.disallowedTools ?? "");
      if (canWrite && !a.fm.permissionMode) {
        wrong.push(`${a.file}: has Write/Edit but no permissionMode`);
      }
      if (!canWrite && !denied) {
        wrong.push(`${a.file}: read-only but disallowedTools does not say so`);
      }
      if (canWrite && denied) {
        wrong.push(`${a.file}: Write/Edit both allowed and denied`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("executors carry no approval gate in their body", () => {
    // These phrases make a subagent wait for a reply that cannot arrive.
    const gate =
      /the user approves|May I write|not an autonomous|Wait for "?yes"?|confirm with the user/i;
    const blocked = agents
      .filter((a) => a.fm.permissionMode === "acceptEdits" && gate.test(a.body))
      .map((a) => a.file);
    expect(blocked).toEqual([]);
  });

  it("no delegation block is left empty or mangled", () => {
    // Removing a dead reference with a regex can leave the header behind with
    // nothing under it, or eat a name that sat inside the header text. A
    // "**Delegate to:**" with no targets is worse than no header at all: it
    // tells the agent to delegate and not to whom.
    const header = /\*\*([^*]*(?:Delegate|Report|Escalat|Coordinat)[^*]*)\*\*:?(.*)$/i;
    const bullet = /^\s*[-*]\s+\S/;
    const broken: string[] = [];

    for (const a of agents) {
      const lines = a.body.split("\n");
      lines.forEach((line, i) => {
        const m = header.exec(line);
        if (!m) return;
        const [, label, inline] = m;

        // mangled: a name was removed from inside the header itself
        if (/\s{2,}/.test(label) || /\s:$/.test(label) || / :/.test(label)) {
          broken.push(`${a.file}:${i + 1} mangled header: ${line.trim()}`);
          return;
        }
        if (inline.trim()) return;

        // no inline targets: a real list item must follow
        for (let j = i + 1; j < lines.length; j++) {
          if (!lines[j].trim()) continue;
          const isList = bullet.test(lines[j]) && !lines[j].trim().startsWith("**");
          if (!isList) broken.push(`${a.file}:${i + 1} empty block: ${line.trim()}`);
          return;
        }
        broken.push(`${a.file}:${i + 1} empty block at end of file: ${line.trim()}`);
      });
    }
    expect(broken).toEqual([]);
  });

  it("every skill they preload exists on disk", () => {
    const dead: string[] = [];
    for (const a of agents) {
      for (const ref of listField(a.fm.skills)) {
        if (!skillNames.has(ref) && !allowed(a.file, ref)) dead.push(`${a.file}: ${ref}`);
      }
    }
    expect(dead).toEqual([]);
  });

  it("every agent they delegate to exists on disk", () => {
    // Only structured delegation blocks: "**Delegate to:** `x`", "**Report to:** `y`".
    const dead: string[] = [];
    const section =
      /\*\*(?:Delegates? to|Reports? to|Escalat\w*[^*]*|Coordinates? with)[^*]*\*\*:?([^*#]*)/gi;
    for (const a of agents) {
      for (const m of a.body.matchAll(section)) {
        for (const r of m[1].matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)*)`/g)) {
          const ref = r[1];
          if (agentNames.has(ref) || skillNames.has(ref)) continue;
          if (allowed(a.file, ref)) continue;
          dead.push(`${a.file}: ${ref}`);
        }
      }
    }
    expect([...new Set(dead)]).toEqual([]);
  });

  it("every agent named anywhere in their body exists", () => {
    // The block check above missed `### Coordinates with:`, "Work with **x**",
    // "(defer to x)" and `subagent_type: x`: unity-specialist delegated to three
    // sub-specialists that were never written. A role-shaped name is the signal.
    const role =
      /(?<![\w-])([a-z]+(?:-[a-z]+)*-(?:director|lead|engineer|designer|specialist|architect|manager|programmer|artist|writer|analyst|producer|reviewer|screener|tester|officer|advisor|strategist))(?![\w-])/g;
    const prose = new Set(["sub-specialist"]);
    const dead: string[] = [];
    for (const a of agents) {
      const names = [...a.body.matchAll(role)].map((m) => m[1]);
      names.push(...[...a.body.matchAll(/subagent_type:\s*"?([a-z0-9-]+)/g)].map((m) => m[1]));
      for (const ref of new Set(names)) {
        if (agentNames.has(ref) || skillNames.has(ref) || prose.has(ref)) continue;
        if (fs.existsSync(path.join(repoRoot, "rules", `${ref}.md`))) continue;
        dead.push(`${a.file}: ${ref}`);
      }
    }
    expect(dead).toEqual([]);
  });
});

describe("skill definitions", () => {
  it("declare only fields Claude Code reads", () => {
    const unknown: string[] = [];
    for (const s of [...skills, ...maintainerSkills]) {
      for (const k of s.keys) {
        if (!SKILL_FIELDS.has(k)) unknown.push(`${s.file}: ${k}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("context: only ever says fork", () => {
    const wrong = [...skills, ...maintainerSkills]
      .filter((s) => s.fm.context !== undefined && s.fm.context !== "fork")
      .map((s) => `${s.file}: context=${JSON.stringify(s.fm.context)}`);
    expect(wrong).toEqual([]);
  });

  it("agent: is never declared without context: fork", () => {
    // Without the fork, the field is inert and the declared agent never runs.
    const inert = skills
      .filter((s) => s.fm.agent && s.fm.context !== "fork")
      .map((s) => `${s.file}: agent=${s.fm.agent} but no context: fork`);
    expect(inert).toEqual([]);
  });

  it("agent: names an agent that exists", () => {
    const missing = skills
      .filter((s) => s.fm.agent && !agentNames.has(s.fm.agent))
      .map((s) => `${s.file}: agent=${s.fm.agent}`);
    expect(missing).toEqual([]);
  });

  it("agent: is reachable from every profile that ships the skill", () => {
    // An unreachable agent falls back to a general-purpose one: it reads
    // broadly, burns its turns, and returns a generic summary.
    const unreachable: string[] = [];
    for (const s of skills) {
      const target = s.fm.agent;
      if (!target) continue;
      const division = agentDivision.get(target);
      if (!division) continue; // covered by the previous test
      for (const p of shippedBy(s.slug)) {
        if (!profileProvides(p, target)) {
          unreachable.push(
            `${s.slug} -> ${target} (${division}/) unreachable from profile ${p.name}`,
          );
        }
      }
    }
    expect(unreachable).toEqual([]);
  });
});

describe("profiles", () => {
  const core = profiles.find((p) => p.name === "core")!;

  it("every agent is installed by some profile", () => {
    const orphans = agents.filter((a) => !profiles.some((p) => profileProvides(p, a.slug)));
    expect(orphans.map((a) => a.file)).toEqual([]);
  });

  it("an agent only preloads skills its profile installs", () => {
    // Division entries dragged every agent of a division into each profile: backend-go
    // shipped android-engineer, and its agents preloaded 49 skills it never installed.
    // A missing preload is skipped, so the agent ran without the knowledge it declared.
    const missing: string[] = [];
    for (const p of profiles) {
      const installed = new Set([...core.skills, ...p.skills]);
      for (const a of agents.filter((x) => profileProvides(p, x.slug) || profileProvides(core, x.slug))) {
        for (const ref of listField(a.fm.skills)) {
          if (!installed.has(ref)) missing.push(`${p.name}: ${a.slug} preloads ${ref}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("every agents: entry resolves, as a division or a single agent", () => {
    const divisions = new Set(
      fs
        .readdirSync(path.join(repoRoot, "agents"), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name),
    );
    const ghosts: string[] = [];
    for (const p of profiles) {
      for (const raw of p.agents) {
        const slash = raw.indexOf("/");
        if (slash < 0) {
          if (!divisions.has(raw)) ghosts.push(`${p.name}: agents/${raw}/ does not exist`);
          continue;
        }
        const division = raw.slice(0, slash);
        const agent = raw.slice(slash + 1);
        if (!divisions.has(division)) {
          ghosts.push(`${p.name}: agents/${division}/ does not exist`);
        } else if (!fs.existsSync(path.join(repoRoot, "agents", division, `${agent}.md`))) {
          ghosts.push(`${p.name}: agents/${division}/${agent}.md does not exist`);
        }
      }
    }
    expect(ghosts).toEqual([]);
  });

  it("every skill they list exists", () => {
    const ghosts: string[] = [];
    for (const p of profiles) {
      for (const s of p.skills) {
        if (!skillNames.has(s)) ghosts.push(`${p.name}: ${s}`);
      }
    }
    expect(ghosts).toEqual([]);
  });
});

describe("agent relations inside each profile", () => {
  // 3.3.0 shipped 155 references to agents the same profile never installs:
  // go-engineer reported to the game division's lead-programmer, and 24 agents
  // had no installed agent to report to at all. A subagent cannot spawn another,
  // so the name only misleads it and the main session, which falls back to a
  // general-purpose agent. Each profile is checked as installed: core plus its
  // workflows, the same merge the installer runs.
  const installs = profiles
    .filter((p) => p.name !== "core")
    .map((p) => {
      const merged = mergeProfiles(path.join(repoRoot, "profiles"), [p.name]);
      const shipped = { name: p.name, agents: merged.agents, skills: [] };
      return { name: p.name, agents: new Set(agents.filter((a) => profileProvides(shipped, a.slug)).map((a) => a.slug)) };
    })
    .filter((i) => i.agents.size > 0);

  const word = /(?<![\w-])([a-z]+(?:-[a-z]+)*)(?![\w-])/g;
  /** Agents a line names: hyphenated slugs anywhere, one-word slugs (`writer`) only in backticks. */
  function named(line: string, self: string): string[] {
    return [...line.matchAll(word)]
      .map((m) => m[1])
      .filter((n) => n !== self && agentNames.has(n) && (n.includes("-") || line.includes(`\`${n}\``)));
  }
  // An agent shipped by several profiles may list per-stack alternatives
  // ("`ios-engineer` or `android-engineer`, whichever is installed"). The guard
  // only covers a name that some profile shipping the agent does install.
  const guard = /whichever is installed|when installed/i;

  it("an agent only names agents its profile installs", () => {
    const foreign = new Set<string>();
    for (const a of agents) {
      const homes = installs.filter((i) => i.agents.has(a.slug));
      for (const line of a.body.split("\n")) {
        for (const ref of named(line, a.slug)) {
          const missing = homes.filter((i) => !i.agents.has(ref));
          if (!missing.length) continue;
          if (guard.test(line) && homes.some((i) => i.agents.has(ref))) continue;
          foreign.add(`${a.file}: ${ref} (not installed by ${missing.map((i) => i.name).join(", ")})`);
        }
      }
    }
    expect([...foreign].sort()).toEqual([]);
  });

  it("every agent keeps a relation in every profile that installs it", () => {
    // Removing a cross-profile name must not leave an agent with nobody to hand
    // work to. A relation is an installed agent it names, or a report line to
    // the main session, a human or the founder, which a subagent always has.
    // The header line plus the bullets under it: "**Report to:**\n- the main session".
    const block = /\b(?:Reports? to|Escalate to)\b[^\n]*(?:\n[ \t]*-[^\n]*)*/gi;
    const upward = (body: string) =>
      [...body.matchAll(block)].some((m) => /\b(?:the main session|a human|user|the founder)\b/i.test(m[0]));
    const isolated: string[] = [];
    for (const i of installs) {
      for (const a of agents.filter((x) => i.agents.has(x.slug))) {
        const peers = a.body.split("\n").flatMap((line) => named(line, a.slug)).filter((n) => i.agents.has(n));
        if (!peers.length && !upward(a.body)) isolated.push(`${i.name}: ${a.slug}`);
      }
    }
    expect(isolated).toEqual([]);
  });
});

describe("the allowlist only shrinks", () => {
  it("has no entry for a reference that already resolves", () => {
    // A stale allowlist entry hides the fact that the debt was paid.
    const stale: string[] = [];
    for (const [file, refs] of Object.entries(KNOWN_DEAD_REFS)) {
      for (const ref of refs) {
        if (skillNames.has(ref) || agentNames.has(ref)) stale.push(`${file}: ${ref}`);
      }
    }
    expect(stale).toEqual([]);
  });
});
