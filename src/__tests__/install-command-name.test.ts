import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The docs told 133 different times to run `npx arcane install ...`. npx
 * resolves the *package* name, and this package is published as
 * claude-code-arcane; `arcane` on npm is an unrelated MVC framework whose bin is
 * called `arce`, so the documented command downloaded a stranger's package and
 * then failed with "could not determine executable to run".
 *
 * The confusing part is that bare `arcane` IS right once installed globally,
 * because that is the bin name. Only the npx form has to carry the package name.
 *
 * CHANGELOG is exempt: its entries are generated release notes quoting old
 * commit messages, and they get regenerated on the next release anyway.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
// This file is exempt from its own rule: explaining the wrong form requires
// writing it. CHANGELOG is exempt because it quotes old commit messages.
const EXEMPT = new Set(["CHANGELOG.md", "install-command-name.test.ts"]);
const SEARCHED = ["README.md", "CLAUDE.md", "package.json", "docs", "src"];

function walk(relative: string, out: string[]): void {
  const full = path.join(repoRoot, relative);
  if (!fs.existsSync(full)) return;
  const stat = fs.statSync(full);
  if (stat.isFile()) {
    out.push(relative);
    return;
  }
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__pycache__") continue;
    walk(path.join(relative, entry.name), out);
  }
}

describe("documented install command names the published package", () => {
  it("no file instructs `npx arcane`", () => {
    // Arrange
    const files: string[] = [];
    for (const entry of SEARCHED) walk(entry, files);

    // Act
    const offenders = files
      .filter((f) => !EXEMPT.has(path.basename(f)))
      .filter((f) => /\.(md|ts|json|py|sh|ya?ml)$/.test(f))
      .filter((f) => /npx arcane(?!-|\w)/.test(fs.readFileSync(path.join(repoRoot, f), "utf-8")));

    // Assert
    expect(offenders, `these still say "npx arcane": ${offenders.join(", ")}`).toEqual([]);
  });

  it("the package name the docs use is the one package.json publishes", () => {
    // Arrange
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf-8"));
    const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf-8");

    // Act
    const documented = readme.match(/npx ([a-z0-9@/-]+) install/);

    // Assert
    expect(documented, "README no longer shows an npx install line").toBeTruthy();
    expect(documented![1]).toBe(pkg.name);
  });

  it("bare `arcane` stays the bin name, so the global form keeps working", () => {
    // Arrange
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf-8"));

    // Assert: if this ever changes, every `arcane <cmd>` in the docs is wrong
    // too, which is a much larger edit than the npx form.
    expect(Object.keys(pkg.bin)).toEqual(["arcane"]);
  });
});
