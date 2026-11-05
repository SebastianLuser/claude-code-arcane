import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Specs for hooks/arcane-hook.mjs: one process per event, doing only what the install's hook list asks for. */

const HOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks");
const dispatcher = (await import(pathToFileURL(path.join(HOOKS, "arcane-hook.mjs")).href)) as {
  enabledHooks(hooksDir: string, project: string | null): Set<string>;
  commitProblem(command: string, cwd: string): Promise<string | null>;
  skillWarning(payload: object): string | null;
  worktreeExit(payload: object, project: string | undefined, cwd: string): { decision: string; reason: string } | null;
};

let project: string;
beforeEach(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), "arcane dispatch "));
  fs.mkdirSync(path.join(project, ".claude", "hooks"), { recursive: true });
  for (const file of ["arcane-hook.mjs", "guard.mjs", "session-watch.mjs"]) {
    fs.copyFileSync(path.join(HOOKS, file), path.join(project, ".claude", "hooks", file));
  }
});
afterEach(() => fs.rmSync(project, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));

function list(...ids: string[]) {
  fs.writeFileSync(path.join(project, ".claude", "arcane-hooks.json"), JSON.stringify({ hooks: ids }));
}

function hook(mode: string, payload: object, env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [path.join(project, ".claude", "hooks", "arcane-hook.mjs"), mode], {
    input: JSON.stringify({ cwd: project, ...payload }),
    cwd: project,
    encoding: "utf-8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, ...env },
  });
  return { code: result.status, out: result.stdout.trim(), err: result.stderr.trim() };
}

const bash = (command: string) => ({ tool_name: "Bash", tool_input: { command } });

