import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Skills imported from plugin repos kept their plugin wiring: `.mcp.json`, a
 * `.claude-plugin/plugin.json`, a `settings.json`, an `agents/` folder and hooks
 * on `${CLAUDE_PLUGIN_ROOT}`. A skill folder loads none of that, so
 * playwright-pro's TestRail and BrowserStack sub-commands called MCP tools that
 * never existed and self-improving-agent spawned an agent that was never installed.
 */

const skillsDir = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".."), "skills");
const PLUGIN_ONLY = [".mcp.json", ".claude-plugin", "settings.json", "CLAUDE.md", "agents"];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? [p, ...walk(p)] : [p];
  });
}

describe("skill folders", () => {
  const skills = fs.readdirSync(skillsDir).filter((d) => fs.existsSync(path.join(skillsDir, d, "SKILL.md")));

  it("hold nothing that only a plugin loads", () => {
    const found = skills.flatMap((s) =>
      PLUGIN_ONLY.filter((name) => fs.existsSync(path.join(skillsDir, s, name))).map((name) => `${s}/${name}`),
    );
    expect(found).toEqual([]);
  });

  it("never rely on ${CLAUDE_PLUGIN_ROOT}", () => {
    const found = skills.flatMap((s) =>
      walk(path.join(skillsDir, s))
        .filter((f) => /\.(md|json|sh|py|ya?ml)$/.test(f))
        .filter((f) => fs.readFileSync(f, "utf-8").includes("CLAUDE_PLUGIN_ROOT"))
        .map((f) => path.relative(skillsDir, f).replace(/\\/g, "/")),
    );
    expect(found).toEqual([]);
  });

  it("ship only scripts something in the skill names", () => {
    // 79 scripts sat in scripts/ folders no file of their skill mentioned, so Claude
    // never knew they were there. content-creator routes to these two in content-production.
    const namedElsewhere = new Set([
      "content-production/scripts/brand_voice_analyzer.py",
      "content-production/scripts/seo_optimizer.py",
    ]);
    const orphans = skills.flatMap((s) => {
      const files = walk(path.join(skillsDir, s)).filter((f) => fs.statSync(f).isFile() && !f.includes("__pycache__"));
      const texts = files
        .filter((f) => /\.(md|py|sh|json|ya?ml|txt|js|cjs|mjs|ts)$/.test(f))
        .map((f) => ({ f, text: fs.readFileSync(f, "utf-8") }));
      return files
        .filter((script) => /\.(py|sh|js|cjs|mjs|ts|ps1)$/.test(script))
        .filter((script) => {
          const base = path.basename(script);
          const imported = new RegExp(`\\b(import|from)\\s+[\\w.]*\\b${base.replace(/\.\w+$/, "")}\\b`);
          return !texts.some(
            ({ f, text }) => f !== script && (text.includes(base) || (f.endsWith(".py") && imported.test(text))),
          );
        })
        .map((f) => path.relative(skillsDir, f).replace(/\\/g, "/"))
        .filter((rel) => !namedElsewhere.has(rel));
    });
    expect(orphans).toEqual([]);
  });
});

describe("this repo's own .claude/skills", () => {
  // A hand-kept copy that drifted: 11 of its 19 skills were older than skills/,
  // self-improving-agent still with the plugin parts removed from the real one.
  it("mirrors skills/ exactly", () => {
    const own = path.join(skillsDir, "..", ".claude", "skills");
    const files = (dir: string) =>
      walk(dir)
        .filter((f) => fs.statSync(f).isFile())
        .map((f) => path.relative(dir, f))
        .sort();
    const drifted = fs.readdirSync(own).filter((s) => {
      if (!fs.existsSync(path.join(skillsDir, s))) return true;
      const mine = files(path.join(own, s));
      return (
        mine.join() !== files(path.join(skillsDir, s)).join() ||
        mine.some((f) => !fs.readFileSync(path.join(own, s, f)).equals(fs.readFileSync(path.join(skillsDir, s, f))))
      );
    });
    expect(drifted).toEqual([]);
  });
});
