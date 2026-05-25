import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readManifest, writeManifest, manifestPath } from "../manifest.js";
import type { MergedProfile } from "../types.js";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-manifest-test-"));
}

const SAMPLE_MERGED: MergedProfile = {
  loaded: ["core", "testing"],
  skills: ["commit", "help", "contract-testing"],
  rules: { universal: ["data-files"], gamedev: [] },
  agents: ["quality"],
  hooks: ["session-start.sh"],
  permissions: {
    allow: ["Bash(git status*)"],
    deny: ["Bash(rm -rf *)"],
  },
};

describe("manifestPath", () => {
  it("returns path under .claude/", () => {
    const p = manifestPath("/some/project");
    expect(p).toBe(path.join("/some/project", ".claude", "arcane-manifest.json"));
  });
});

describe("writeManifest + readManifest", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("round-trips manifest data correctly", () => {
    tmpDir = makeTmpDir();
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });

    writeManifest(tmpDir, SAMPLE_MERGED, "testing", "/pkg/root");

    const manifest = readManifest(tmpDir);
    expect(manifest).not.toBeNull();
    expect(manifest!.profiles).toEqual(["core", "testing"]);
    expect(manifest!.installed_skills).toEqual(["commit", "help", "contract-testing"]);
    expect(manifest!.installed_rules).toEqual(["data-files"]);
    expect(manifest!.installed_agents).toEqual(["quality"]);
    expect(manifest!.total_skills).toBe(3);
    expect(manifest!.total_rules).toBe(1);
    expect(manifest!.cli).toBe("npm");
    expect(manifest!.profile_command).toBe("testing");
    expect(manifest!.source).toBe("/pkg/root");
    expect(manifest!.arcane_version).toBe("1.0.0");
  });

  it("includes worktree metadata when provided", () => {
    tmpDir = makeTmpDir();
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });

    const wtMeta = {
      is_worktree: true,
      main_worktree: "/main/repo",
      shared_dirs: ["hooks", "docs"],
    };
    writeManifest(tmpDir, SAMPLE_MERGED, "testing", "/pkg/root", wtMeta);

    const manifest = readManifest(tmpDir);
    expect(manifest!.worktree).toEqual(wtMeta);
  });

  it("returns null for non-existent manifest", () => {
    tmpDir = makeTmpDir();
    const manifest = readManifest(tmpDir);
    expect(manifest).toBeNull();
  });

  it("writes valid JSON with installed_at timestamp", () => {
    tmpDir = makeTmpDir();
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });

    writeManifest(tmpDir, SAMPLE_MERGED, "testing", "/pkg/root");

    const raw = fs.readFileSync(manifestPath(tmpDir), "utf-8");
    const parsed = JSON.parse(raw);
    expect(parsed.installed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
