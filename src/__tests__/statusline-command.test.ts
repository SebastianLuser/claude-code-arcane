import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { mergeProfiles } from "../profiles.js";
import { RELATIVE_STATUSLINE_COMMAND, statuslineCommand } from "../utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PROFILES_DIR = path.join(REPO_ROOT, "profiles");

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-statusline-test-"));
}

function readSettings(target: string): Record<string, any> {
  return JSON.parse(
    fs.readFileSync(path.join(target, ".claude", "settings.json"), "utf-8"),
  );
}

describe("statuslineCommand", () => {
  it("should stay relative for a project install", () => {
    // A project's settings.json is committed and shared, so an absolute path would
    // break for every other machine and checkout.
    expect(statuslineCommand(path.join(os.tmpdir(), "some-project"))).toBe(
      RELATIVE_STATUSLINE_COMMAND,
    );
  });

  it("should point the global install at the script it owns", () => {
    // The relative form in ~/.claude/settings.json resolves against whichever project
    // is open, not the home directory — so it names a file the project may not have.
    const command = statuslineCommand(os.homedir());

    expect(command).not.toBe(RELATIVE_STATUSLINE_COMMAND);
    expect(command).toContain(".claude/statusline.sh");
    expect(command.startsWith('bash "')).toBe(true);
  });

  it("should quote the path and use forward slashes", () => {
    // bash reads backslashes as escapes, and a home directory with a space in it would
    // otherwise split into two arguments.
    const command = statuslineCommand(os.homedir());
    const quoted = /^bash "([^"]+)"$/.exec(command);

    expect(quoted, "command must be `bash \"<path>\"`").toBeTruthy();
    expect(quoted![1]).not.toContain("\\");
  });
});

describe("the statusLine an install writes", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    logSpy?.mockRestore();
    vi.restoreAllMocks();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  function install(target: string) {
    const merged = mergeProfiles(PROFILES_DIR, ["testing", "statusline"]);
    new Installer(merged, { target, dryRun: false, force: false }).run(
      "testing+statusline",
    );
    return merged;
  }

  it("should be relative in a project install", () => {
    tmpDir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    install(tmpDir);

    expect(readSettings(tmpDir).statusLine.command).toBe(RELATIVE_STATUSLINE_COMMAND);
  });

  it("should be absolute in a global install", () => {
    tmpDir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(os, "homedir").mockReturnValue(tmpDir);

    install(tmpDir);

    const command = readSettings(tmpDir).statusLine.command;
    expect(command).not.toBe(RELATIVE_STATUSLINE_COMMAND);
    expect(command).toBe(statuslineCommand(tmpDir));
    // The file it names has to be the one the install actually wrote.
    const script = /^bash "([^"]+)"$/.exec(command)![1];
    expect(fs.existsSync(script), `${script} should exist`).toBe(true);
  });
});

describe("updateTarget healing a legacy statusLine", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    logSpy?.mockRestore();
    vi.restoreAllMocks();
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  function installWithLegacyCommand(target: string) {
    const merged = mergeProfiles(PROFILES_DIR, ["testing", "statusline"]);
    new Installer(merged, { target, dryRun: false, force: false }).run(
      "testing+statusline",
    );
    // Every install written before the absolute form looks like this.
    const settingsPath = path.join(target, ".claude", "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    settings.statusLine = { type: "command", command: RELATIVE_STATUSLINE_COMMAND };
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
  }

  it("should rewrite the command in a global install", async () => {
    tmpDir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    installWithLegacyCommand(tmpDir);
    vi.spyOn(os, "homedir").mockReturnValue(tmpDir);

    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    expect(readSettings(tmpDir).statusLine.command).toBe(statuslineCommand(tmpDir));
  });

  it("should leave a project install alone", async () => {
    tmpDir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    installWithLegacyCommand(tmpDir);

    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    expect(readSettings(tmpDir).statusLine.command).toBe(RELATIVE_STATUSLINE_COMMAND);
  });

  it("should preserve keys it does not own", async () => {
    tmpDir = makeTmpDir();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    installWithLegacyCommand(tmpDir);
    const settingsPath = path.join(tmpDir, ".claude", "settings.json");
    const before = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    before.permissions.allow.push("Bash(echo mine)");
    fs.writeFileSync(settingsPath, `${JSON.stringify(before, null, 2)}\n`, "utf-8");
    vi.spyOn(os, "homedir").mockReturnValue(tmpDir);

    const { updateTarget } = await import("../commands/update.js");
    await updateTarget(tmpDir, {});

    const after = readSettings(tmpDir);
    expect(after.permissions.allow).toContain("Bash(echo mine)");
    expect(after.hooks).toEqual(before.hooks);
    expect(after.statusLine.type).toBe("command");
  });
});
