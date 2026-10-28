import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { WorktreeInfo } from "./types.js";
import { copyDirSync } from "./utils.js";

/** Arguments go to git as-is: a branch or path is never parsed by a shell. */
function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: "pipe" }).trim();
}

export function getWorktreeInfo(target: string): WorktreeInfo | null {
  let toplevel: string;
  try {
    toplevel = path.resolve(git(target, "rev-parse", "--show-toplevel"));
  } catch {
    return null;
  }

  // Both print paths relative to `target`, which may be a subdirectory.
  const resolvedCommon = path.resolve(target, git(target, "rev-parse", "--git-common-dir"));
  const resolvedGit = path.resolve(target, git(target, "rev-parse", "--git-dir"));
  const isWorktree = resolvedCommon !== resolvedGit;

  return {
    isWorktree,
    toplevel,
    mainWorktreePath: isWorktree ? path.resolve(resolvedCommon, "..") : toplevel,
  };
}

export function findMainArcaneInstall(
  mainPath: string,
): boolean {
  return fs.existsSync(
    path.join(mainPath, ".claude", "arcane-manifest.json"),
  );
}

export function linkOrCopyDir(
  src: string,
  dest: string,
  mode: "symlink" | "copy",
): "linked" | "copied" {
  if (mode === "symlink") {
    try {
      const parentDir = path.dirname(dest);
      fs.mkdirSync(parentDir, { recursive: true });
      const type = process.platform === "win32" ? "junction" : "dir";
      fs.symlinkSync(src, dest, type);
      return "linked";
    } catch {
      // fall through to copy
    }
  }

  copyDirSync(src, dest);
  return "copied";
}

export function sanitizeBranchForPath(branch: string): string {
  return branch
    .replace(/^(feat|fix|feature|hotfix)\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function defaultWorktreePath(
  repoRoot: string,
  branch: string,
): string {
  const repoName = path.basename(repoRoot);
  const sanitized = sanitizeBranchForPath(branch);
  return path.resolve(repoRoot, "..", `${repoName}-${sanitized}`);
}

export function createGitWorktree(
  repoRoot: string,
  worktreePath: string,
  branch: string,
  base?: string,
): void {
  const branchExists = checkBranchExists(repoRoot, branch);

  if (branchExists) {
    git(repoRoot, "worktree", "add", worktreePath, branch);
  } else {
    git(repoRoot, "worktree", "add", "-b", branch, worktreePath, base ?? "HEAD");
  }
}

export function checkBranchExists(cwd: string, branch: string): boolean {
  try {
    git(cwd, "show-ref", "--verify", `refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

export function detectPackageManager(
  dir: string,
): { lockfile: string; command: string } | null {
  const managers = [
    { lockfile: "pnpm-lock.yaml", command: "pnpm install" },
    { lockfile: "bun.lock", command: "bun install" },
    { lockfile: "bun.lockb", command: "bun install" },
    { lockfile: "yarn.lock", command: "yarn install" },
    { lockfile: "package-lock.json", command: "npm install" },
  ];
  for (const m of managers) {
    if (fs.existsSync(path.join(dir, m.lockfile))) return m;
  }
  if (fs.existsSync(path.join(dir, "package.json"))) {
    return { lockfile: "package.json", command: "npm install" };
  }
  return null;
}
