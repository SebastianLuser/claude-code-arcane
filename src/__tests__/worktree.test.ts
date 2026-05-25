import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  sanitizeBranchForPath,
  defaultWorktreePath,
  detectPackageManager,
  findMainArcaneInstall,
  linkOrCopyDir,
  isSymlinkOrJunction,
  getWorktreeInfo,
} from "../worktree.js";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-worktree-test-"));
}

describe("sanitizeBranchForPath", () => {
  it("should remove feat/ prefix", () => {
    expect(sanitizeBranchForPath("feat/add-login")).toBe("add-login");
  });

  it("should remove fix/ prefix", () => {
    expect(sanitizeBranchForPath("fix/null-pointer")).toBe("null-pointer");
  });

  it("should remove feature/ prefix", () => {
    expect(sanitizeBranchForPath("feature/dashboard")).toBe("dashboard");
  });

  it("should remove hotfix/ prefix", () => {
    expect(sanitizeBranchForPath("hotfix/urgent-patch")).toBe("urgent-patch");
  });

  it("should replace remaining slashes with dashes", () => {
    expect(sanitizeBranchForPath("feat/scope/deep/branch")).toBe("scope-deep-branch");
  });

  it("should replace special characters with dashes", () => {
    expect(sanitizeBranchForPath("feat/hello@world#123")).toBe("hello-world-123");
  });

  it("should preserve dots, dashes, and underscores", () => {
    expect(sanitizeBranchForPath("release-1.0_beta")).toBe("release-1.0_beta");
  });

  it("should leave branches without known prefixes unchanged except special chars", () => {
    expect(sanitizeBranchForPath("main")).toBe("main");
    expect(sanitizeBranchForPath("develop")).toBe("develop");
  });

  it("should handle branch with only prefix", () => {
    // "feat/" -> prefix removed leaves "", no further changes
    expect(sanitizeBranchForPath("feat/")).toBe("");
  });
});

describe("defaultWorktreePath", () => {
  it("should compute sibling path with sanitized branch name", () => {
    // Arrange
    const repoRoot = path.join("/repos", "my-project");

    // Act
    const result = defaultWorktreePath(repoRoot, "feat/new-feature");

    // Assert
    expect(result).toBe(path.resolve("/repos", "my-project-new-feature"));
  });

  it("should handle branches without prefixes", () => {
    const repoRoot = path.join("/repos", "app");
    const result = defaultWorktreePath(repoRoot, "develop");
    expect(result).toBe(path.resolve("/repos", "app-develop"));
  });

  it("should sanitize special characters in the branch", () => {
    const repoRoot = path.join("/repos", "app");
    const result = defaultWorktreePath(repoRoot, "fix/issue#42");
    expect(result).toBe(path.resolve("/repos", "app-issue-42"));
  });
});

describe("detectPackageManager", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should detect pnpm when pnpm-lock.yaml exists", () => {
    tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "pnpm-lock.yaml"), "");

    const result = detectPackageManager(tmpDir);

    expect(result).toEqual({ lockfile: "pnpm-lock.yaml", command: "pnpm install" });
  });

  it("should detect bun when bun.lockb exists", () => {
    tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "bun.lockb"), "");

    const result = detectPackageManager(tmpDir);

    expect(result).toEqual({ lockfile: "bun.lockb", command: "bun install" });
  });

  it("should detect yarn when yarn.lock exists", () => {
    tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "yarn.lock"), "");

    const result = detectPackageManager(tmpDir);

    expect(result).toEqual({ lockfile: "yarn.lock", command: "yarn install" });
  });

  it("should detect npm when package-lock.json exists", () => {
    tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "package-lock.json"), "{}");

    const result = detectPackageManager(tmpDir);

    expect(result).toEqual({ lockfile: "package-lock.json", command: "npm install" });
  });

  it("should fall back to npm when only package.json exists", () => {
    tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "package.json"), "{}");

    const result = detectPackageManager(tmpDir);

    expect(result).toEqual({ lockfile: "package.json", command: "npm install" });
  });

  it("should return null when no lockfile or package.json exists", () => {
    tmpDir = makeTmpDir();

    const result = detectPackageManager(tmpDir);

    expect(result).toBeNull();
  });

  it("should prefer pnpm over npm when both lockfiles exist", () => {
    tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "pnpm-lock.yaml"), "");
    fs.writeFileSync(path.join(tmpDir, "package-lock.json"), "{}");

    const result = detectPackageManager(tmpDir);

    expect(result).toEqual({ lockfile: "pnpm-lock.yaml", command: "pnpm install" });
  });
});

