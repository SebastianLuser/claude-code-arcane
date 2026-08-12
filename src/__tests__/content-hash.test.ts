import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  hashFile,
  hashDirectory,
  compareHashes,
  computeContentHashes,
} from "../content-hash.js";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-hash-test-"));
}

/**
 * hashDirectory used to count __pycache__ while copyDirSync skipped it, so a
 * source tree where a Python skill had run hashed to something no install could
 * reproduce. `update` then listed that skill as changed, copied it, hit the same
 * mismatch, and offered it again on every run without ever converging.
 */
describe("hashDirectory build artifacts", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  function writeSkill(dir: string): void {
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(dir, "SKILL.md"), "# Skill");
    fs.writeFileSync(path.join(dir, "scripts", "run.py"), "print(1)\n");
  }

  it("ignores __pycache__ directories", () => {
    // Arrange
    tmpDir = makeTmpDir();
    const clean = path.join(tmpDir, "clean");
    const dirty = path.join(tmpDir, "dirty");
    writeSkill(clean);
    writeSkill(dirty);
    fs.mkdirSync(path.join(dirty, "scripts", "__pycache__"), { recursive: true });
    fs.writeFileSync(path.join(dirty, "scripts", "__pycache__", "run.cpython-312.pyc"), "bytecode");

    // Act
    const cleanHashes = hashDirectory(clean);
    const dirtyHashes = hashDirectory(dirty);

    // Assert: having run the script must not change what the skill *is*.
    expect(Object.keys(dirtyHashes).sort()).toEqual(Object.keys(cleanHashes).sort());
  });

  it("ignores loose .pyc files", () => {
    // Arrange
    tmpDir = makeTmpDir();
    writeSkill(tmpDir);
    fs.writeFileSync(path.join(tmpDir, "scripts", "stale.pyc"), "bytecode");

    // Act
    const hashes = hashDirectory(tmpDir);

    // Assert
    expect(Object.keys(hashes)).not.toContain("scripts/stale.pyc");
  });

  it("still hashes the real content", () => {
    // Arrange: the exclusion must not swallow the files that matter.
    tmpDir = makeTmpDir();
    writeSkill(tmpDir);

    // Act
    const hashes = hashDirectory(tmpDir);

    // Assert
    expect(Object.keys(hashes).sort()).toEqual(["SKILL.md", "scripts/run.py"]);
  });
});

describe("hashFile", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should produce consistent hash for same content", () => {
    tmpDir = makeTmpDir();
    const file = path.join(tmpDir, "test.txt");
    fs.writeFileSync(file, "hello world");

    const hash1 = hashFile(file);
    const hash2 = hashFile(file);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce different hash for different content", () => {
    tmpDir = makeTmpDir();
    const file1 = path.join(tmpDir, "a.txt");
    const file2 = path.join(tmpDir, "b.txt");
    fs.writeFileSync(file1, "hello");
    fs.writeFileSync(file2, "world");

    expect(hashFile(file1)).not.toBe(hashFile(file2));
  });
});

describe("hashDirectory", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should hash all files with forward-slash keys", () => {
    tmpDir = makeTmpDir();
    const sub = path.join(tmpDir, "sub");
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(tmpDir, "root.txt"), "root");
    fs.writeFileSync(path.join(sub, "nested.txt"), "nested");

    const hashes = hashDirectory(tmpDir);
    expect(hashes).toHaveProperty("root.txt");
    expect(hashes).toHaveProperty("sub/nested.txt");
    expect(Object.keys(hashes)).toHaveLength(2);
  });

  it("should return empty object for empty directory", () => {
    tmpDir = makeTmpDir();
    const hashes = hashDirectory(tmpDir);
    expect(hashes).toEqual({});
  });
});

describe("compareHashes", () => {
  it("should detect added files", () => {
    const installed = { "a.txt": "hash1" };
    const source = { "a.txt": "hash1", "b.txt": "hash2" };

    const result = compareHashes(installed, source);
    expect(result.added).toEqual(["b.txt"]);
    expect(result.unchanged).toEqual(["a.txt"]);
    expect(result.changed).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it("should detect removed files", () => {
    const installed = { "a.txt": "hash1", "b.txt": "hash2" };
    const source = { "a.txt": "hash1" };

    const result = compareHashes(installed, source);
    expect(result.removed).toEqual(["b.txt"]);
    expect(result.unchanged).toEqual(["a.txt"]);
  });

  it("should detect changed files", () => {
    const installed = { "a.txt": "hash1" };
    const source = { "a.txt": "hash2" };

    const result = compareHashes(installed, source);
    expect(result.changed).toEqual(["a.txt"]);
    expect(result.unchanged).toEqual([]);
  });

  it("should handle empty inputs", () => {
    const result = compareHashes({}, {});
    expect(result).toEqual({ added: [], removed: [], changed: [], unchanged: [] });
  });
});

describe("computeContentHashes", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should hash skills, rules, agents, and hooks", () => {
    tmpDir = makeTmpDir();
    const claudeDir = path.join(tmpDir, ".claude");

    // Arrange
    const skillDir = path.join(claudeDir, "skills", "my-skill");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), "# My Skill");

    const rulesDir = path.join(claudeDir, "rules");
    fs.mkdirSync(rulesDir, { recursive: true });
    fs.writeFileSync(path.join(rulesDir, "test.md"), "# Rule");

    const agentDir = path.join(claudeDir, "agents", "quality");
    fs.mkdirSync(agentDir, { recursive: true });
    fs.writeFileSync(path.join(agentDir, "qa.md"), "# QA Agent");

    const hooksDir = path.join(claudeDir, "hooks");
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.writeFileSync(path.join(hooksDir, "session-start.sh"), "#!/bin/bash");

    // Act
    const hashes = computeContentHashes(claudeDir);

    // Assert
    expect(hashes.skills).toHaveProperty("my-skill");
    expect(hashes.rules).toHaveProperty("test.md");
    expect(hashes.agents).toHaveProperty("quality");
    expect(hashes.hooks).toHaveProperty("session-start.sh");
  });

  it("should return empty hashes for missing directories", () => {
    tmpDir = makeTmpDir();
    const claudeDir = path.join(tmpDir, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });

    const hashes = computeContentHashes(claudeDir);
    expect(hashes).toEqual({ skills: {}, rules: {}, agents: {}, hooks: {} });
  });
});
