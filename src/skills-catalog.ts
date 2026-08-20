import fs from "node:fs";
import path from "node:path";

export interface SkillEntry {
  name: string;
  description: string;
}

// Frontmatter always sits at the top of SKILL.md, so reading the whole file
// (some are tens of KB) to get one line is wasted work when the catalog has
// 400+ skills.
const FRONTMATTER_BYTES = 4096;

/**
 * Every skill directory in the content source, with its frontmatter
 * description, sorted by name. A directory without SKILL.md is not a skill;
 * `_`-prefixed ones are internal scaffolding.
 */
export function listSkills(skillsDir: string): SkillEntry[] {
  if (!fs.existsSync(skillsDir)) return [];
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith("_") &&
        fs.existsSync(path.join(skillsDir, d.name, "SKILL.md")),
    )
    .map((d) => ({
      name: d.name,
      description: readDescription(path.join(skillsDir, d.name, "SKILL.md")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readDescription(skillFile: string): string {
  const head = readHead(skillFile);
  const lines = head.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^description:/.test(l));
  if (idx === -1) return "";

  const inline = lines[idx].slice("description:".length).trim();

  // Block scalar (`description: |`): the value is the indented block below.
  if (inline === "|" || inline === ">" || /^[|>][-+]?$/.test(inline)) {
    const block: string[] = [];
    for (const line of lines.slice(idx + 1)) {
      if (line.trim() === "") continue;
      if (!/^\s/.test(line)) break;
      block.push(line.trim());
    }
    return block.join(" ");
  }

  return inline.replace(/^["']|["']$/g, "").trim();
}

function readHead(file: string): string {
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(FRONTMATTER_BYTES);
    const read = fs.readSync(fd, buf, 0, FRONTMATTER_BYTES, 0);
    return buf.subarray(0, read).toString("utf-8");
  } finally {
    fs.closeSync(fd);
  }
}