describe("findMainArcaneInstall", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should return true when arcane-manifest.json exists", () => {
    tmpDir = makeTmpDir();
    const claudeDir = path.join(tmpDir, ".claude");
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, "arcane-manifest.json"), "{}");

    expect(findMainArcaneInstall(tmpDir)).toBe(true);
  });

  it("should return false when .claude directory does not exist", () => {
    tmpDir = makeTmpDir();

    expect(findMainArcaneInstall(tmpDir)).toBe(false);
  });

  it("should return false when .claude exists but manifest is missing", () => {
    tmpDir = makeTmpDir();
    fs.mkdirSync(path.join(tmpDir, ".claude"), { recursive: true });

    expect(findMainArcaneInstall(tmpDir)).toBe(false);
  });
});

describe("linkOrCopyDir", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should copy directory contents in copy mode", () => {
    tmpDir = makeTmpDir();
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");

    fs.mkdirSync(path.join(src, "sub"), { recursive: true });
    fs.writeFileSync(path.join(src, "file.txt"), "hello");
    fs.writeFileSync(path.join(src, "sub", "nested.txt"), "world");

    const result = linkOrCopyDir(src, dest, "copy");

    expect(result).toBe("copied");
    expect(fs.readFileSync(path.join(dest, "file.txt"), "utf-8")).toBe("hello");
    expect(fs.readFileSync(path.join(dest, "sub", "nested.txt"), "utf-8")).toBe("world");
  });

  it("should return 'copied' in copy mode", () => {
    tmpDir = makeTmpDir();
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");

    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, "a.txt"), "data");

    const result = linkOrCopyDir(src, dest, "copy");

    expect(result).toBe("copied");
  });

  it("should create a symlink/junction in symlink mode", () => {
    tmpDir = makeTmpDir();
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");

    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, "a.txt"), "linked-data");

    const result = linkOrCopyDir(src, dest, "symlink");

    expect(result).toBe("linked");
    expect(fs.readFileSync(path.join(dest, "a.txt"), "utf-8")).toBe("linked-data");
    expect(isSymlinkOrJunction(dest)).toBe(true);
  });

  it("should create parent directories for dest when using symlink mode", () => {
    tmpDir = makeTmpDir();
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "nested", "deep", "dest");

    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, "file.txt"), "content");

    const result = linkOrCopyDir(src, dest, "symlink");

    expect(result).toBe("linked");
    expect(fs.existsSync(path.join(dest, "file.txt"))).toBe(true);
  });
});

describe("isSymlinkOrJunction", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should return true for a junction/symlink", () => {
    tmpDir = makeTmpDir();
    const target = path.join(tmpDir, "target");
    const link = path.join(tmpDir, "link");
    fs.mkdirSync(target);
    fs.symlinkSync(target, link, "junction");

    expect(isSymlinkOrJunction(link)).toBe(true);
  });

  it("should return false for a regular directory", () => {
    tmpDir = makeTmpDir();
    const dir = path.join(tmpDir, "regular");
    fs.mkdirSync(dir);

    expect(isSymlinkOrJunction(dir)).toBe(false);
  });

  it("should return false for a non-existent path", () => {
    expect(isSymlinkOrJunction("/nonexistent/path/xyz-abc-123")).toBe(false);
  });
});

describe("getWorktreeInfo", { timeout: 15000 }, () => {
  it("should return non-null info for the current git repo", () => {
    // The test is running inside a git repo
    const repoRoot = path.resolve(__dirname, "..", "..");

    const info = getWorktreeInfo(repoRoot);

    expect(info).not.toBeNull();
    expect(info!.mainWorktreePath).toBeTruthy();
    expect(typeof info!.currentBranch).toBe("string");
    expect(info!.worktreeId).toBeTruthy();
    expect(Array.isArray(info!.allWorktrees)).toBe(true);
    expect(info!.allWorktrees.length).toBeGreaterThanOrEqual(1);
  });

  it("should return null for a non-git directory", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-worktree-test-"));
    try {
      const info = getWorktreeInfo(tmpDir);
      expect(info).toBeNull();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("should report isWorktree as false for the main worktree", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");

    const info = getWorktreeInfo(repoRoot);

    // The test repo itself is the main worktree, not a linked one
    expect(info).not.toBeNull();
    expect(info!.isWorktree).toBe(false);
  });

  it("should include at least one entry in allWorktrees with isMain true", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");

    const info = getWorktreeInfo(repoRoot);

    expect(info).not.toBeNull();
    const mainEntry = info!.allWorktrees.find((w) => w.isMain);
    expect(mainEntry).toBeDefined();
    expect(mainEntry!.isMain).toBe(true);
  });
});
