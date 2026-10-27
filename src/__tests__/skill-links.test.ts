import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseProfile } from "../profiles.js";

/**
 * A skill that links to a reference file the model then cannot open loses that
 * guidance silently. email-sequence linked three references that never existed
 * and shader-dev's 30 reference pages linked a SKILL.md beside them. Every
 * relative Markdown link to a file inside skills/ has to resolve.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS = path.join(repoRoot, "skills");

/** Links that are Markdown syntax examples, not references. */
const EXAMPLES = new Set(["skills/obsidian-markdown/SKILL.md -> Note.md"]);

/** Skill -> another profile's skill, left as a pointer (see "skills in every other profile"). */
const CROSS_PROFILE_POINTERS = [
  "ai-security -> llm-evals",
  "ai-security -> red-team",
  "ai-security -> supply-chain-security",
  "architecture-decision -> architecture-review",
  "architecture-decision -> ue-project-context",
  "architecture-review -> architecture-decision",
  "asset-spec -> art-bible",
  "audio-bible -> art-bible",
  "audit-game -> doc-pas",
  "aws-solution-architect -> database-ops",
  "aws-solution-architect -> file-uploads",
  "azure-cloud-architect -> database-ops",
  "blender-animation -> adaptive-music",
  "blender-animation -> sfx-design",
  "blender-animation -> ue-animation-system",
  "blender-context -> meshy-derive",
  "blender-export -> meshy-derive",
  "blender-export -> ue-animation-system",
  "blender-export -> ue-materials-rendering",
  "blender-materials -> shader-dev",
  "career-registry -> client-screen",
  "career-registry -> contract-and-proposal-writer",
  "career-registry -> freelance-hunt",
  "career-registry -> freelance-pipeline",
  "career-registry -> job-apply",
  "career-registry -> job-hunt",
  "career-registry -> job-scrape",
  "cdn-setup -> cloudflare",
  "ci-cd-setup -> supply-chain-security",
  "click-path-audit -> playwright-pro",
  "click-path-audit -> ui-polish",
  "cloudflare -> coding-agent-guardrails",
  "cloudflare -> file-uploads",
  "cold-outreach -> cold-email",
  "cold-outreach -> interview-prep",
  "consistency-check -> architecture-decision",
  "consistency-check -> design-system",
  "contract-testing -> api-docs",
  "contract-testing -> deploy-check",
  "contract-testing -> doc-rfc",
  "contract-testing -> scaffold-go",
  "create-ticket -> jira-tickets",
  "data-migrations -> audit-dev",
  "data-migrations -> db-diagram",
  "data-migrations -> deploy-check",
  "data-migrations -> scaffold-go",
  "database-indexing -> db-diagram",
  "database-indexing -> search-setup",
  "database-ops -> database",
  "database-ops -> incident",
  "database-ops -> observability-setup",
  "database-ops -> slo-sli",
  "deps-audit -> supply-chain-security",
  "devcontainers -> coding-agent-guardrails",
  "doc-gdd -> doc-pas",
  "doc-pas -> doc-rfc",
  "estimate -> create-stories",
  "estimate -> prototype",
  "estimate -> sprint-plan",
  "firebase -> backup-strategy",
  "firebase -> frontend-dev",
  "firebase -> supply-chain-security",
  "freelance-hunt -> job-hunt",
  "freelance-kickoff -> create-epics",
  "freelance-kickoff -> create-stories",
  "freelance-kickoff -> product-discovery",
  "freelance-scan -> job-scrape",
  "gcp-cloud-architect -> database-ops",
  "incident -> incident-response",
  "incident -> llm-evals",
  "incident-response -> llm-evals",
  "install-mcp -> scaffold-unity",
  "install-mcp -> ue-blueprints",
  "install-mcp -> ue-cpp-foundations",
  "install-mcp -> ue-project-context",
  "install-mcp -> unity-game-architecture",
  "job-outcome -> freelance-pipeline",
  "job-outcome -> interview-prep",
  "job-outcome -> job-upskill",
  "llm-evals -> ai-security",
  "llm-evals -> llm-cost-optimizer",
  "llm-evals -> observability",
  "llm-evals -> rag-architect",
  "map-systems -> design-system",
  "master-profile -> cv-tailor",
  "master-profile -> job-hunt",
  "master-profile -> linkedin-comment",
  "master-profile -> linkedin-inbox",
  "master-profile -> linkedin-optimize",
  "master-profile -> linkedin-post",
  "master-profile -> linkedin-reply",
  "meshy-derive -> blender-context",
  "meshy-derive -> blender-export",
  "meshy-derive -> blender-materials",
  "meshy-derive -> blender-modeling",
  "mfa-setup -> audit-dev",
  "mfa-setup -> deploy-check",
  "mfa-setup -> doc-rfc",
  "mfa-setup -> scaffold-go",
  "observability -> llm-evals",
  "owasp-top10-check -> audit-log",
  "owasp-top10-check -> csp-headers",
  "owasp-top10-check -> deps-audit",
  "owasp-top10-check -> error-tracking",
  "owasp-top10-check -> jwt-strategy",
  "owasp-top10-check -> logging-setup",
  "owasp-top10-check -> mfa-setup",
  "owasp-top10-check -> oauth-setup",
  "owasp-top10-check -> rate-limiting",
  "owasp-top10-check -> rbac-abac",
  "perf-profile -> architecture-decision",
  "portfolio-site -> job-hunt",
  "product-spec -> doc-gdd",
  "product-spec -> doc-rfc",
  "quick-design -> story-readiness",
  "rag-architect -> backup-strategy",
  "rag-architect -> pgvector-search",
  "rollback-strategy -> audit-dev",
  "rollback-strategy -> data-migrations",
  "slo-sli -> audit-dev",
  "slo-sli -> deploy-check",
  "slo-sli -> incident",
  "slo-sli -> scaffold-go",
  "sprint-plan -> qa-plan",
  "state-management -> jwt-strategy",
  "story-done -> smoke-check",
  "story-readiness -> quick-design",
  "supply-chain-security -> ci-cd-setup",
  "supply-chain-security -> deps-audit",
  "supply-chain-security -> incident-response",
  "ue-audio-system -> audio-audit",
  "ue-audio-system -> audio-mix",
  "user-persona -> meeting-to-tasks",
  "user-persona -> product-spec",
  "ux-review -> ux-design",
  "vercel-deploy -> nextjs-best-practices",
  "vercel-deploy -> rollback-strategy",
];


