"""
Guards the update notice against firing on installs that are already current.

The remote content identity is a commit SHA, so a local version can only be
compared against it when it is SHA-shaped. Every `npx claude-code-arcane install`
is a bundled install and records a semver instead, and "2.9.6" never equals a
SHA — so without a shape guard the check says "update available" on every single
run no matter how current the install is.

`isContentUpdateAvailable()` in src/update-check.ts got that guard. Its bash twin
in hooks/check-update.sh did not, and the hook is the copy that actually runs in
a user's project: SessionStart, every session, pointing at `arcane update` —
a command npx users do not have on PATH. Two implementations of one rule drift
silently, so the rule is asserted in both places here.

Runs the shipped regex rather than a copy of it: a test that restates the pattern
passes while the hook rots.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import re
import shutil
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HOOK = REPO_ROOT / "hooks" / "check-update.sh"
CLI = REPO_ROOT / "src" / "update-check.ts"

# A commit SHA abbreviated anywhere from 7 to 40 hex chars.
SHA_SHAPE = r"\[0-9a-f\]\{7,40\}"


def hook_guard_pattern():
    """The SHA-shape regex as it is actually written in the hook."""
    match = re.search(
        r"""grep\s+-qiE\s+'(\^\[0-9a-f\]\{7,40\}\$)'""",
        HOOK.read_text(encoding="utf-8"),
    )
    return match.group(1) if match else None


class UpdateNoticeParity(unittest.TestCase):
    def test_cli_guards_on_sha_shape(self):
        source = CLI.read_text(encoding="utf-8")
        self.assertRegex(
            source,
            SHA_SHAPE,
            "src/update-check.ts no longer declares a SHA-shape pattern; the hook "
            "guard below is now asserting parity with nothing.",
        )

    def test_hook_guards_on_sha_shape(self):
        self.assertIsNotNone(
            hook_guard_pattern(),
            "hooks/check-update.sh compares source_version to the remote SHA without "
            "checking it is SHA-shaped. A semver install then reports an update on "
            "every session. Mirror SHA_PATTERN from src/update-check.ts.",
        )

    def test_hook_guard_rejects_a_semver_and_accepts_a_sha(self):
        pattern = hook_guard_pattern()
        self.assertIsNotNone(pattern, "no guard to exercise; see the test above")

        bash = shutil.which("bash")
        if bash is None:
            self.skipTest("bash not available")

        cases = {
            # local_version         is it SHA-shaped?
            "2.9.6": False,  # bundled install: the bug
            "unknown": False,  # no manifest
            "": False,  # unreadable manifest
            "1316906bd41f": True,
            "1316906": True,
        }

        for version, expected in cases.items():
            with self.subTest(version=version):
                result = subprocess.run(
                    [bash, "-c", f"printf '%s' \"$1\" | grep -qiE '{pattern}'", "_", version],
                    capture_output=True,
                )
                self.assertEqual(
                    result.returncode == 0,
                    expected,
                    f"{version!r}: expected SHA-shaped={expected}",
                )


if __name__ == "__main__":
    unittest.main()
