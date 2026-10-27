"""
job-scrape and freelance-scan each ship posting_guard.py and its injection.<lang>.json
packs, one copy per profile. If the copies drift, the profile with the stale one
misses the fix or the language, so they must be byte-identical.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ORIGINAL = REPO_ROOT / "skills" / "job-scrape" / "scripts"
COPY = REPO_ROOT / "skills" / "freelance-scan" / "scripts"


def guard_files(folder):
    return sorted(p.name for p in folder.iterdir() if p.name == "posting_guard.py"
                  or (p.name.startswith("injection.") and p.suffix == ".json"))


class PostingGuardCopiesTest(unittest.TestCase):
    def test_both_skills_ship_the_same_files(self):
        self.assertIn("posting_guard.py", guard_files(ORIGINAL))
        self.assertEqual(guard_files(COPY), guard_files(ORIGINAL))

    def test_every_file_is_byte_identical(self):
        for name in guard_files(ORIGINAL):
            with self.subTest(file=name):
                self.assertEqual((COPY / name).read_bytes(), (ORIGINAL / name).read_bytes())


if __name__ == "__main__":
    unittest.main()
