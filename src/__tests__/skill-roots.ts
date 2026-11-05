import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The skills every install can get: what npm publishes and the profiles list. */
export const SHIPPED_SKILLS = path.join(REPO_ROOT, "skills");

/**
 * Skills for whoever works on Arcane itself. npm never publishes `maintainers/`, and no
 * profile installs them; the repo's own `.claude/skills/` mirrors them for contributors.
 */
export const MAINTAINER_SKILLS = path.join(REPO_ROOT, "maintainers", "skills");

/** Both roots: every skill follows the same structural rules, wherever it lives. */
export const SKILL_ROOTS = [SHIPPED_SKILLS, MAINTAINER_SKILLS];

export interface SkillDir {
  name: string;
  root: string;
  dir: string;
}

/** Every folder with a SKILL.md under `roots`, by name. */
export function skillDirs(roots: readonly string[] = SKILL_ROOTS): SkillDir[] {
  return roots.flatMap((root) =>
    fs.existsSync(root)
      ? fs
          .readdirSync(root, { withFileTypes: true })
          .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, "SKILL.md")))
          .map((e) => ({ name: e.name, root, dir: path.join(root, e.name) }))
      : [],
  );
}

/** The folder of skill `name` in any root, or null. */
export function findSkill(name: string, roots: readonly string[] = SKILL_ROOTS): string | null {
  for (const root of roots) {
    const dir = path.join(root, name);
    if (fs.existsSync(path.join(dir, "SKILL.md"))) return dir;
  }
  return null;
}