function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(p);
    return e.name.endsWith(".md") ? [p] : [];
  });
}

describe("relative links in skills", () => {
  it("every linked file exists", () => {
    const broken: string[] = [];
    for (const file of walk(SKILLS)) {
      const text = fs.readFileSync(file, "utf-8").replace(/```[\s\S]*?```/g, "");
      for (const [, raw] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = raw.split("#")[0];
        if (!/^[\w./-]+\.(md|py|json|sh|ya?ml|txt|cjs|js|ts)$/.test(target) || /^[a-z]+:/.test(target)) continue;
        const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
        if (EXAMPLES.has(`${rel} -> ${target}`)) continue;
        if (!fs.existsSync(path.resolve(path.dirname(file), target))) broken.push(`${rel} -> ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });
});

describe("core skills", () => {
  // Core goes into every project, job-hunt included, yet hotfix sent it to
  // /qa-plan and /bug-report and start to /scaffold-go: skills another profile ships.
  it("name another profile's skill only behind an install check", () => {
    const core = parseProfile(path.join(repoRoot, "profiles", "core.yaml")).skills;
    const all = new Set(fs.readdirSync(SKILLS));
    const unguarded = core.filter((skill) => {
      const named = walk(path.join(SKILLS, skill)).flatMap((f) =>
        [...fs.readFileSync(f, "utf-8").matchAll(/(?<![\w/.-])\/([a-z][a-z0-9-]+)/g)].map((m) => m[1]),
      );
      const foreign = named.some((n) => all.has(n) && !core.includes(n));
      return foreign && !fs.readFileSync(path.join(SKILLS, skill, "SKILL.md"), "utf-8").includes("/arcane-add");
    });
    expect(unguarded).toEqual([]);
  });
});

describe("skills in every other profile", () => {
  // 155 references named a skill the profile never installs: game skills shipped
  // in the Figma profile, test-setup writing a file only smoke-check reads. These
  // stay as pointers to another profile, which agent-delegation.md tells Claude to
  // offer with /arcane-add. The list only shrinks: a new one belongs in the profile.
  const POINTERS = new Set(CROSS_PROFILE_POINTERS);

  it("name another profile's skill only as a known pointer", () => {
    const profilesDir = path.join(repoRoot, "profiles");
    const core = parseProfile(path.join(profilesDir, "core.yaml")).skills;
    const all = new Set(fs.readdirSync(SKILLS));
    const found = new Set<string>();
    for (const f of fs.readdirSync(profilesDir).filter((f) => f.endsWith(".yaml") && f !== "core.yaml")) {
      const text = fs.readFileSync(path.join(profilesDir, f), "utf-8");
      if (/^renamed_to:/m.test(text)) continue;
      const own = new Set([...core, ...parseProfile(path.join(profilesDir, f)).skills]);
      for (const skill of own) {
        if (core.includes(skill)) continue;
        for (const file of walk(path.join(SKILLS, skill))) {
          for (const [, name] of fs.readFileSync(file, "utf-8").matchAll(/(?<![\w/.-])\/([a-z][a-z0-9-]+)/g)) {
            if (all.has(name) && name !== skill && !own.has(name)) found.add(`${skill} -> ${name}`);
          }
        }
      }
    }
    expect([...found].filter((p) => !POINTERS.has(p)).sort()).toEqual([]);
    expect([...POINTERS].filter((p) => !found.has(p))).toEqual([]);
  });
});

describe(".claude/docs references", () => {
  // what-next read .claude/docs/workflow-catalog.yaml, a file this repo never had.
  it("every one names a file under docs/", () => {
    const shipped = ["skills", "agents", "rules", "output-styles", "docs"].flatMap((d) =>
      walk(path.join(repoRoot, d)),
    );
    const missing = shipped.flatMap((f) =>
      [...fs.readFileSync(f, "utf-8").matchAll(/\.claude\/docs\/([\w./-]+\.(?:md|ya?ml|json))/g)]
        .map((m) => m[1])
        .filter((doc) => !fs.existsSync(path.join(repoRoot, "docs", doc)))
        .map((doc) => `${path.relative(repoRoot, f).replace(/\\/g, "/")} -> ${doc}`),
    );
    expect(missing).toEqual([]);
  });
});

describe("game templates", () => {
  // Nine of them installed into every game project as .claude/skills/_templates/
  // with no skill or agent pointing at them.
  it("are each named by a skill or an agent", () => {
    const readers = [...walk(SKILLS), ...walk(path.join(repoRoot, "agents"))].map((f) => fs.readFileSync(f, "utf-8"));
    const unused = fs
      .readdirSync(path.join(repoRoot, "templates", "gamedev"))
      .filter((t) => !readers.some((text) => text.includes(t)));
    expect(unused).toEqual([]);
  });
});

describe("agent names in skills and rules", () => {
  // design-system routed work to engine-programmer and ui-programmer, run-migrations
  // to postgres-specialist: agents that were never written, so the Task call fell
  // back to a general-purpose agent with none of the expertise asked for.
  it("are agents that exist", () => {
    const roles = /`([a-z]+(?:-[a-z]+)*-(?:director|lead|engineer|specialist|programmer|designer|architect|manager|analyst|artist|writer|tester|officer|reviewer|planner|builder|producer))`/g;
    const agents = new Set(
      walk(path.join(repoRoot, "agents")).map((f) => path.basename(f, ".md")),
    );
    const known = (name: string) =>
      agents.has(name) ||
      fs.existsSync(path.join(SKILLS, name)) ||
      fs.existsSync(path.join(repoRoot, "rules", `${name}.md`));
    const missing = [...walk(SKILLS), ...walk(path.join(repoRoot, "rules"))].flatMap((f) =>
      [...fs.readFileSync(f, "utf-8").matchAll(roles)]
        .map((m) => m[1])
        .filter((name) => !known(name))
        .map((name) => `${path.relative(repoRoot, f).replace(/\\/g, "/")} -> ${name}`),
    );
    expect(missing).toEqual([]);
  });
});
