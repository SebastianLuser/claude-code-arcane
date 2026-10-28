"""
Spec for skills/git-worktree-manager/scripts/worktree_cleanup.py: a worktree whose
folder was deleted (git lists it as prunable) must not crash the report.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "skills" / "git-worktree-manager" / "scripts" / "worktree_cleanup.py"


def git(*args, cwd):
    subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], cwd=cwd, check=True, timeout=60, stdin=subprocess.DEVNULL,
                   capture_output=True)


class WorktreeCleanupTest(unittest.TestCase):
    def test_a_deleted_worktree_folder_is_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Arrange
            repo = Path(tmp) / "repo"
            repo.mkdir()
            git("init", "-q", "-b", "main", cwd=repo)
            git("commit", "-q", "--allow-empty", "-m", "init", cwd=repo)
            git("worktree", "add", "-q", str(Path(tmp) / "gone"), "-b", "gone", cwd=repo)
            shutil.rmtree(Path(tmp) / "gone")

            # Act
            result = subprocess.run([sys.executable, "-I", "-X", "utf8", str(SCRIPT), "--repo", str(repo),
                                     "--base-branch", "main"], capture_output=True, text=True, encoding="utf-8", timeout=60)

            # Assert
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("branch=main", result.stdout)
            self.assertNotIn("gone", result.stdout)


if __name__ == "__main__":
    unittest.main()
