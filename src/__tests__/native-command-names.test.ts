import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A project skill with the same name as a Claude Code command replaces it:
 * Arcane's `code-review` and `help` hid the native `/code-review` (and its
 * `ultra` cloud review) and `/help` in every install. Claude Code's skills docs:
 * "A project `code-review` skill replaces `/code-review`, and the bundled alias
 * `/review` never runs your skill." So no shipped skill may take a native name.
 *
 * The list is the built-in commands, bundled skills and their aliases from
 * https://code.claude.com/docs/en/commands (checked 2026-10-20). When Claude
 * Code adds a command, add it here; when a skill hits it, rename the skill.
 */

const NATIVE_COMMANDS = `
add-dir advisor agents android app artifact-capabilities artifact-diagramming artifacts
allowed-tools auto-mode-setup autocompact autofix-pr background bashes batch bg branch btw
bug cd checkpoint checkup chrome claude-api claude-in-chrome clear code-review color compact
config context continue copy cost dataviz debug deep-research design design-login design-sync
desktop diff doctor effort exit export extra-usage fast feedback fewer-permission-prompts focus
fork goal heapdump help hooks ide import init insights install-github-app install-slack-app ios
keybindings list-agents login logout loop mcp memory mobile model new output-style passes peers
permissions plan plugin plugin-authoring powerup pr-comments privacy-settings proactive quit
radio rate-limit-options rc recap release-notes reload-plugins reload-skills remote-control
remote-env rename reset resume review rewind routines run run-skill-generator sandbox schedule
scroll-speed security-review settings setup-bedrock setup-vertex share simplify skill-doctor
skills slides stats status statusline stickers stop subtask tasks team-onboarding teleport
terminal-setup theme tp tui ultraplan ultrareview undo update-config upgrade usage
usage-credits verify vim voice web-setup workflow-authoring workflows
`.trim().split(/\s+/);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const skills = fs
  .readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

describe("skill names vs Claude Code native commands", () => {
  it("no shipped skill takes the name of a native command", () => {
    const native = new Set(NATIVE_COMMANDS);
    expect(skills.filter((s) => native.has(s))).toEqual([]);
  });

  it("the native list still catches the two names that collided", () => {
    expect(NATIVE_COMMANDS).toEqual(expect.arrayContaining(["code-review", "help"]));
  });
});
