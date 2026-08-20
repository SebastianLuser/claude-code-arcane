import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const spawnSync = vi.fn();
const getPackageRoot = vi.fn();

vi.mock("node:child_process", () => ({ spawnSync }));
vi.mock("../utils.js", () => ({
  getPackageRoot,
  getPackageVersion: () => "9.9.9",
}));

const { npmInstallCommand, isGloballyInstalled, selfUpdateNpm } = await import(
  "../self-update.js"
);

describe("npmInstallCommand", () => {
  it("uses a shell on Windows, with the whole call in the command string", () => {
    // Node refuses to spawn the npm.cmd shim without a shell (EINVAL) since the
    // fix for CVE-2024-27980 — that bug made self-update a silent no-op. And an
    // args array alongside shell:true is deprecated (DEP0190), so it goes inline.
    const npm = npmInstallCommand("win32");
    expect(npm.shell).toBe(true);
    expect(npm.command).toBe("npm install -g claude-code-arcane@latest");
    expect(npm.args).toEqual([]);
  });

  it("does not use a shell elsewhere", () => {
    expect(npmInstallCommand("darwin").shell).toBe(false);
    expect(npmInstallCommand("linux").shell).toBe(false);
  });

  it("installs the package globally at latest", () => {
    const { command, args } = npmInstallCommand("linux");
    expect(command).toBe("npm");
    expect(args).toEqual(["install", "-g", "claude-code-arcane@latest"]);
  });
});

describe("isGloballyInstalled", () => {
  it("is false for an npx run", () => {
    getPackageRoot.mockReturnValue(
      "C:\\Users\\x\\AppData\\Local\\npm-cache\\_npx\\abc\\node_modules\\claude-code-arcane",
    );
    expect(isGloballyInstalled()).toBe(false);
  });

  it("is false for a dev checkout", () => {
    getPackageRoot.mockReturnValue("C:\\repos\\claude-code-arcane");
    expect(isGloballyInstalled()).toBe(false);
  });

  it("is true for a global install", () => {
    getPackageRoot.mockReturnValue(
      "C:\\Users\\x\\AppData\\Roaming\\npm\\node_modules\\claude-code-arcane",
    );
    expect(isGloballyInstalled()).toBe(true);
  });
});

describe("selfUpdateNpm", () => {
  const originalVitest = process.env.VITEST;

  beforeEach(() => {
    spawnSync.mockReset();
    getPackageRoot.mockReturnValue(
      "C:\\Users\\x\\AppData\\Roaming\\npm\\node_modules\\claude-code-arcane",
    );
  });

  afterEach(() => {
    if (originalVitest === undefined) delete process.env.VITEST;
    else process.env.VITEST = originalVitest;
  });

  it("skips when disabled, without spawning npm", async () => {
    const result = await selfUpdateNpm({ selfUpdate: false });
    expect(result).toMatchObject({ skipped: true, updated: false });
    expect(result.reason).toContain("no-self-update");
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("skips in a dev/test environment", async () => {
    process.env.VITEST = "1";
    const result = await selfUpdateNpm();
    expect(result.skipped).toBe(true);
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("skips a dry run before spawning", async () => {
    delete process.env.VITEST;
    delete process.env.ARCANE_SOURCE;
    const result = await selfUpdateNpm({ dryRun: true });
    expect(result.reason).toBe("dry-run");
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("passes the shell flag through to spawnSync", async () => {
    delete process.env.VITEST;
    delete process.env.ARCANE_SOURCE;
    spawnSync.mockReturnValue({ status: 0 });

    const result = await selfUpdateNpm();

    expect(result).toMatchObject({ updated: true, skipped: false });
    const [command, args, options] = spawnSync.mock.calls[0];
    const expected = npmInstallCommand();
    expect(command).toBe(expected.command);
    expect(args).toEqual(expected.args);
    expect(options.shell).toBe(expected.shell);
    // Whatever the platform, the invocation has to name the package at latest.
    expect([command, ...args].join(" ")).toContain("claude-code-arcane@latest");
  });

  it("reports the spawn error instead of claiming success", async () => {
    delete process.env.VITEST;
    delete process.env.ARCANE_SOURCE;
    spawnSync.mockReturnValue({
      status: null,
      error: new Error("spawnSync npm.cmd EINVAL"),
    });

    const result = await selfUpdateNpm();

    expect(result.updated).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.reason).toContain("EINVAL");
  });
});
