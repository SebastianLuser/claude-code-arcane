import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const mockGetWorktreeInfo = vi.fn();
const mockCreateGitWorktree = vi.fn();
const mockDefaultWorktreePath = vi.fn();
const mockDetectPackageManager = vi.fn();
const mockExecSync = vi.fn();
const mockExecFileSync = vi.fn();
const mockFindMainArcaneInstall = vi.fn(() => false);

vi.mock("../worktree.js", () => ({
  getWorktreeInfo: mockGetWorktreeInfo,
  createGitWorktree: mockCreateGitWorktree,
  checkBranchExists: vi.fn(() => false),
  defaultWorktreePath: mockDefaultWorktreePath,
  detectPackageManager: mockDetectPackageManager,
  findMainArcaneInstall: mockFindMainArcaneInstall,
  linkOrCopyDir: vi.fn(() => "copied"),
}));

vi.mock("node:child_process", () => ({
  execSync: mockExecSync,
  execFileSync: mockExecFileSync,
}));

function makeTmpDir(): string {
  return fs.mkdtempSync(
    path.join(os.tmpdir(), "arcane-wtcmd-test-"),
  );
}

describe("worktreeCommand", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
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

    mockGetWorktreeInfo.mockReset();
    mockCreateGitWorktree.mockReset();
    mockDefaultWorktreePath.mockReset();
    mockDetectPackageManager.mockReset();
    mockExecSync.mockReset();
    mockExecFileSync.mockReset();
    mockFindMainArcaneInstall.mockReset();
    mockFindMainArcaneInstall.mockReturnValue(false);
    vi.resetModules();
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    exitSpy.mockRestore();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("should exit with error when not a git repository", async () => {
    mockGetWorktreeInfo.mockReturnValue(null);

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await expect(
      worktreeCommand("feat/test", {}),
    ).rejects.toThrow("process.exit called");

    const output = errorSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Not a git repository");
  });

  it("should exit with error when path already exists", async () => {
    const worktreePath = path.join(tmpDir, "existing-wt");
    fs.mkdirSync(worktreePath);

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await expect(
      worktreeCommand("feat/test", {}),
    ).rejects.toThrow("process.exit called");

    const output = errorSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("already exists");
  });

  it("should exit with error when no profile and no manifest", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await expect(
      worktreeCommand("feat/test", {}),
    ).rejects.toThrow("process.exit called");

    const output = errorSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("No profile specified");
  });

  it("should show dry-run message and not create worktree", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      dryRun: true,
    });

    const output = logSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("[dry-run]");
    expect(mockCreateGitWorktree).not.toHaveBeenCalled();
  });

  it("should exit with error when git worktree creation fails", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(() => {
      throw new Error("git worktree add failed");
    });

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await expect(
      worktreeCommand("feat/test", { profile: "testing" }),
    ).rejects.toThrow("process.exit called");

    const output = errorSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Failed to create worktree");
  });

  it("should create worktree and install arcane with explicit profile", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      share: false,
    });

    expect(mockCreateGitWorktree).toHaveBeenCalled();
    expect(
      fs.existsSync(path.join(worktreePath, ".claude")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          worktreePath,
          ".claude",
          "arcane-manifest.json",
        ),
      ),
    ).toBe(true);

    const output = logSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Worktree ready");
  });

  it("should use custom path when --path is specified", async () => {
    const customPath = path.join(tmpDir, "custom-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      path: customPath,
      share: false,
    });

    expect(
      fs.existsSync(path.join(customPath, ".claude")),
    ).toBe(true);
  });

  it("should inherit profile from existing manifest", async () => {
    const { Installer } = await import("../installer.js");
    const { mergeProfiles } = await import("../profiles.js");
    const { getPackageRoot } = await import("../utils.js");
    const root = getPackageRoot();
    const merged = mergeProfiles(path.join(root, "profiles"), [
      "testing",
    ]);
    const installer = new Installer(merged, {
      target: tmpDir,
      dryRun: false,
      force: false,
    });
    installer.run("testing");

    const worktreePath = path.join(tmpDir, "new-wt");
    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );

    logSpy.mockClear();
    vi.resetModules();

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", { share: false });

    const output = logSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Inheriting profile");
    expect(output).toContain("Worktree ready");
  });

  it("should log base branch when --base is specified", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      base: "develop",
      share: false,
    });

    const output = logSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Base");
    expect(output).toContain("develop");
  });

  it("should install deps when --install-deps is passed", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );
    mockDetectPackageManager.mockReturnValue({
      lockfile: "package-lock.json",
      command: "npm install",
    });
    mockExecSync.mockReturnValue("");

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      installDeps: true,
      share: false,
    });

    expect(mockDetectPackageManager).toHaveBeenCalledWith(
      worktreePath,
    );
    const output = logSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Dependencies installed");
  });

  it("should warn when dependency install fails", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );
    mockDetectPackageManager.mockReturnValue({
      lockfile: "package-lock.json",
      command: "npm install",
    });
    mockExecSync.mockImplementation(() => {
      throw new Error("npm install failed");
    });

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      installDeps: true,
      share: false,
    });

    const output = warnSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("Dependency install failed");
  });

  it("should warn when isolate requested but skill not present", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");

    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation(
      (_root: string, wtPath: string) => {
        fs.mkdirSync(wtPath, { recursive: true });
      },
    );

    const { worktreeCommand } = await import(
      "../commands/worktree.js"
    );
    await worktreeCommand("feat/test", {
      profile: "testing",
      isolate: true,
      share: false,
    });

    const output = warnSpy.mock.calls
      .map((c: unknown[]) => String(c[0]))
      .join("\n");
    expect(output).toContain("worktree-isolation skill not installed");
  });
  it("removes the worktree it just created when the install fails", async () => {
    const worktreePath = path.join(tmpDir, "new-wt");
    mockGetWorktreeInfo.mockReturnValue({
      isWorktree: false,
      mainWorktreePath: tmpDir,
      toplevel: tmpDir,
    });
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    // A file where .claude/ must go: the installer cannot write there.
    mockCreateGitWorktree.mockImplementation((_root: string, wtPath: string) => {
      fs.writeFileSync(wtPath, "");
    });

    const { worktreeCommand } = await import("../commands/worktree.js");
    await expect(
      worktreeCommand("feat/test", { profile: "testing", share: false }),
    ).rejects.toThrow("process.exit called");

    const calls = mockExecFileSync.mock.calls.map((c: unknown[]) => (c[1] as string[]).join(" "));
    expect(calls).toContain(`worktree remove --force ${worktreePath}`);
    expect(calls).toContain("branch -D feat/test");
  });

  it("from inside another worktree, reads its manifest and shares from the main checkout", async () => {
    const { Installer } = await import("../installer.js");
    const { mergeProfiles } = await import("../profiles.js");
    const { getPackageRoot } = await import("../utils.js");
    const merged = mergeProfiles(path.join(getPackageRoot(), "profiles"), ["testing"]);
    const main = path.join(tmpDir, "main");
    const other = path.join(tmpDir, "other-wt");
    for (const dir of [main, other]) {
      new Installer(merged, { target: dir, dryRun: false, force: false }).run("testing");
    }

    const worktreePath = path.join(tmpDir, "new-wt");
    // process.cwd() is a subdirectory of the other worktree.
    mockGetWorktreeInfo.mockReturnValue({ isWorktree: true, mainWorktreePath: main, toplevel: other });
    mockFindMainArcaneInstall.mockImplementation(((p: string) => p === main) as never);
    mockDefaultWorktreePath.mockReturnValue(worktreePath);
    mockCreateGitWorktree.mockImplementation((_root: string, wtPath: string) => {
      fs.mkdirSync(wtPath, { recursive: true });
    });
    const { linkOrCopyDir } = await import("../worktree.js");
    logSpy.mockClear();

    const { worktreeCommand } = await import("../commands/worktree.js");
    await worktreeCommand("feat/test", {});

    const output = logSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(output).toContain("Inheriting profile");
    expect(mockCreateGitWorktree.mock.calls[0][0]).toBe(main);
    expect(vi.mocked(linkOrCopyDir).mock.calls[0][0]).toBe(path.join(main, ".claude", "hooks"));
  });
});
