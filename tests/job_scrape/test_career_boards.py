"""
Specs for skills/job-scrape/scripts/career_boards.py - parsers and filters only, no network.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import subprocess
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "skills" / "job-scrape" / "scripts" / "career_boards.py"


class CareerBoardsTest(unittest.TestCase):
    def test_selftest_passes(self):
        result = subprocess.run([sys.executable, str(SCRIPT), "selftest"],
                                capture_output=True, text=True, encoding="utf-8", timeout=60)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("selftest OK", result.stdout)

    def test_manual_lists_the_example_companies_with_their_links(self):
        result = subprocess.run([sys.executable, str(SCRIPT), "--companies",
                                 str(SCRIPT.with_name("target_companies.example.json")), "manual"],
                                capture_output=True, text=True, encoding="utf-8", timeout=60)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("https://", result.stdout)


if __name__ == "__main__":
    unittest.main()
