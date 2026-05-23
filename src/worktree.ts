import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { WorktreeInfo } from "./types.js";
import { copyDirSync } from "./utils.js";

export function getWorktreeInfo(target: string): WorktreeInfo | null {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: target,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    return null;
  }

  const gitCommonDir = execSync("git rev-parse --git-common-dir", {
    cwd: target,
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();

  const gitDir = execSync("git rev-parse --git-dir", {
    cwd: target,
    encoding: "utf-8",
    stdio: "pipe",
  }).trim();

  const resolvedCommon = path.resolve(target, gitCommonDir);
  const resolvedGit = path.resolve(target, gitDir);
  const isWorktree = resolvedCommon !== resolvedGit;

  const mainWorktreePath = isWorktree
    ? path.resolve(resolvedCommon, "..")
    : target;

  let currentBranch = "HEAD";
  try {
    currentBranch = execSync("git branch --show-current", {
      cwd: target,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {}

  const allWorktrees = parseWorktreeList(target);

  return {
    isWorktree,
    mainWorktreePath,
    currentBranch,
    worktreeId: path.basename(target),
    allWorktrees,
  };
}

function parseWorktreeList(
  cwd: string,
): WorktreeInfo["allWorktrees"] {
  try {
    const raw = execSync("git worktree list --porcelain", {
      cwd,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const entries: WorktreeInfo["allWorktrees"] = [];
    let current: { path: string; branch: string; isMain: boolean } | null =
      null;

    for (const line of raw.split("\n")) {
      if (line.startsWith("worktree ")) {
        if (current) entries.push(current);
        current = {
          path: line.slice("worktree ".length),
          branch: "",
          isMain: false,
        };
      } else if (line.startsWith("branch ") && current) {
        current.branch = line
          .slice("branch ".length)
          .replace("refs/heads/", "");
      } else if (line === "" && current) {
        entries.push(current);
        current = null;
      }
    }
    if (current) entries.push(current);

    if (entries.length > 0) entries[0].isMain = true;

    return entries;
  } catch {
    return [];
  }
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

export function isSymlinkOrJunction(p: string): boolean {
  try {
    const stat = fs.lstatSync(p);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
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
    execSync(`git worktree add "${worktreePath}" "${branch}"`, {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } else {
    const baseBranch = base ?? "HEAD";
    execSync(
      `git worktree add -b "${branch}" "${worktreePath}" "${baseBranch}"`,
      {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
  }
}

function checkBranchExists(cwd: string, branch: string): boolean {
  try {
    execSync(`git show-ref --verify refs/heads/${branch}`, {
      cwd,
      encoding: "utf-8",
      stdio: "pipe",
    });
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
