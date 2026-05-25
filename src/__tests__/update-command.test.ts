import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockExecSync = vi.fn();

vi.mock("node:child_process", () => ({
  execSync: mockExecSync,
}));

describe("updateCommand", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockExecSync.mockReset();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should show already up to date when versions match", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("npm list")) {
        return JSON.stringify({
          dependencies: { "claude-code-arcane": { version: "1.0.0" } },
        });
      }
      if (cmd.includes("npm view")) {
        return "1.0.0\n";
      }
      return "";
    });

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({});

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("up to date");
  });

  it("should show update available when versions differ", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("npm list")) {
        return JSON.stringify({
          dependencies: { "claude-code-arcane": { version: "1.0.0" } },
        });
      }
      if (cmd.includes("npm view")) {
        return "2.0.0\n";
      }
      return "";
    });

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({});

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Update available");
  });

  it("should show short message in quiet mode when update available", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("npm list")) {
        return JSON.stringify({
          dependencies: { "claude-code-arcane": { version: "1.0.0" } },
        });
      }
      if (cmd.includes("npm view")) {
        return "2.0.0\n";
      }
      return "";
    });

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ quiet: true });

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("update available");
  });

  it("should show warning when latest version unavailable", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("npm list")) {
        return JSON.stringify({
          dependencies: { "claude-code-arcane": { version: "1.0.0" } },
        });
      }
      throw new Error("npm view failed");
    });

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({});

    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join("\n");
    expect(output).toContain("Could not check");
  });

  it("should be silent in quiet mode when check fails", async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error("npm failed");
    });

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ quiet: true });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("should not output in quiet mode when already up to date", async () => {
    mockExecSync.mockImplementation((cmd: string) => {
      if (cmd.includes("npm list")) {
        return JSON.stringify({
          dependencies: { "claude-code-arcane": { version: "1.0.0" } },
        });
      }
      if (cmd.includes("npm view")) {
        return "1.0.0\n";
      }
      return "";
    });

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ quiet: true });

    expect(logSpy).not.toHaveBeenCalled();
  });
});
