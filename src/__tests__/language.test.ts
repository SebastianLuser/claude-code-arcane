import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPANISH_FILES } from "./language-allowlist.js";

/**
 * Everything in this repo is English; Claude replies in the user's language
 * (rules/user-language.md). Half the skills, most agents and several scripts
 * were written in Spanish because nothing said otherwise. This test finds
 * Spanish prose line by line; the files still in Spanish are listed in
 * language-allowlist.ts, a list that only shrinks.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ROOTS = ["skills", "agents", "rules", "output-styles", "hooks", "profiles", "docs", "src", "tests",
  "templates", "skills-selftest", "maintainers", ".claude/skills"];
const TOP_FILES = ["CLAUDE.md", "README.md", "ATTRIBUTION.md"];
const TEXT = /\.(md|py|ts|mjs|js|sh|ya?ml|json|txt|html|cs)$/;
// Language data packs hold the words a script detects in that language (slop.es.json).
const LANGUAGE_PACK = /\.[a-z]{2}\.json$/;
const SKIP_DIRS = new Set(["node_modules", "__pycache__", "dist", ".git"]);

const SPANISH = new Set(("el la los las del que y en un una por para con no es se lo como más pero sus le ya este si " +
  "porque esta entre cuando muy sin sobre también hasta hay donde quien desde todo nos durante todos uno les ni contra " +
  "otros ese eso ante ellos esto antes algunos qué unos otro otras otra él tanto esa estos mucho quienes nada muchos " +
  "cual poco ella estar estas algunas algo nosotros mi mis tú te ti tu tus ellas está están esté hacer hace cómo cuál " +
  "aquí acá así cada usuario archivo nota notas oferta ofertas paso pasos regla reglas nunca siempre").split(" "));
const ENGLISH = new Set(("the and of to in is that for it with as on be this are by or not from at an which you your " +
  "can if will all has have was but they their one should when what each must use do does only into than then them " +
  "these those there more any its no new").split(" "));

function isSpanishLine(line: string): boolean {
  const words = line.toLowerCase().match(/[a-záéíóúñü]+/g) ?? [];
  if (words.length < 4) return false;
  let es = /[áéíóúñ¿¡]/i.test(line) ? 1 : 0;
  let en = 0;
  for (const w of words) {
    if (SPANISH.has(w)) es++;
    if (ENGLISH.has(w)) en++;
  }
  return es >= 2 && es > en;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
    return TEXT.test(e.name) && !LANGUAGE_PACK.test(e.name) ? [p] : [];
  });
}

/** Repo-relative paths of files with at least two Spanish lines. */
export function spanishFiles(): string[] {
  const files = [...ROOTS.flatMap((r) => walk(path.join(repoRoot, r))), ...TOP_FILES.map((f) => path.join(repoRoot, f))];
  return files
    .filter((f) => !f.endsWith(path.join("__tests__", "language.test.ts")))
    .filter((f) => fs.readFileSync(f, "utf-8").split("\n").filter(isSpanishLine).length >= 2)
    .map((f) => path.relative(repoRoot, f).replace(/\\/g, "/"))
    .sort();
}

describe("repo language", () => {
  const found = spanishFiles();

  it("adds no new file in Spanish", () => {
    const allowed = new Set(SPANISH_FILES);
    expect(found.filter((f) => !allowed.has(f))).toEqual([]);
  });

  it("drops a file from the list once it is translated", () => {
    const still = new Set(found);
    expect(SPANISH_FILES.filter((f) => !still.has(f))).toEqual([]);
  });

  it("tells Spanish from English", () => {
    expect(isSpanishLine("Leer el perfil del usuario y crear la nota en el workspace.")).toBe(true);
    expect(isSpanishLine("Read the user's profile and create the note in the workspace.")).toBe(false);
  });
});
