import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { mergeProfiles } from "../profiles.js";
import {
  FILE_TOOLS_MATCHER,
  SHELL_TOOLS_MATCHER,
  defaultHooks,
  healHooks,
  hookCommand,
  type HookMap,
} from "../hook-commands.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");
const PROJECT = path.join(os.tmpdir(), "some-project");

function commands(hooks: HookMap): string[] {
  return Object.values(hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
}

function legacyHooks(): HookMap {
  return {
    SessionStart: [
      { matcher: "", hooks: [{ type: "command", command: "bash .claude/hooks/session-start.sh" }] },
    ],
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [
          { type: "command", command: "bash .claude/hooks/validate-commit.sh", timeout: 15 },
          { type: "command", command: "bash .claude/hooks/validate-push.sh", timeout: 10 },
          { type: "command", command: "bash .claude/hooks/validate-secrets.sh", timeout: 10 },
        ],
      },
    ],
  };
}

describe("hookCommand", () => {
  it("anchors a project hook on $CLAUDE_PROJECT_DIR, quoted for paths with spaces", () => {
    expect(hookCommand(PROJECT, "guard.sh")).toBe('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/guard.sh"');
  });

  it("uses the absolute path in the global install, where the variable names another project", () => {
    const command = hookCommand(os.homedir(), "guard.sh");
    expect(command).not.toContain("$CLAUDE_PROJECT_DIR");
    expect(command).toMatch(/^bash "[^"\\]+\/\.claude\/hooks\/guard\.sh"$/);
  });
});

