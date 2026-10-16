"""Specs for the session hooks: worktree-stop.sh, session-start.sh and session-stop.sh, run in real git repos."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

HOOKS = Path(__file__).resolve().parents[2] / "hooks"
BASH = shutil.which("bash")


def git(cwd: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-c", "user.email=t@t", "-c", "user.name=t", *args],
        cwd=cwd, capture_output=True, text=True, check=True,
    ).stdout.strip()


def run_hook(script: str, cwd: Path, payload: dict | None = None, project: Path | None = None) -> str:
    env = dict(os.environ)
    if project is not None:
        env["CLAUDE_PROJECT_DIR"] = git(project, "rev-parse", "--show-toplevel")
    result = subprocess.run(
        [BASH, str(HOOKS / script)], cwd=cwd, input=json.dumps(payload or {}),
        capture_output=True, text=True, env=env,
    )
    assert result.returncode == 0, result.stderr
    return result.stdout


@unittest.skipUnless(BASH and shutil.which("git"), "needs bash and git")
class HookTestCase(unittest.TestCase):
    def setUp(self):
        self.project = Path(tempfile.mkdtemp(prefix="arcane hooks "))  # a space, like real paths
        git(self.project, "init", "-q")
        (self.project / "README.md").write_text("x\n")
        git(self.project, "add", ".")
        git(self.project, "commit", "-qm", "init")

    def add_worktree(self, name: str) -> Path:
        path = self.project / ".claude" / "worktrees" / name
        git(self.project, "worktree", "add", "-q", "-b", f"wt-{name}", str(path))
        return path


class WorktreeStop(HookTestCase):
    def test_blocks_once_in_a_clean_worktree_the_session_entered(self):
        worktree = self.add_worktree("feat")
        out = run_hook("worktree-stop.sh", worktree, {"stop_hook_active": False}, project=self.project)
        decision = json.loads(out)
        self.assertEqual(decision["decision"], "block")
        self.assertIn("ExitWorktree", decision["reason"])
        self.assertIn("wt-feat", decision["reason"])
        # Same commit, next turn: already asked.
        self.assertEqual(run_hook("worktree-stop.sh", worktree, {}, project=self.project), "")

    def test_asks_again_after_a_new_commit(self):
        worktree = self.add_worktree("feat")
        run_hook("worktree-stop.sh", worktree, {}, project=self.project)
        (worktree / "a.txt").write_text("a\n")
        git(worktree, "add", ".")
        git(worktree, "commit", "-qm", "more")
        self.assertIn("block", run_hook("worktree-stop.sh", worktree, {}, project=self.project))

    def test_silent_while_work_is_uncommitted(self):
        worktree = self.add_worktree("feat")
        (worktree / "wip.txt").write_text("wip\n")
        self.assertEqual(run_hook("worktree-stop.sh", worktree, {}, project=self.project), "")

    def test_silent_on_the_second_stop_of_a_turn(self):
        worktree = self.add_worktree("feat")
        self.assertEqual(run_hook("worktree-stop.sh", worktree, {"stop_hook_active": True}, project=self.project), "")

    def test_silent_in_the_main_checkout(self):
        self.assertEqual(run_hook("worktree-stop.sh", self.project, {}, project=self.project), "")

    def test_silent_when_the_session_started_inside_the_worktree(self):
        worktree = self.add_worktree("feat")
        self.assertEqual(run_hook("worktree-stop.sh", worktree, {}, project=worktree), "")

    def test_marker_stays_out_of_git(self):
        worktree = self.add_worktree("feat")
        run_hook("worktree-stop.sh", worktree, {}, project=self.project)
        self.assertEqual(git(self.project, "status", "--porcelain", "--untracked-files=all", ".claude/session-state"), "")


class SessionStart(HookTestCase):
    def test_creates_no_state_folder_in_a_plain_repo(self):
        run_hook("session-start.sh", self.project)
        self.assertFalse((self.project / ".claude" / "session-state").exists())
        self.assertFalse((self.project / "production").exists())

    def test_moves_a_legacy_active_md_and_shows_it(self):
        legacy = self.project / "production" / "session-state"
        legacy.mkdir(parents=True)
        (legacy / "active.md").write_text("# Goal: ship the login\n")
        out = run_hook("session-start.sh", self.project)
        state = self.project / ".claude" / "session-state"
        self.assertTrue((state / "active.md").exists())
        self.assertFalse((legacy / "active.md").exists())
        self.assertIn("ship the login", out)
        self.assertEqual((state / ".gitignore").read_text().strip(), "*")

    def test_tells_a_session_started_in_a_worktree_where_it_is(self):
        worktree = self.add_worktree("feat")
        out = run_hook("session-start.sh", worktree)
        self.assertIn("Worktree:", out)
        self.assertIn("wt-feat", out)


class SessionStop(HookTestCase):
    def test_ignores_a_state_folder_claude_just_created(self):
        state = self.project / ".claude" / "session-state"
        state.mkdir(parents=True)
        (state / "active.md").write_text("goal\n")
        run_hook("session-stop.sh", self.project)
        self.assertEqual(git(self.project, "status", "--porcelain", "--untracked-files=all"), "")


if __name__ == "__main__":
    unittest.main()
