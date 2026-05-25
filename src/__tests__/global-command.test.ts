import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("globalCommand", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;
  const savedHome = process.env.HOME;
  const savedUserProfile = process.env.USERPROFILE;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "arcane-global-test-"),
    );
    process.env.HOME = tmpDir;
    process.env.USERPROFILE = tmpDir;
    vi.resetModules();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);
  });

  afterEach(() => {
    process.env.HOME = savedHome;
    process.env.USERPROFILE = savedUserProfile;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    exitSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  describe("--status", () => {
    it("should show not installed when no scripts exist", async () => {
      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({ status: true });

      const output = logSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(output).toContain("Global Status");
      expect(output).toContain("not installed");
      expect(output).toContain("not configured");
    });

    it("should show scripts as installed when apply.py exists", async () => {
      const scriptsDir = path.join(
        tmpDir,
        ".claude",
        "scripts",
        "worktree-isolation",
      );
      fs.mkdirSync(scriptsDir, { recursive: true });
      fs.writeFileSync(path.join(scriptsDir, "apply.py"), "# test");

      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({ status: true });

      const output = logSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(output).toContain("installed");
    });

    it("should show hook as active when settings has the hook", async () => {
      const claudeDir = path.join(tmpDir, ".claude");
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, "settings.json"),
        JSON.stringify({
          hooks: {
            SessionStart: [
              {
                matcher: "",
                hooks: [
                  {
                    type: "command",
                    command:
                      "worktree-isolation/apply.py --quiet",
                  },
                ],
              },
            ],
          },
        }),
      );

      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({ status: true });

      const output = logSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(output).toContain("active");
    });
  });

  describe("install (default)", () => {
    it("should install scripts and add hook to settings", async () => {
      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({});

      const scriptsDir = path.join(
        tmpDir,
        ".claude",
        "scripts",
        "worktree-isolation",
      );
      expect(fs.existsSync(path.join(scriptsDir, "apply.py"))).toBe(
        true,
      );
      expect(fs.existsSync(path.join(scriptsDir, "lib.py"))).toBe(
        true,
      );

      const settingsPath = path.join(
        tmpDir,
        ".claude",
        "settings.json",
      );
      expect(fs.existsSync(settingsPath)).toBe(true);
      const settings = JSON.parse(
        fs.readFileSync(settingsPath, "utf-8"),
      );
      expect(settings.hooks.SessionStart).toBeDefined();
    });

    it("should skip files that are already up to date", async () => {
      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({});

      logSpy.mockClear();
      vi.resetModules();
      process.env.HOME = tmpDir;
      process.env.USERPROFILE = tmpDir;

      const mod2 = await import("../commands/global.js");
      await mod2.globalCommand({});

      const output = logSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(output).toContain("[skip]");
    });
  });

  describe("--remove", () => {
    it("should remove scripts and hook after install", async () => {
      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({});

      const scriptsDir = path.join(
        tmpDir,
        ".claude",
        "scripts",
        "worktree-isolation",
      );
      expect(fs.existsSync(scriptsDir)).toBe(true);

      logSpy.mockClear();
      vi.resetModules();
      process.env.HOME = tmpDir;
      process.env.USERPROFILE = tmpDir;

      const mod2 = await import("../commands/global.js");
      await mod2.globalCommand({ remove: true });

      expect(fs.existsSync(scriptsDir)).toBe(false);

      const output = logSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(output).toContain("Removed");
    });

    it("should skip when nothing is installed", async () => {
      const { globalCommand } = await import(
        "../commands/global.js"
      );
      await globalCommand({ remove: true });

      const output = logSpy.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .join("\n");
      expect(output).toContain("[skip]");
    });
  });

  it("should handle corrupted settings.json gracefully", async () => {
    const claudeDir = path.join(tmpDir, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, "settings.json"),
      "invalid json{{{",
    );

    const { globalCommand } = await import(
      "../commands/global.js"
    );
    await globalCommand({ status: true });

    const output = logSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Global Status");
    expect(output).toContain("not configured");
  });

  it("should append to existing SessionStart hooks when installing", async () => {
    const claudeDir = path.join(tmpDir, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, "settings.json"),
      JSON.stringify({
        hooks: {
          SessionStart: [
            {
              matcher: "",
              hooks: [
                {
                  type: "command",
                  command: "echo existing-hook",
                },
              ],
            },
          ],
        },
      }),
    );

    const { globalCommand } = await import(
      "../commands/global.js"
    );
    await globalCommand({});

    const settingsPath = path.join(claudeDir, "settings.json");
    const settings = JSON.parse(
      fs.readFileSync(settingsPath, "utf-8"),
    );
    const sessionHooks =
      settings.hooks.SessionStart[0].hooks;
    expect(sessionHooks.length).toBe(2);
    expect(
      sessionHooks.some((h: { command: string }) =>
        h.command.includes("existing-hook"),
      ),
    ).toBe(true);
    expect(
      sessionHooks.some((h: { command: string }) =>
        h.command.includes("apply.py"),
      ),
    ).toBe(true);
  });
});
