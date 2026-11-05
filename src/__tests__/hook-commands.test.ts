import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { listProfiles, mergeProfiles, parseProfile } from "../profiles.js";
import {
  GUARDED_TOOLS_MATCHER,
  HOOK_IDS,
  HOOK_LIST_FILE,
  defaultHooks,
  healHooks,
  hookCommand,
  hookList,
  writeHookList,
  type HookMap,
} from "../hook-commands.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");
const PROJECT = path.join(os.tmpdir(), "some-project");

function commands(hooks: HookMap): string[] {
  return Object.values(hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
}

function entries(hooks: HookMap, event: string) {
  return (hooks[event] ?? []).flatMap((g) => g.hooks);
}

/** One script per hook, as 3.3 wired them in a project. */
function scriptHooks(prefix = "$CLAUDE_PROJECT_DIR/.claude/hooks"): HookMap {
  const run = (script: string, args = "") => ({ type: "command", command: `bash "${prefix}/${script}"${args ? ` ${args}` : ""}`, timeout: 10 });
  return {
    SessionStart: [{ matcher: "", hooks: [run("session-start.sh"), run("detect-gaps.sh"), run("check-update.sh")] }],
    PreToolUse: [
      { matcher: "Bash|PowerShell", hooks: [run("guard.sh"), run("validate-commit.sh")] },
      { matcher: "Write|Edit|MultiEdit|NotebookEdit", hooks: [run("guard.sh")] },
    ],
    PostToolUse: [
      { matcher: "Write|Edit", hooks: [run("validate-skill-change.sh")] },
      { matcher: "", hooks: [run("session-watch.sh", "post-tool")] },
    ],
    Stop: [{ matcher: "", hooks: [run("session-stop.sh"), run("worktree-stop.sh"), run("session-watch.sh", "stop")] }],
  };
}

function legacyHooks(): HookMap {
  return {
    SessionStart: [{ matcher: "", hooks: [{ type: "command", command: "bash .claude/hooks/session-start.sh" }] }],
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [
          { type: "command", command: "bash .claude/hooks/validate-commit.sh", timeout: 15 },
          { type: "command", command: "bash .claude/hooks/validate-push.sh", timeout: 10 },
        ],
      },
    ],
  };
}

