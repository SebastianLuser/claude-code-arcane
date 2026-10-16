# Git Worktree Rule

A session can run inside a git worktree: a second checkout of the same repository, usually under `.claude/worktrees/`. You are in one when `git rev-parse --git-dir` and `git rev-parse --git-common-dir` print different paths.

## Decide by the branch the action is about

| The action is about | Where to run it |
|---|---|
| The worktree's own branch: commit, push, rebase, merge `main` into it | Inside the worktree. First push: `git push -u origin HEAD` |
| Another branch: `main`, or whatever the main checkout has (checkout, switch, pull, update) | Outside: leave the worktree first |
| Unclear | Ask once |

## Leaving the worktree

The user authorizes you to leave a worktree without asking, in two cases:

1. **The task is done.** Commit the work on the worktree branch, push it if the task included pushing, then call `ExitWorktree` with `action: "keep"`. Tell the user the worktree path and its branch.
2. **You need another branch** (second row of the table). Leave with `ExitWorktree` (`keep`), run the operation, and enter again if the task continues.

Always `keep`. Never `remove` a worktree: deleting worktrees is the user's call.

`ExitWorktree` only acts on a worktree this session entered with `EnterWorktree`. If it does nothing (the session started inside the worktree, or it was made with `git worktree add` or `arcane worktree`), run git against the main checkout instead: `git -C "<main checkout>" pull`. The main checkout is the parent directory of `git rev-parse --git-common-dir`. Tell the user the session itself is still inside the worktree.
