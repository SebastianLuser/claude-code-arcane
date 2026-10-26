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

  it("ship only files something in the skill names", () => {
    // 79 scripts, and samples, templates and references beside them, sat in skill
    // folders no file of the skill mentioned, so Claude never knew they were there.
    // A script has to be named or imported; anything else may also be reached
    // through its folder ("see references/"). Licenses stay whether named or not.
    const orphans = skills.flatMap((s) => {
      const root = path.join(skillsDir, s);
      const files = walk(root).filter((f) => fs.statSync(f).isFile() && !f.includes("__pycache__"));
      const texts = files
        .filter((f) => /\.(md|py|sh|json|ya?ml|txt|js|cjs|mjs|ts|html|cs|csproj)$/.test(f))
        .map((f) => ({ f, text: fs.readFileSync(f, "utf-8") }));
      return files
        // docx-generator's .NET project builds every .cs under it, so its sources never need naming.
        .filter((file) => !/[\\/](SKILL\.md|LICENSE[^\\/]*|\.gitignore)$/.test(file) && !/\.(cs|slnx)$/.test(file))
        .filter((file) => {
          const base = path.basename(file);
          const rel = path.relative(root, file).replace(/\\/g, "/");
          const dir = path.dirname(rel);
          const script = /\.(py|sh|js|cjs|mjs|ts|ps1)$/.test(file);
          const imported = new RegExp(`\\b(import|from)\\s+[\\w.]*\\b${base.replace(/\.\w+$/, "")}\\b`);
          // The folder on its own ("see references/"), not a link to another file in it.
          const folder = new RegExp(`${dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(?![\\w.-])`);
          return !texts.some(
            ({ f, text }) =>
              f !== file &&
              (text.includes(base) ||
                (script && f.endsWith(".py") && imported.test(text)) ||
                (!script && dir !== "." && folder.test(text))),
          );
        })
        .map((f) => path.relative(skillsDir, f).replace(/\\/g, "/"));
    });
    expect(orphans).toEqual([]);
  });

  it("give every script a SKILL.md runs as a command an entry point", () => {
    // tech-stack-evaluator, tdd-guide and aws-solution-architect documented
    // `python scripts/x.py --flag` for eleven modules with no __main__: the command
    // printed nothing and exited 0.
    const missing = skills.flatMap((s) => {
      const root = path.join(skillsDir, s);
      const docs = walk(root)
        .filter((f) => f.endsWith(".md"))
        .map((f) => fs.readFileSync(f, "utf-8"))
        .join("\n");
      const invoked = new Set([...docs.matchAll(/python3?\s+(?:-\S+\s+)*(?:\S*\/)?([\w-]+\.py)\b/g)].map((m) => m[1]));
      return walk(root)
        .filter((f) => invoked.has(path.basename(f)) && !f.includes("__pycache__"))
        .filter((f) => !fs.readFileSync(f, "utf-8").includes("__main__"))
        .map((f) => path.relative(skillsDir, f).replace(/\\/g, "/"));
    });
    expect(missing).toEqual([]);
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
