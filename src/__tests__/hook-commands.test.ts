import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { listProfiles, mergeProfiles, parseProfile } from "../profiles.js";
import {
  FILE_TOOLS_MATCHER,
  HOOK_IDS,
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
      const [, script] = command.match(/hooks\/([\w.-]+)"/)!;
      expect(fs.existsSync(path.join(REPO_ROOT, "hooks", script)), script).toBe(true);
      // A wrapper that only starts Node needs the script it starts.
      const node = script.replace(/\.sh$/, ".mjs");
      if (fs.readFileSync(path.join(REPO_ROOT, "hooks", script), "utf-8").includes(node)) {
        expect(fs.existsSync(path.join(REPO_ROOT, "hooks", node)), node).toBe(true);
      }
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
    expect(commands(hooks)).toContain('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-watch.sh" stop');
    expect(healHooks(hooks, PROJECT)).toEqual([]);
  });

  it("moves the Python session watch to the Node one instead of adding a second", () => {
    // Installs before the Node hooks ran it through run-py.sh, which did nothing without Python.
    const hooks = legacyHooks();
    const python = (mode: string) => ({
      type: "command",
      command: `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/run-py.sh" session_watch.py ${mode}`,
      timeout: 10,
    });
    hooks.PostToolUse = [{ matcher: "", hooks: [python("post-tool")] }];
    hooks.Stop = [{ matcher: "", hooks: [python("stop")] }];

    const changes = healHooks(hooks, PROJECT);

    expect(changes).toEqual(expect.arrayContaining(["session watch on Node: post-tool", "session watch on Node: stop"]));
    expect(changes).not.toContain("session watch");
    expect(commands(hooks).filter((c) => c.includes("session-watch.sh"))).toEqual([
      'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-watch.sh" post-tool',
      'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/session-watch.sh" stop',
    ]);
    expect(commands(hooks).some((c) => c.includes("run-py"))).toBe(false);
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
      PostToolUse: [
        { matcher: "Write|Edit", hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-assets.sh"' }] },
      ],
    };
    const changes = healHooks(hooks, PROJECT);
    expect(commands(hooks).some((c) => /validate-(push|secrets|assets)/.test(c))).toBe(false);
    expect(changes).toEqual(expect.arrayContaining(["retired hook: validate-push.sh", "retired hook: validate-secrets.sh", "retired hook: validate-assets.sh"]));
    expect(hooks.PreToolUse.every((g) => g.hooks.length > 0)).toBe(true);
  });

  it("drops the scripts that only wrote logs, and the events they leave empty", () => {
    const wired = (script: string) => [{ matcher: "", hooks: [{ type: "command", command: `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/${script}"` }] }];
    const hooks: HookMap = {
      SessionStart: [{ matcher: "", hooks: [wired("session-start.sh")[0].hooks[0], wired("detect-division.sh")[0].hooks[0]] }],
      Notification: wired("notify.sh"),
      SubagentStart: wired("log-agent.sh"),
      SubagentStop: wired("log-agent-stop.sh"),
    };
    const changes = healHooks(hooks, PROJECT);
    expect(changes).toEqual(expect.arrayContaining(["detect-division.sh", "notify.sh", "log-agent.sh", "log-agent-stop.sh"].map((s) => `retired hook: ${s}`)));
    expect(Object.keys(hooks)).not.toContain("Notification");
    expect(Object.keys(hooks)).not.toContain("SubagentStart");
    expect(Object.keys(hooks)).not.toContain("SubagentStop");
    expect(commands(hooks).filter((c) => c.includes("session-start.sh"))).toHaveLength(1);
  });

  it("a fresh install wires no retired script", () => {
    const wired = commands(defaultHooks(PROJECT)).join("\n");
    for (const script of ["detect-division.sh", "notify.sh", "log-agent.sh", "log-agent-stop.sh"]) {
      expect(wired).not.toContain(script);
    }
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

  it("ships the Node scripts next to their wrappers", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-hooks-test-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    new Installer(mergeProfiles(PROFILES_DIR, ["testing"]), { target: tmpDir, dryRun: false, force: false }).run(
      "testing",
    );
    for (const file of ["guard.sh", "guard.mjs", "session-watch.sh", "session-watch.mjs"]) {
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

describe("hooks come from the profiles", () => {
  const profiles = listProfiles(PROFILES_DIR).concat(parseProfile(path.join(PROFILES_DIR, "core.yaml")));
  const idsOf = (...names: string[]) => mergeProfiles(PROFILES_DIR, names).hooks;

  it("every hook a profile lists is wired, and every wired hook has a profile", () => {
    const listed = new Set(profiles.flatMap((p) => p.hooks));
    expect([...listed].filter((id) => !HOOK_IDS.includes(id))).toEqual([]);
    expect(HOOK_IDS.filter((id) => !listed.has(id))).toEqual([]);
  });

  it("a project without code gets no coding hook", () => {
    const wired = commands(defaultHooks(PROJECT, idsOf("agile"))).join("\n");
    expect(wired).toContain("guard.sh");
    expect(wired).toContain("session-watch.sh\" post-tool");
    for (const coding of ["validate-commit.sh", "detect-gaps.sh", "worktree-stop.sh", "session-watch.sh\" stop", "detect-unreal.sh"]) {
      expect(wired).not.toContain(coding);
    }
  });

  it("a code profile brings the coding hooks through code-flow", () => {
    const wired = commands(defaultHooks(PROJECT, idsOf("backend-go"))).join("\n");
    expect(wired).toContain("validate-commit.sh");
    expect(wired).toContain("session-watch.sh\" stop");
    expect(wired).not.toContain("detect-unreal.sh");
    expect(commands(defaultHooks(PROJECT, idsOf("unreal-dev"))).join("\n")).toContain("detect-unreal.sh");
  });

  it("update unwires what no profile lists any more, keeps the guard and the user's hooks, and adds what is missing", () => {
    const hooks = defaultHooks(PROJECT);
    hooks.Stop[0].hooks.push({ type: "command", command: "bash scripts/my-stop.sh" });
    hooks.PreToolUse[0].hooks.push({ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/my-check.sh"' });

    const changes = healHooks(hooks, PROJECT, idsOf("agile"));
    const wired = commands(hooks).join("\n");
    expect(changes).toEqual(expect.arrayContaining(["unwired hook: validate-commit.sh", "unwired hook: session-watch.sh stop"]));
    expect(wired).not.toContain("validate-commit.sh");
    expect(wired).toContain("guard.sh");
    expect(wired).toContain("bash scripts/my-stop.sh");
    expect(wired).toContain("my-check.sh");
    expect(healHooks(hooks, PROJECT, idsOf("agile"))).toEqual([]);

    healHooks(hooks, PROJECT, idsOf("backend-go"));
    const shell = hooks.PreToolUse.find((g) => g.matcher === SHELL_TOOLS_MATCHER)!;
    expect(shell.hooks.map((h) => h.command).some((c) => c.includes("validate-commit.sh"))).toBe(true);
  });

  it("reads a bare session-watch.sh, as content before 3.1 lists it, as both entries", () => {
    const wired = commands(defaultHooks(PROJECT, ["session-watch.sh"])).join("\n");
    expect(wired).toContain("session-watch.sh\" post-tool");
    expect(wired).toContain("session-watch.sh\" stop");
  });
});
