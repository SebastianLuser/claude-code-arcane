import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listSkills } from "../skills-catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.resolve(__dirname, "..", "..", "skills");

describe("listSkills", () => {
  it("lists the repo catalog sorted by name with descriptions", () => {
    const skills = listSkills(SKILLS_DIR);

    expect(skills.length).toBeGreaterThan(100);
    const names = skills.map((s) => s.name);
    expect(names).toContain("commit");
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);

    const commit = skills.find((s) => s.name === "commit")!;
    expect(commit.description).toContain("conventional commit");
    expect(commit.description).not.toMatch(/^["']/);
  });

  it("reads block-scalar descriptions", () => {
    const jira = listSkills(SKILLS_DIR).find((s) => s.name === "jira-tickets")!;

    expect(jira.description).toContain("Jira");
    expect(jira.description).not.toContain("|");
  });

  it("returns an empty list for a missing directory", () => {
    expect(listSkills(path.join(os.tmpdir(), "arcane-no-such-dir"))).toEqual([]);
  });

  it("ignores directories without SKILL.md and underscore-prefixed ones", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-catalog-"));
    try {
      fs.mkdirSync(path.join(tmp, "real"));
      fs.writeFileSync(
        path.join(tmp, "real", "SKILL.md"),
        "---\nname: real\ndescription: A real skill.\n---\n",
      );
      fs.mkdirSync(path.join(tmp, "no-skill-md"));
      fs.mkdirSync(path.join(tmp, "_internal"));
      fs.writeFileSync(path.join(tmp, "_internal", "SKILL.md"), "---\n---\n");

      expect(listSkills(tmp)).toEqual([
        { name: "real", description: "A real skill." },
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