describe("hookCommand", () => {
  it("is the same text in every install, so Claude Code runs it once when two settings files list it", () => {
    expect(hookCommand("arcane-hook.mjs", "pre-tool")).toBe(
      'h=.claude/hooks/arcane-hook.mjs; [ -f "$HOME/$h" ] && h="$HOME/$h" || h="$CLAUDE_PROJECT_DIR/$h"; node "$h" pre-tool',
    );
    expect(JSON.stringify(defaultHooks(PROJECT))).toBe(JSON.stringify(defaultHooks(os.homedir())));
  });

  it("runs a shell script with bash", () => {
    expect(hookCommand("session-start.sh")).toMatch(/; bash "\$h"$/);
  });

  // A cloned repository that ships .claude/hooks/ must never get its code run by the
  // user's global settings, nor replace the guard there.
  it("runs the global copy whenever there is one, the project's only without it", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-resolve-"));
    try {
      const project = path.join(root, "project");
      const home = path.join(root, "home");
      for (const dir of [project, home]) fs.mkdirSync(path.join(dir, ".claude", "hooks"), { recursive: true });
      fs.writeFileSync(path.join(project, ".claude", "hooks", "probe.sh"), "");
      const command = hookCommand("probe.sh").replace(/bash "\$h"$/, 'echo "$h"');
      const resolve = () =>
        spawnSync("bash", ["-c", command], { env: { ...process.env, CLAUDE_PROJECT_DIR: project, HOME: home }, encoding: "utf-8" })
          .stdout.trim();

      // Git Bash rewrites HOME as /c/...; compare the tail, which says which copy ran.
      expect(resolve()).toMatch(/project\/\.claude\/hooks\/probe\.sh$/);
      fs.writeFileSync(path.join(home, ".claude", "hooks", "probe.sh"), "");
      expect(resolve()).toMatch(/home\/\.claude\/hooks\/probe\.sh$/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("defaultHooks", () => {
  it("wires one handler per event, the guard on every tool it reviews", () => {
    const hooks = defaultHooks(PROJECT);
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PreToolUse[0].matcher).toBe(GUARDED_TOOLS_MATCHER);
    expect(entries(hooks, "PreToolUse").map((h) => h.command)).toEqual([hookCommand("arcane-hook.mjs", "pre-tool")]);
    for (const event of ["SessionStart", "PostToolUse", "PreCompact", "PostCompact"]) {
      expect(entries(hooks, event), event).toHaveLength(1);
    }
  });

  it("the turn waits for neither the session watch nor the type check", () => {
    const hooks = defaultHooks(PROJECT);
    expect(entries(hooks, "PostToolUse")[0].async).toBe(true);
    const stop = entries(hooks, "Stop");
    expect(stop.find((h) => h.command.endsWith(" stop"))?.async).toBeUndefined();
    expect(stop.find((h) => h.command.endsWith(" stop-check"))?.asyncRewake).toBe(true);
    expect(entries(hooks, "PreToolUse")[0].async).toBeUndefined();
  });

  it("names only files that ship in hooks/", () => {
    for (const command of commands(defaultHooks(PROJECT))) {
      const [, file] = command.match(/^h=\.claude\/hooks\/([\w.-]+);/)!;
      expect(fs.existsSync(path.join(REPO_ROOT, "hooks", file)), file).toBe(true);
    }
  });

  it("a fresh install wires no retired script", () => {
    const wired = commands(defaultHooks(PROJECT)).join("\n");
    for (const script of ["detect-division.sh", "notify.sh", "log-agent.sh", "log-agent-stop.sh", "guard.sh", "validate-commit.sh"]) {
      expect(wired).not.toContain(script);
    }
  });
});

describe("healHooks", () => {
  it("replaces the one-script-per-hook wiring with one handler per event", () => {
    const hooks = scriptHooks();
    const changes = healHooks(hooks, PROJECT);
    expect(changes).toEqual(expect.arrayContaining(["replaced hook: guard.sh", "replaced hook: session-watch.sh", "hook: arcane-hook.mjs pre-tool"]));
    expect(commands(hooks).sort()).toEqual(commands(defaultHooks(PROJECT)).sort());
  });

  it("replaces the absolute paths the global install wrote", () => {
    const hooks = scriptHooks("C:/Users/someone/.claude/hooks");
    healHooks(hooks, os.homedir());
    expect(commands(hooks).some((c) => c.includes("C:/Users/someone"))).toBe(false);
    expect(commands(hooks)).toContain(hookCommand("arcane-hook.mjs", "pre-tool"));
  });

  it("replaces legacy relative commands and drops retired scripts", () => {
    const hooks = legacyHooks();
    const changes = healHooks(hooks, PROJECT);
    expect(changes).toEqual(expect.arrayContaining(["replaced hook: validate-commit.sh", "replaced hook: validate-push.sh"]));
    expect(commands(hooks).some((c) => c.startsWith("bash .claude/hooks/"))).toBe(false);
  });

  it("drops the scripts that only wrote logs, and the events they leave empty", () => {
    const wired = (script: string) => [{ matcher: "", hooks: [{ type: "command", command: `bash "$CLAUDE_PROJECT_DIR/.claude/hooks/${script}"` }] }];
    const hooks: HookMap = { Notification: wired("notify.sh"), SubagentStart: wired("log-agent.sh"), SubagentStop: wired("log-agent-stop.sh") };
    healHooks(hooks, PROJECT);
    for (const event of ["Notification", "SubagentStart", "SubagentStop"]) expect(Object.keys(hooks)).not.toContain(event);
  });

  it("replaces the Python session watch instead of keeping it next to the handler", () => {
    const hooks: HookMap = {
      PostToolUse: [{ matcher: "", hooks: [{ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/run-py.sh" session_watch.py post-tool' }] }],
    };
    healHooks(hooks, PROJECT);
    expect(commands(hooks).some((c) => c.includes("run-py"))).toBe(false);
    expect(entries(hooks, "PostToolUse")).toHaveLength(1);
  });

  it("leaves hooks the user wrote alone, their own .claude/hooks scripts too", () => {
    const hooks = scriptHooks();
    hooks.PreToolUse[0].hooks.push({ type: "command", command: "bash scripts/my-check.sh" });
    hooks.Stop[0].hooks.push({ type: "command", command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/my-stop.sh"' });
    healHooks(hooks, PROJECT);
    const wired = commands(hooks);
    expect(wired).toContain("bash scripts/my-check.sh");
    expect(wired).toContain('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/my-stop.sh"');
    expect(hooks.PreToolUse.find((g) => g.matcher === "Bash|PowerShell")?.hooks).toHaveLength(1);
  });

  it("brings a handler's timeout and background flags in line", () => {
    const hooks = defaultHooks(PROJECT);
    const post = entries(hooks, "PostToolUse")[0];
    delete post.async;
    post.timeout = 5;
    expect(healHooks(hooks, PROJECT)).toEqual(["hook settings: arcane-hook.mjs post-tool"]);
    expect(post).toMatchObject({ async: true, timeout: 30 });
  });

  it("moves a handler left in another matcher group instead of wiring it twice", () => {
    const hooks: HookMap = { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: hookCommand("arcane-hook.mjs", "pre-tool") }] }] };
    healHooks(hooks, PROJECT);
    expect(entries(hooks, "PreToolUse").map((h) => h.command)).toEqual([hookCommand("arcane-hook.mjs", "pre-tool")]);
    expect(hooks.PreToolUse[0].matcher).toBe(GUARDED_TOOLS_MATCHER);
  });

  it("changes nothing on a second run", () => {
    const hooks = scriptHooks();
    healHooks(hooks, PROJECT);
    const before = JSON.stringify(hooks);
    expect(healHooks(hooks, PROJECT)).toEqual([]);
    expect(JSON.stringify(hooks)).toBe(before);
  });
});

describe("the hook list", () => {
  it("lists the known ids the profiles want, sorted, a bare session-watch.sh as both", () => {
    expect(JSON.parse(hookList(["guard.sh", "session-watch.sh", "not-a-hook.sh"])).hooks).toEqual([
      "guard.sh",
      "session-watch.sh post-tool",
      "session-watch.sh stop",
    ]);
  });

  it("is rewritten only when it changes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-list-"));
    try {
      expect(writeHookList(dir, ["guard.sh"])).toBe(true);
      expect(writeHookList(dir, ["guard.sh"])).toBe(false);
      expect(writeHookList(dir, ["guard.sh", "session-stop.sh"])).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
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

  function install(): void {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-hooks-test-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    new Installer(mergeProfiles(PROFILES_DIR, ["testing"]), { target: tmpDir, dryRun: false, force: false }).run("testing");
  }

  it("ships the dispatcher with the modules it imports, and writes the hook list", () => {
    install();
    for (const file of ["arcane-hook.mjs", "guard.mjs", "session-watch.mjs", "session-start.sh"]) {
      expect(fs.existsSync(path.join(tmpDir, ".claude", "hooks", file)), file).toBe(true);
    }
    expect(JSON.stringify(settingsOf(tmpDir).hooks)).toContain("arcane-hook.mjs");
    const list = JSON.parse(fs.readFileSync(path.join(tmpDir, ".claude", HOOK_LIST_FILE), "utf-8"));
    expect(list.hooks).toContain("guard.sh");
  });

  it("an update rewires an install written one script per hook and writes the list", async () => {
    install();
    const settingsPath = path.join(tmpDir, ".claude", "settings.json");
    const settings = settingsOf(tmpDir);
    settings.hooks = { ...legacyHooks(), ...scriptHooks() };
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
    fs.rmSync(path.join(tmpDir, ".claude", HOOK_LIST_FILE));

    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    const healed = JSON.stringify(settingsOf(tmpDir).hooks);
    expect(healed).not.toContain("bash .claude/hooks/");
    expect(healed).not.toContain("guard.sh");
    expect(healed).toContain("arcane-hook.mjs");
    expect(fs.existsSync(path.join(tmpDir, ".claude", HOOK_LIST_FILE))).toBe(true);
  });
});

describe("hooks come from the profiles", () => {
  const profiles = listProfiles(PROFILES_DIR).concat(parseProfile(path.join(PROFILES_DIR, "core.yaml")));
  const idsOf = (...names: string[]) => mergeProfiles(PROFILES_DIR, names).hooks;
  const listOf = (...names: string[]) => JSON.parse(hookList(idsOf(...names))).hooks as string[];
  const typeCheck = hookCommand("arcane-hook.mjs", "stop-check");

  it("every hook a profile lists is known, and every known hook has a profile", () => {
    const listed = new Set(profiles.flatMap((p) => p.hooks));
    expect([...listed].filter((id) => !HOOK_IDS.includes(id))).toEqual([]);
    expect(HOOK_IDS.filter((id) => !listed.has(id))).toEqual([]);
  });

  it("a project without code gets the guard and no coding hook", () => {
    expect(commands(defaultHooks(PROJECT, idsOf("agile")))).toContain(hookCommand("arcane-hook.mjs", "pre-tool"));
    expect(commands(defaultHooks(PROJECT, idsOf("agile")))).not.toContain(typeCheck);
    const list = listOf("agile");
    expect(list).toContain("session-watch.sh post-tool");
    for (const coding of ["validate-commit.sh", "detect-gaps.sh", "worktree-stop.sh", "session-watch.sh stop", "detect-unreal.sh"]) {
      expect(list).not.toContain(coding);
    }
  });

  it("a code profile brings the coding hooks through code-flow", () => {
    expect(commands(defaultHooks(PROJECT, idsOf("backend-go")))).toContain(typeCheck);
    expect(listOf("backend-go")).toEqual(expect.arrayContaining(["validate-commit.sh", "session-watch.sh stop"]));
    expect(listOf("backend-go")).not.toContain("detect-unreal.sh");
    expect(listOf("unreal-dev")).toContain("detect-unreal.sh");
  });

  it("update unwires what no profile lists any more, keeps the guard and the user's hooks, and adds what is missing", () => {
    const hooks = defaultHooks(PROJECT);
    hooks.Stop[0].hooks.push({ type: "command", command: "bash scripts/my-stop.sh" });

    const changes = healHooks(hooks, PROJECT, idsOf("agile"));
    expect(changes).toEqual(["unwired hook: arcane-hook.mjs stop-check"]);
    expect(commands(hooks)).toContain(hookCommand("arcane-hook.mjs", "pre-tool"));
    expect(commands(hooks)).toContain("bash scripts/my-stop.sh");
    expect(healHooks(hooks, PROJECT, idsOf("agile"))).toEqual([]);

    healHooks(hooks, PROJECT, idsOf("backend-go"));
    expect(commands(hooks)).toContain(typeCheck);
  });

  it("the guard is wired even for a list without it", () => {
    expect(commands(defaultHooks(PROJECT, []))).toEqual([hookCommand("arcane-hook.mjs", "pre-tool")]);
  });
});