describe("pre-tool", () => {
  it("the guard runs whatever the list says, even without one", () => {
    const { out } = hook("pre-tool", bash("git push --force origin main"));
    expect(JSON.parse(out).hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("the commit checks run only when the list has validate-commit.sh", () => {
    const empty = bash('git commit -m ""');
    expect(hook("pre-tool", empty).out).toBe("");
    list("guard.sh", "validate-commit.sh");
    const decision = JSON.parse(hook("pre-tool", empty).out).hookSpecificOutput;
    expect(decision.permissionDecision).toBe("deny");
    expect(decision.permissionDecisionReason).toContain("empty commit message");
  });

  // Before one handler per event the commit check was its own hook, and its block
  // beat the guard's ask: approving the ask must not skip it.
  it("the commit checks still deny when the guard only asks", () => {
    list("guard.sh", "validate-commit.sh");
    const decision = JSON.parse(hook("pre-tool", bash('git commit -m "" && git stash drop')).out).hookSpecificOutput;
    expect(decision.permissionDecision).toBe("deny");
    expect(decision.permissionDecisionReason).toContain("empty commit message");
  });

  it("a commit check that breaks keeps the guard's answer", () => {
    list("guard.sh", "validate-commit.sh");
    // A cwd that is not a string makes the 3D gate throw before it can answer.
    const { out } = hook("pre-tool", { ...bash('git commit -m "x" && git stash drop'), cwd: 123 });
    expect(JSON.parse(out).hookSpecificOutput.permissionDecision).toBe("ask");
  });

  it("logs an edit the guard lets through before the tool runs, and not one it denies", () => {
    list("guard.sh", "session-watch.sh stop");
    const log = () => {
      try {
        return fs.readFileSync(path.join(project, ".claude", "session-state", "watch-s1.log"), "utf-8");
      } catch {
        return "";
      }
    };
    hook("pre-tool", { session_id: "s1", tool_name: "Write", tool_input: { file_path: path.join(project, ".env") } });
    expect(log()).toBe("");
    hook("pre-tool", { session_id: "s1", tool_name: "Edit", tool_input: { file_path: path.join(project, "a.ts") } });
    expect(log()).toContain('"t":"edit"');
  });

  it("an ordinary command passes in silence", () => {
    list("guard.sh", "validate-commit.sh");
    expect(hook("pre-tool", bash("ls -la"))).toEqual({ code: 0, out: "", err: "" });
  });

  it("a commit with a message passes, and no 3D gate runs without its validator", async () => {
    expect(await dispatcher.commitProblem('git commit -m "feat: x"', project)).toBeNull();
  });
});

describe("post-tool", () => {
  it("returns the session watch warnings as context", () => {
    list("session-watch.sh post-tool");
    const outs = Array.from({ length: 5 }, () => hook("post-tool", { session_id: "s1", ...bash("npm test") }).out);
    expect(outs.slice(0, 4)).toEqual(["", "", "", ""]);
    expect(JSON.parse(outs[4]).hookSpecificOutput.additionalContext).toContain("5 times in a row");
  });

  it("warns about a SKILL.md without frontmatter when the list has validate-skill-change.sh", () => {
    const file = path.join(project, "skills", "demo", "SKILL.md");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "# no frontmatter\n");
    const payload = { tool_name: "Write", tool_input: { file_path: file } };
    expect(dispatcher.skillWarning(payload)).toContain("frontmatter");
    expect(hook("post-tool", payload).out).toBe("");
    list("validate-skill-change.sh");
    expect(JSON.parse(hook("post-tool", payload).out).hookSpecificOutput.additionalContext).toContain("frontmatter");
  });

  it("a SKILL.md with frontmatter is fine", () => {
    const file = path.join(project, "skills", "demo", "SKILL.md");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "---\nname: demo\n---\n");
    expect(dispatcher.skillWarning({ tool_name: "Edit", tool_input: { file_path: file } })).toBeNull();
  });
});

describe("stop", () => {
  it("logs the stop when the project keeps a session log", () => {
    list("session-stop.sh");
    fs.mkdirSync(path.join(project, ".claude", "session-state"), { recursive: true });
    expect(hook("stop", { session_id: "s1" }).code).toBe(0);
    expect(fs.readFileSync(path.join(project, ".claude", "session-state", "sessions.log"), "utf-8")).toMatch(/Session stopped/);
  });

  it("the type check does nothing when the list does not ask for it", () => {
    list("session-stop.sh");
    expect(hook("stop-check", { session_id: "s1" })).toEqual({ code: 0, out: "", err: "" });
  });

  it("the type check gives up when no formatting of its turn arrives", () => {
    list("session-watch.sh stop");
    expect(hook("stop-check", { session_id: "s1" }, { ARCANE_FORMAT_WAIT_MS: "300" }).code).toBe(0);
  });
});

describe("worktree exit", () => {
  const git = (cwd: string, ...args: string[]) =>
    spawnSync("git", ["-c", "user.email=t@example.com", "-c", "user.name=t", ...args], { cwd, encoding: "utf-8" });

  it("starts no git outside .claude/worktrees", () => {
    expect(dispatcher.worktreeExit({}, project, project)).toBeNull();
    expect(dispatcher.worktreeExit({}, undefined, project)).toBeNull();
  });

  it("blocks once per commit when the turn ends in a clean worktree", () => {
    git(project, "init", "-q");
    git(project, "commit", "-q", "--allow-empty", "-m", "init");
    const tree = path.join(project, ".claude", "worktrees", "task");
    git(project, "worktree", "add", "-q", "-b", "task", tree);

    const first = dispatcher.worktreeExit({}, project, tree);
    expect(first?.decision).toBe("block");
    expect(first?.reason).toContain("branch task");
    expect(dispatcher.worktreeExit({}, project, tree)).toBeNull();
    expect(dispatcher.worktreeExit({ stop_hook_active: true }, project, tree)).toBeNull();

    fs.writeFileSync(path.join(tree, "wip.txt"), "x");
    git(tree, "commit", "-q", "--allow-empty", "-m", "more");
    fs.rmSync(path.join(tree, "wip.txt"));
    git(tree, "commit", "-q", "--allow-empty", "-m", "next");
    expect(dispatcher.worktreeExit({}, project, tree)?.decision).toBe("block");
  });

  it("finds the worktrees of a session that started in a subdirectory", () => {
    git(project, "init", "-q");
    git(project, "commit", "-q", "--allow-empty", "-m", "init");
    fs.mkdirSync(path.join(project, "sub"));
    const tree = path.join(project, ".claude", "worktrees", "from-sub");
    git(project, "worktree", "add", "-q", "-b", "from-sub", tree);
    expect(dispatcher.worktreeExit({}, path.join(project, "sub"), tree)?.decision).toBe("block");
  });

  it("never blocks a session that started inside the worktree, which ExitWorktree cannot leave", () => {
    git(project, "init", "-q");
    git(project, "commit", "-q", "--allow-empty", "-m", "init");
    const tree = path.join(project, ".claude", "worktrees", "own");
    git(project, "worktree", "add", "-q", "-b", "own", tree);
    expect(dispatcher.worktreeExit({}, tree, tree)).toBeNull();
  });

  it("never blocks while the worktree has uncommitted changes", () => {
    git(project, "init", "-q");
    git(project, "commit", "-q", "--allow-empty", "-m", "init");
    const tree = path.join(project, ".claude", "worktrees", "wip");
    git(project, "worktree", "add", "-q", "-b", "wip", tree);
    fs.writeFileSync(path.join(tree, "draft.txt"), "x");
    expect(dispatcher.worktreeExit({}, project, tree)).toBeNull();
  });
});

describe("session start", () => {
  function start(cwd: string, ...ids: string[]) {
    for (const file of ["session-start.sh", "detect-unreal.sh", "detect-gaps.sh"]) {
      fs.copyFileSync(path.join(HOOKS, file), path.join(project, ".claude", "hooks", file));
    }
    list("session-start.sh", ...ids);
    spawnSync("git", ["init", "-q"], { cwd: project });
    return spawnSync("bash", [path.join(project, ".claude", "hooks", "session-start.sh")], {
      cwd,
      encoding: "utf-8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
    }).stdout;
  }

  it("sources only the detectors the list names", () => {
    expect(start(project)).not.toContain("Documentation Gaps");
    expect(start(project, "detect-gaps.sh")).toContain("Documentation Gaps");
  });

  // As their own hooks, check-update.sh and detect-unreal.sh ran from the session's directory.
  it("runs the update check from the session's directory", () => {
    const sub = path.join(project, "sub");
    fs.mkdirSync(sub);
    fs.copyFileSync(path.join(HOOKS, "check-update.sh"), path.join(project, ".claude", "hooks", "check-update.sh"));
    fs.writeFileSync(path.join(project, ".claude", "hooks", "check-update.mjs"), "console.log('update check in ' + process.cwd());\n");
    const out = start(sub, "check-update.sh");
    expect(out).toMatch(/update check in .*[\\/]sub\s*$/m);
  });

  it("the update check still finds its script when run by bare name", () => {
    const hooks = path.join(project, ".claude", "hooks");
    fs.copyFileSync(path.join(HOOKS, "check-update.sh"), path.join(hooks, "check-update.sh"));
    fs.writeFileSync(path.join(hooks, "check-update.mjs"), "console.log('found');\n");
    expect(spawnSync("bash", ["check-update.sh"], { cwd: hooks, encoding: "utf-8" }).stdout).toContain("found");
  });

  it("finds an Unreal project in the subdirectory the session started in", () => {
    const game = path.join(project, "Game");
    fs.mkdirSync(game);
    fs.writeFileSync(path.join(game, "My.uproject"), "{}");
    expect(start(game, "detect-unreal.sh")).toContain("Unreal Engine project");
  });
});

describe("the hook list", () => {
  const hooksDir = () => path.join(project, ".claude", "hooks");

  it("is read from beside the hooks folder", () => {
    list("guard.sh", "session-stop.sh");
    expect([...dispatcher.enabledHooks(hooksDir(), null)].sort()).toEqual(["guard.sh", "session-stop.sh"]);
  });

  it("the project's list wins over the one of the install that runs", () => {
    list("guard.sh");
    const other = fs.mkdtempSync(path.join(os.tmpdir(), "arcane other "));
    try {
      fs.mkdirSync(path.join(other, ".claude"));
      fs.writeFileSync(path.join(other, ".claude", "arcane-hooks.json"), JSON.stringify({ hooks: ["guard.sh", "validate-commit.sh"] }));
      expect([...dispatcher.enabledHooks(hooksDir(), other)].sort()).toEqual(["guard.sh", "validate-commit.sh"]);
      expect([...dispatcher.enabledHooks(hooksDir(), path.join(other, "missing"))]).toEqual(["guard.sh"]);
    } finally {
      fs.rmSync(other, { recursive: true, force: true });
    }
  });

  it("without it only the guard is on", () => {
    expect([...dispatcher.enabledHooks(hooksDir(), null)]).toEqual(["guard.sh"]);
  });
});
