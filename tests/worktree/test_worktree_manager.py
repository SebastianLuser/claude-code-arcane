"""
Spec for skills/git-worktree-manager/scripts/worktree_manager.py: a new worktree never
gets the main checkout's ports, and a rerun keeps its ports and its .env.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "skills" / "git-worktree-manager" / "scripts" / "worktree_manager.py"


def git(*args, cwd):
    subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], cwd=cwd, check=True, timeout=60,
                   stdin=subprocess.DEVNULL, capture_output=True)


def prepare(repo, name):
    result = subprocess.run([sys.executable, "-I", str(SCRIPT), "--repo", str(repo), "--branch", f"wt-{name}",
                             "--name", name, "--format", "json"],
                            capture_output=True, text=True, encoding="utf-8", timeout=60, stdin=subprocess.DEVNULL)
    if result.returncode != 0:
        raise AssertionError(result.stderr)
    return json.loads(result.stdout)


class WorktreeManagerTest(unittest.TestCase):
    def test_ports_skip_the_main_checkout_and_survive_a_rerun(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Arrange
            repo = Path(tmp) / "repo"
            repo.mkdir()
            git("init", "-q", "-b", "main", cwd=repo)
            git("commit", "-q", "--allow-empty", "-m", "init", cwd=repo)
            (repo / ".env").write_text("PORT=3000\n", encoding="utf-8")

            # Act
            first = prepare(repo, "a")
            second = prepare(repo, "b")
            env = Path(first["worktree_path"]) / ".env"
            env.write_text("PORT=3010\n", encoding="utf-8")
            rerun = prepare(repo, "a")

            # Assert
            self.assertEqual(first["ports"], {"app": 3010, "db": 5442, "redis": 6389})
            self.assertEqual(second["ports"]["app"], 3020)
            self.assertEqual(rerun["ports"], first["ports"])
            self.assertFalse(rerun["created"])
            self.assertEqual(env.read_text(encoding="utf-8"), "PORT=3010\n")


if __name__ == "__main__":
    unittest.main()
