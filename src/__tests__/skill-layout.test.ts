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
});