describe("defaultHooks", () => {
  it("runs the guard before the other shell hooks and on file edits", () => {
    const hooks = defaultHooks(PROJECT);
    const bash = hooks.PreToolUse.find((g) => g.matcher === SHELL_TOOLS_MATCHER)!;
    const files = hooks.PreToolUse.find((g) => g.matcher === FILE_TOOLS_MATCHER)!;
    expect(bash.hooks[0].command).toContain("guard.sh");
    expect(files.hooks[0].command).toContain("guard.sh");
  });

  it("names only scripts that ship in hooks/", () => {
    for (const command of commands(defaultHooks(PROJECT))) {
      const [, script, args] = command.match(/hooks\/([\w.-]+)"(.*)$/)!;
      expect(fs.existsSync(path.join(REPO_ROOT, "hooks", script)), script).toBe(true);
      const pyScript = args.trim().split(" ")[0];
      if (pyScript) expect(fs.existsSync(path.join(REPO_ROOT, "hooks", pyScript)), pyScript).toBe(true);
    }
  });
});

describe("healHooks", () => {
  it("moves legacy relative commands to the anchored form", () => {
    const hooks = legacyHooks();
    healHooks(hooks, PROJECT);
    expect(commands(hooks)).toContain('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh"');
    expect(commands(hooks).some((c) => c.startsWith("bash .claude/hooks/"))).toBe(false);
  });

  it("adds the guard ahead of the existing Bash hooks and for file edits", () => {
    const hooks = legacyHooks();
    const changes = healHooks(hooks, PROJECT);
    const bash = hooks.PreToolUse.find((g) => g.matcher === SHELL_TOOLS_MATCHER)!;
    expect(bash.hooks.map((h) => h.command)[0]).toContain("guard.sh");
    expect(hooks.PreToolUse.some((g) => g.matcher === FILE_TOOLS_MATCHER)).toBe(true);
    expect(changes).toEqual(expect.arrayContaining(["guard for Bash", "guard for file edits"]));
  });

  // Before 2.19 the guard listened only to Bash, so a command Claude ran through the
  // PowerShell tool on Windows (a force push, a commit) skipped every check.
  it("widens an installed Bash guard to PowerShell, once", () => {
    const guard = { type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/guard.sh"' };
    const commit = { type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-commit.sh"' };
    const hooks: HookMap = {
      PreToolUse: [
        { matcher: "Bash", hooks: [{ type: "command", command: "bash my-own-check.sh" }] },
        { matcher: "Bash", hooks: [guard, commit] },
      ],
    };
    expect(healHooks(hooks, PROJECT)).toContain("guard for PowerShell");
    expect(hooks.PreToolUse.map((g) => g.matcher)).toEqual(["Bash", SHELL_TOOLS_MATCHER, FILE_TOOLS_MATCHER]);
    expect(hooks.PreToolUse[1].hooks).toEqual([guard, commit]);
    expect(healHooks(hooks, PROJECT)).not.toContain("guard for PowerShell");
  });

  it("adds the session watch after tools and on stop, once", () => {
    const hooks = legacyHooks();
    const changes = healHooks(hooks, PROJECT);
    expect(changes).toEqual(expect.arrayContaining(["session watch", "format and type check on stop"]));
    expect(commands(hooks)).toContain('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/run-py.sh" session_watch.py stop');
    expect(healHooks(hooks, PROJECT)).toEqual([]);
  });

  it("adds the worktree exit check to Stop", () => {
    const hooks = legacyHooks();
    expect(healHooks(hooks, PROJECT)).toContain("worktree exit on stop");
    expect(commands(hooks).some((c) => c.includes("worktree-stop.sh"))).toBe(true);
  });

  it("drops the scripts the guard replaced, in any path form, and the groups they empty", () => {
    const hooks: HookMap = {
      PreToolUse: [
        { matcher: "Bash", hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-push.sh"' }] },
        { matcher: "Bash", hooks: [{ type: "command", command: "bash .claude/hooks/validate-secrets.sh" }] },
      ],
    };
    const changes = healHooks(hooks, PROJECT);
    expect(commands(hooks).some((c) => /validate-(push|secrets)/.test(c))).toBe(false);
    expect(changes).toEqual(expect.arrayContaining(["retired hook: validate-push.sh", "retired hook: validate-secrets.sh"]));
    expect(hooks.PreToolUse.every((g) => g.hooks.length > 0)).toBe(true);
  });

  it("leaves hooks the user wrote alone", () => {
    const hooks = legacyHooks();
    hooks.PreToolUse[0].hooks.push({ type: "command", command: "bash scripts/my-check.sh" });
    healHooks(hooks, PROJECT);
    expect(commands(hooks)).toContain("bash scripts/my-check.sh");
  });

  it("changes nothing on a second run", () => {
    const hooks = legacyHooks();
    healHooks(hooks, PROJECT);
    const before = JSON.stringify(hooks);
    expect(healHooks(hooks, PROJECT)).toEqual([]);
    expect(JSON.stringify(hooks)).toBe(before);
  });
});

describe("an install and its update", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    logSpy?.mockRestore();
    vi.restoreAllMocks();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  function settingsOf(target: string): Record<string, any> {
    return JSON.parse(fs.readFileSync(path.join(target, ".claude", "settings.json"), "utf-8"));
  }

  it("ships guard.py next to guard.sh", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-hooks-test-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    new Installer(mergeProfiles(PROFILES_DIR, ["testing"]), { target: tmpDir, dryRun: false, force: false }).run(
      "testing",
    );
    for (const file of ["guard.sh", "guard.py"]) {
      expect(fs.existsSync(path.join(tmpDir, ".claude", "hooks", file)), file).toBe(true);
    }
    expect(JSON.stringify(settingsOf(tmpDir).hooks)).toContain("$CLAUDE_PROJECT_DIR");
  });

  it("heals the hooks of an install written with relative paths", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-hooks-test-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    new Installer(mergeProfiles(PROFILES_DIR, ["testing"]), { target: tmpDir, dryRun: false, force: false }).run(
      "testing",
    );
    const settingsPath = path.join(tmpDir, ".claude", "settings.json");
    const settings = settingsOf(tmpDir);
    settings.hooks = legacyHooks();
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");

    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    const healed = JSON.stringify(settingsOf(tmpDir).hooks);
    expect(healed).not.toContain("bash .claude/hooks/");
    expect(healed).toContain("guard.sh");
  });
});
