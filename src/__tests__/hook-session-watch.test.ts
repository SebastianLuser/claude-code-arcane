import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Specs for hooks/session-watch.mjs: edit tracking, loop/scope/context warnings and the Stop check. */

type Plan = { cwd: string; format: string[] | null; check: string[] | null; files: string[] };
type Runner = (command: string[], cwd: string) => [number, string];
interface Watch {
  SCOPE_FILES: number;
  postTool(payload: object, project: string): string[];
  loadState(project: string, session: string): Record<string, any>;
  planChecks(files: string[], project: string): Plan[];
  errorsIn(output: string, files: string[], cwd: string): string[];
  stop(payload: object, project: string, runner?: Runner): { decision: string; reason: string } | null;
}

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks", "session-watch.mjs");
const watch = (await import(pathToFileURL(HOOK).href)) as Watch;

let project: string;
beforeEach(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), "arcane watch "));
});
afterEach(() => fs.rmSync(project, { recursive: true, force: true }));

const tool = (name: string, input: object, session = "s1") =>
  watch.postTool({ session_id: session, tool_name: name, tool_input: input }, project);

function edit(rel: string, session = "s1") {
  const file = path.join(project, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, "x\n");
  return tool("Edit", { file_path: file }, session);
}

function writeContext(session: string, used: number) {
  const dir = path.join(project, ".claude", "session-state");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "context.json"), JSON.stringify({ session_id: session, used_percentage: used }));
}

describe("post-tool", () => {
  it("records edited files once", () => {
    edit("src/a.ts");
    edit("src/a.ts");
    expect(watch.loadState(project, "s1").pending).toHaveLength(1);
  });

  it("warns on the fifth identical call and only once", () => {
    const warnings = Array.from({ length: 6 }, () => tool("Bash", { command: "npm test" }));
    expect(warnings.map((w) => w.length > 0)).toEqual([false, false, false, false, true, false]);
    expect(warnings[4][0]).toContain("5 times in a row");
  });

  it("a different description does not hide a loop", () => {
    const warnings = Array.from({ length: 5 }, (_, i) => tool("Bash", { command: "npm test", description: `call ${i}` }));
    expect(warnings[4].length).toBeGreaterThan(0);
  });

  it("varied calls are not a loop", () => {
    for (let i = 0; i < 8; i++) expect(tool("Bash", { command: `echo ${i % 2}` })).toEqual([]);
  });

  it("warns once when the session edits many files", () => {
    const warnings = Array.from({ length: watch.SCOPE_FILES + 2 }, (_, i) => edit(`src/f${i}.ts`));
    expect(warnings.filter((w) => w.some((x) => x.includes("files")))).toHaveLength(1);
  });

  it("the context warning uses the status line cache", () => {
    writeContext("s1", 50);
    expect(tool("Read", { file_path: "a" })).toEqual([]);
    writeContext("s1", 72);
    expect(tool("Read", { file_path: "b" })[0]).toContain("72%");
    expect(tool("Read", { file_path: "c" })).toEqual([]);
    writeContext("s1", 88);
    expect(tool("Read", { file_path: "d" })[0]).toContain("88%");
  });

  it("no context warning without a known window", () => {
    expect(tool("Read", { file_path: "a" })).toEqual([]);
  });

  it("another session's cache is ignored", () => {
    writeContext("other", 95);
    expect(tool("Read", { file_path: "a" })).toEqual([]);
  });

  it("the state folder ignores itself", () => {
    tool("Read", { file_path: "a" });
    expect(fs.readFileSync(path.join(project, ".claude", "session-state", ".gitignore"), "utf-8").trim()).toBe("*");
  });
});

describe("stop check", () => {
  function nodeProject(withTsc = true) {
    fs.writeFileSync(path.join(project, "package.json"), "{}");
    fs.writeFileSync(path.join(project, "tsconfig.json"), "{}");
    const bin = path.join(project, "node_modules", ".bin");
    fs.mkdirSync(bin, { recursive: true });
    for (const name of ["prettier", ...(withTsc ? ["tsc"] : [])]) {
      for (const suffix of ["", ".cmd"]) fs.writeFileSync(path.join(bin, name + suffix), "");
    }
  }

  it("plans prettier and tsc for a TypeScript file", () => {
    nodeProject();
    const file = path.join(project, "src", "a.ts");
    fs.mkdirSync(path.dirname(file));
    fs.writeFileSync(file, "x");
    const [plan] = watch.planChecks([file], project);
    expect(path.basename(plan.format![0])).toContain("prettier");
    expect(path.basename(plan.check![0])).toContain("tsc");
  });

  it("never plans a tool the project does not have", () => {
    fs.writeFileSync(path.join(project, "package.json"), "{}");
    const file = path.join(project, "a.ts");
    fs.writeFileSync(file, "x");
    const [plan] = watch.planChecks([file], project);
    expect(plan.format).toBeNull();
    expect(plan.check).toBeNull();
  });

  it("only errors in edited files count", () => {
    const output = "src/a.ts(3,5): error TS2322: bad\nsrc/old.ts(9,1): error TS1: older problem\n";
    const found = watch.errorsIn(output, [path.join(project, "src", "a.ts")], project);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("a.ts");
  });

  it("go vet lines are matched too", () => {
    const output = "pkg/x.go:10:2: printf call has arguments but no formatting directives\n";
    expect(watch.errorsIn(output, [path.join(project, "pkg", "x.go")], project)).toHaveLength(1);
  });

  it("go vet type errors carry a vet prefix", () => {
    for (const prefix of ["vet: ", "vet.exe: "]) {
      const output = `# smoke\n${prefix}./main.go:4:2: declared and not used: x\n`;
      expect(watch.errorsIn(output, [path.join(project, "main.go")], project)).toEqual([
        "./main.go:4:2: declared and not used: x",
      ]);
    }
  });

  it("blocks with the errors once and clears the pending list", () => {
    nodeProject();
    edit("src/a.ts");
    const calls: string[][] = [];
    const runner: Runner = (command) => {
      calls.push(command);
      return command.includes("--noEmit") ? [2, "src/a.ts(1,1): error TS2322: Type 'x' is not assignable\n"] : [0, ""];
    };
    const decision = watch.stop({ session_id: "s1", stop_hook_active: false }, project, runner);
    const again = watch.stop({ session_id: "s1", stop_hook_active: false }, project, runner);
    expect(decision?.decision).toBe("block");
    expect(decision?.reason).toContain("TS2322");
    expect(again).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it("the second stop of a turn never blocks", () => {
    nodeProject();
    edit("src/a.ts");
    expect(watch.stop({ session_id: "s1", stop_hook_active: true }, project)).toBeNull();
  });
});
