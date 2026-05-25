import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("CLI setup", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    vi.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv;
    exitSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  it("should register all commands and show help", async () => {
    process.argv = ["node", "arcane", "--help"];

    try {
      await import("../cli.js");
    } catch {
      // Commander calls process.exit(0) after --help
    }

    const output = stdoutSpy.mock.calls
      .map((c) => String(c[0]))
      .join("");
    expect(output).toContain("arcane");
    expect(output).toContain("install");
    expect(output).toContain("add");
    expect(output).toContain("remove");
    expect(output).toContain("list");
    expect(output).toContain("status");
    expect(output).toContain("update");
    expect(output).toContain("clean");
    expect(output).toContain("worktree");
    expect(output).toContain("global");
  });

  it("should show version number", async () => {
    process.argv = ["node", "arcane", "--version"];

    try {
      await import("../cli.js");
    } catch {
      // Commander calls process.exit(0) after --version
    }

    const output = stdoutSpy.mock.calls
      .map((c) => String(c[0]))
      .join("");
    expect(output).toContain("1.0.0");
  });
});
