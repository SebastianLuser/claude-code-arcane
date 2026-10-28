import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { mergeProfiles } from "../profiles.js";
import { diagnose, type DoctorCheck, type Probes } from "../commands/doctor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.resolve(__dirname, "..", "..", "profiles");

const healthy: Probes = {
  findBash: () => "bash",
  checkSyntax: () => null,
};

let tmpDir: string;

function install(profile = "core"): string {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-doctor-test-"));
  const merged = mergeProfiles(PROFILES_DIR, [profile]);
  new Installer(merged, { target: tmpDir, dryRun: false, force: false }).run(profile);
  return tmpDir;
}

function settingsPath(target: string): string {
  return path.join(target, ".claude", "settings.json");
}

function editSettings(target: string, change: (s: Record<string, any>) => void): void {
  const settings = JSON.parse(fs.readFileSync(settingsPath(target), "utf-8"));
  change(settings);
  fs.writeFileSync(settingsPath(target), JSON.stringify(settings, null, 2));
}

function byName(checks: DoctorCheck[], name: string): DoctorCheck {
  const check = checks.find((c) => c.name === name);
  if (!check) throw new Error(`no check named ${name}: ${checks.map((c) => c.name).join(", ")}`);
  return check;
}

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});

describe("diagnose", () => {
  it("finds nothing wrong in a fresh install", () => {
    const checks = diagnose(install("core"), healthy);
    expect(checks.filter((c) => c.verdict !== "ok")).toEqual([]);
    expect(byName(checks, "hook scripts").detail).toMatch(/^\d+ scripts found$/);
  });

  it("fails without an installation", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-doctor-test-"));
    const [check] = diagnose(tmpDir, healthy);
    expect(check).toMatchObject({ name: "installation", verdict: "fail" });
  });

  it("fails on a settings.json that is not JSON", () => {
    const target = install();
    fs.writeFileSync(settingsPath(target), "{ broken");
    expect(byName(diagnose(target, healthy), "settings.json").verdict).toBe("fail");
  });

  it("names a hook script that is missing, including the Node script behind a wrapper", () => {
    const target = install();
    fs.rmSync(path.join(target, ".claude", "hooks", "guard.sh"));
    fs.rmSync(path.join(target, ".claude", "hooks", "session-watch.mjs"));
    const check = byName(diagnose(target, healthy), "hook scripts");
    expect(check.verdict).toBe("fail");
    expect(check.detail).toContain("hooks/guard.sh");
    expect(check.detail).toContain("hooks/session-watch.mjs");
  });

  it("fails when bash rejects a script", () => {
    const target = install();
    const probes = { ...healthy, checkSyntax: (_: string, file: string) => (file.endsWith("notify.sh") ? "line 3: bad" : null) };
    const check = byName(diagnose(target, probes), "hook syntax");
    expect(check.verdict).toBe("fail");
    expect(check.detail).toContain("hooks/notify.sh: line 3: bad");
  });

  it("fails without bash", () => {
    const checks = diagnose(install(), { ...healthy, findBash: () => null });
    expect(byName(checks, "bash").verdict).toBe("fail");
  });

  it("warns on hooks still wired with a relative path", () => {
    const target = install();
    editSettings(target, (s) => {
      s.hooks.Notification[0].hooks[0].command = "bash .claude/hooks/notify.sh";
    });
    expect(byName(diagnose(target, healthy), "hook paths").verdict).toBe("warn");
  });

  it("fails when a skill or rule in the manifest is gone", () => {
    const target = install();
    fs.rmSync(path.join(target, ".claude", "rules", "verification.md"));
    const check = byName(diagnose(target, healthy), "installed content");
    expect(check.verdict).toBe("fail");
    expect(check.detail).toContain("rule verification");
  });

  it("warns on allow rules that skip every confirmation, in either settings file", () => {
    const target = install();
    editSettings(target, (s) => s.permissions.allow.push("Bash(gh *)"));
    fs.writeFileSync(
      path.join(target, ".claude", "settings.local.json"),
      JSON.stringify({ permissions: { allow: ["Bash(*)"] } }),
    );
    const check = byName(diagnose(target, healthy), "permissions");
    expect(check.verdict).toBe("warn");
    expect(check.detail).toContain("settings.json: Bash(gh *)");
    expect(check.detail).toContain("settings.local.json: Bash(*)");
  });

  it("reads the colon form of a rule as the same rule", () => {
    const target = install();
    editSettings(target, (s) => s.permissions.allow.push("Bash(rm:*)", "Bash(git push:*)"));
    const check = byName(diagnose(target, healthy), "permissions");
    expect(check.detail).toContain("Bash(rm:*)");
    expect(check.detail).toContain("Bash(git push:*)");
  });

  it("fails on a credential in .mcp.json but accepts an env reference", () => {
    const target = install();
    const mcp = path.join(target, ".mcp.json");
    fs.writeFileSync(mcp, JSON.stringify({ mcpServers: { x: { env: { API_TOKEN: "${API_TOKEN}" } } } }));
    expect(byName(diagnose(target, healthy), "secrets").verdict).toBe("ok");

    fs.writeFileSync(mcp, JSON.stringify({ mcpServers: { x: { env: { API_TOKEN: "plain-value-123" } } } }));
    const check = byName(diagnose(target, healthy), "secrets");
    expect(check.verdict).toBe("fail");
    expect(check.detail).toContain(".mcp.json (literal API_TOKEN)");
  });

  it("recognizes a token by its shape and only warns for settings.local.json", () => {
    const target = install();
    fs.writeFileSync(
      path.join(target, ".claude", "settings.local.json"),
      JSON.stringify({ env: { GH: "ghp_" + "a".repeat(36) } }),
    );
    const check = byName(diagnose(target, healthy), "secrets");
    expect(check.verdict).toBe("warn");
    expect(check.detail).toContain("GitHub token");
  });
});

describe("default probes", () => {
  it.skipIf(process.platform !== "win32")("find Git Bash from the Git\\cmd folder on PATH", async () => {
    const { findBash } = await import("../commands/doctor.js");
    const git = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-doctor-git-"));
    fs.mkdirSync(path.join(git, "cmd"));
    fs.mkdirSync(path.join(git, "bin"));
    fs.writeFileSync(path.join(git, "bin", "bash.exe"), "");
    const saved = { PATH: process.env.PATH, override: process.env.CLAUDE_CODE_GIT_BASH_PATH };
    process.env.PATH = path.join(git, "cmd");
    delete process.env.CLAUDE_CODE_GIT_BASH_PATH;
    try {
      expect(findBash()).toBe(path.join(git, "bin", "bash.exe"));
    } finally {
      process.env.PATH = saved.PATH;
      if (saved.override !== undefined) process.env.CLAUDE_CODE_GIT_BASH_PATH = saved.override;
      fs.rmSync(git, { recursive: true, force: true });
    }
  });

  it("parse every shipped hook with the real bash", async () => {
    const { defaultProbes } = await import("../commands/doctor.js");
    const bash = defaultProbes.findBash();
    if (!bash) return; // no bash on this machine: the fake-probe tests above still cover the logic
    const checks = diagnose(install(), defaultProbes);
    expect(byName(checks, "hook syntax").verdict).toBe("ok");
  });
});
