import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A skill that links to a reference file the model then cannot open loses that
 * guidance silently. email-sequence linked three references that never existed
 * and shader-dev's 30 reference pages linked a SKILL.md beside them. Every
 * relative Markdown link to a file inside skills/ has to resolve.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS = path.join(repoRoot, "skills");

/** Links that are Markdown syntax examples, not references. */
const EXAMPLES = new Set(["skills/obsidian-markdown/SKILL.md -> Nota.md"]);

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
