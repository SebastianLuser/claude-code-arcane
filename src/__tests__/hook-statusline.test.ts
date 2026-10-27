import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Specs for hooks/statusline.mjs: the model and context part of the status line. */

interface Statusline {
  fmt(n: number): string;
  nativePath(p: string, platform?: string): string;
  render(data: object, platform?: string): { model: string; extra: string };
}

const HOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks");
const sl = (await import(pathToFileURL(path.join(HOOKS, "statusline.mjs")).href)) as Statusline;

let project: string;
beforeEach(() => {
  project = fs.mkdtempSync(path.join(os.tmpdir(), "arcane statusline "));
});
afterEach(() => fs.rmSync(project, { recursive: true, force: true }));

describe("render", () => {
  it("uses the window Claude Code reports", () => {
    const out = sl.render({
      model: { id: "claude-opus-5-5", display_name: "Opus 5.5" },
      context_window: { context_window_size: 1000000, used_percentage: 4.4,
        current_usage: { input_tokens: 2000, cache_read_input_tokens: 40000, cache_creation_input_tokens: 500 } },
    });
    expect(out).toEqual({ model: "Opus 5.5", extra: "\u{1F9E0} 43k / 1M (4%)" });
  });

  it("writes the context cache session-watch reads, ignored by git", () => {
    fs.mkdirSync(path.join(project, ".claude"));
    sl.render({ session_id: "s1", workspace: { project_dir: project },
      context_window: { context_window_size: 200000, used_percentage: 72 } });
    const state = path.join(project, ".claude", "session-state");
    expect(JSON.parse(fs.readFileSync(path.join(state, "context.json"), "utf-8"))).toEqual({
      session_id: "s1", used_percentage: 72, context_window_size: 200000 });
    expect(fs.readFileSync(path.join(state, ".gitignore"), "utf-8")).toBe("*\n");
  });

  it("never creates .claude in a project without one", () => {
    sl.render({ cwd: project, context_window: { used_percentage: 50 } });
    expect(fs.existsSync(path.join(project, ".claude"))).toBe(false);
  });

  it("falls back to the transcript's last usage", () => {
    const transcript = path.join(project, "t.jsonl");
    fs.writeFileSync(transcript, [
      JSON.stringify({ type: "assistant", message: { usage: { input_tokens: 1 } } }),
      "not json",
      JSON.stringify({ type: "assistant", message: { usage: { input_tokens: 100000 } } }),
    ].join("\n"));
    expect(sl.render({ model: { id: "x" }, transcript_path: transcript }).extra).toBe("\u{1F9E0} 100k / 200k (50%)");
    expect(sl.render({ model: { id: "x[1m]" }, transcript_path: transcript }).extra).toBe("\u{1F9E0} 100k / 1M (10%)");
  });

  it("nothing to show without usage", () => {
    expect(sl.render({})).toEqual({ model: "", extra: "" });
  });

  it("converts Git Bash paths only on Windows", () => {
    expect(sl.nativePath("/c/Users/a", "win32")).toBe("C:/Users/a");
    expect(sl.nativePath("/c/Users/a", "linux")).toBe("/c/Users/a");
  });

  it("formats token counts", () => {
    expect([999, 1500, 200000, 1000000, 1500000].map(sl.fmt)).toEqual(["999", "2k", "200k", "1M", "1.5M"]);
  });
});

describe("statusline.sh", () => {
  it("prints the bar with the model and context, and exits 0", () => {
    const input = JSON.stringify({ model: { display_name: "Opus" },
      context_window: { context_window_size: 200000, used_percentage: 21, current_usage: { input_tokens: 42000 } } });
    const r = spawnSync("bash", [path.join(HOOKS, "statusline.sh")], { cwd: project, input, encoding: "utf-8" });
    expect(r.status).toBe(0);
    // The skill and agent counts include ~/.claude, so they depend on the machine.
    expect(r.stdout.trim()).toMatch(
      new RegExp(`^⚡ Opus \\| 🔮 ${path.basename(project)} \\| 🛠️ \\d+ skills .*\\| \u{1F9E0} 42k / 200k \\(21%\\)$`, "u"),
    );
  });
});
