import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Everything in this repo is English; Claude replies in the user's language
 * (rules/user-language.md). Half the skills, most agents and several scripts
 * were written in Spanish because nothing said otherwise, until all 533 files
 * were translated. This test finds Spanish prose line by line so none comes back.
 * Words a script needs in one language live in `*.<lang>.json` packs, exempt here.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ROOTS = ["skills", "agents", "rules", "output-styles", "hooks", "profiles", "docs", "src", "tests",
  "templates", "skills-selftest", "maintainers", ".claude/skills"];
const TOP_FILES = ["CLAUDE.md", "README.md", "ATTRIBUTION.md"];
const TEXT = /\.(md|py|ts|mjs|js|sh|ya?ml|json|txt|html|cs|base)$/;
// Language data packs hold the words a script detects in that language (slop.es.json).
const LANGUAGE_PACK = /\.[a-z]{2}\.json$/;
const SKIP_DIRS = new Set(["node_modules", "__pycache__", "dist", ".git"]);

// Only words that are unmistakably Spanish. Short or shared tokens (y, si, el, lo,
// sin, para, todo, no, es) are left out: GLSL's sin(), OOXML's <si>, x1/y1 and a
// TODO read as Spanish otherwise.
const SPANISH = new Set(("los las del que una por con como más pero sus este porque esta entre cuando muy sobre " +
  "también hasta hay donde quien desde nos durante todos uno les contra otros ese eso ante ellos esto antes algunos " +
  "qué unos otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo " +
  "nosotros mis ellas está están esté hacer hace cómo cuál aquí acá así cada usuario archivo nota notas oferta " +
  "ofertas paso pasos regla reglas nunca siempre puede tiene debe sólo solamente según además mientras").split(" "));
const ENGLISH = new Set(("the and of to in is that for it with as on be this are by or not from at an which you your " +
  "can if will all has have was but they their one should when what each must use do does only into than then them " +
  "these those there more any its new").split(" "));

function isSpanishLine(line: string): boolean {
  const words = line.toLowerCase().match(/[a-záéíóúñü]+/g) ?? [];
  if (words.length < 3) return false;
  const accented = /[áéíóúñ¿¡]/i.test(line);
  // Distinct words: an OOXML list naming `del` twice is not two Spanish words.
  const es = new Set(words.filter((w) => SPANISH.has(w))).size;
  const en = new Set(words.filter((w) => ENGLISH.has(w))).size;
  return es > en && (es >= 2 || (accented && es >= 1));
}

/** Prose only: fenced code blocks and inline code spans are code, not language. */
function proseLines(text: string, file: string): string[] {
  const lines = file.endsWith(".md") ? text.replace(/```[\s\S]*?```/g, "").split("\n") : text.split("\n");
  return lines.map((l) => l.replace(/`[^`]*`/g, " "));
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
    return TEXT.test(e.name) && !LANGUAGE_PACK.test(e.name) ? [p] : [];
  });
}

/** Repo-relative paths of files with a Spanish line. */
export function spanishFiles(): string[] {
  const files = [...ROOTS.flatMap((r) => walk(path.join(repoRoot, r))), ...TOP_FILES.map((f) => path.join(repoRoot, f))];
  return files
    .filter((f) => !f.endsWith(path.join("__tests__", "language.test.ts")))
    .filter((f) => proseLines(fs.readFileSync(f, "utf-8"), f).some(isSpanishLine))
    .map((f) => path.relative(repoRoot, f).replace(/\\/g, "/"))
    .sort();
}

describe("repo language", () => {
  it("has no file in Spanish", () => {
    expect(spanishFiles()).toEqual([]);
  });

  it("tells Spanish from English", () => {
    expect(isSpanishLine("Leer el perfil del usuario y crear la nota en el workspace.")).toBe(true);
    expect(isSpanishLine("Read the user's profile and create the note in the workspace.")).toBe(false);
  });
});
