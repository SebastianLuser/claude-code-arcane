"""
Specs for linkedin-carousel's carousel_pdf.py.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "skills" / "linkedin-carousel" / "scripts" / "carousel_pdf.py"
sys.path.insert(0, str(SCRIPT.parent))

import carousel_pdf  # noqa: E402

SLIDES = """<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 1080px 1350px; margin: 0 }
body { margin: 0; font: 40px sans-serif }
section { width: 1080px; height: 1350px; box-sizing: border-box; padding: 96px;
          page-break-after: always; overflow: %s }
</style></head><body>
<section><h1>Cover</h1></section><section>%s</section><section><p>Three</p></section>
</body></html>"""


def fake_pdf(pages):
    return b"%PDF-1.4\n<< /Type /Pages /Count 2 >>\n" + b"<< /Type /Page >>\n" * pages


class CheckTest(unittest.TestCase):
    def test_pages_tree_is_not_a_page(self):
        self.assertEqual(carousel_pdf.count_pages(fake_pdf(3)), 3)

    def test_one_page_per_slide_passes(self):
        self.assertEqual(carousel_pdf.check(3, fake_pdf(3)), (3, []))

    def test_overflowing_slide_is_reported(self):
        _, problems = carousel_pdf.check(3, fake_pdf(5))
        self.assertIn("overflows", problems[0])

    def test_linkedin_page_limit(self):
        _, problems = carousel_pdf.check(301, fake_pdf(301))
        self.assertIn("up to 300", problems[0])

    def test_counts_sections(self):
        self.assertEqual(carousel_pdf.count_slides(SLIDES % ("hidden", "x")), 3)


@unittest.skipUnless(carousel_pdf.find_browser(), "needs Chrome or Edge")
class PrintTest(unittest.TestCase):
    def run_script(self, overflow, body):
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / "slides.html"
            src.write_text(SLIDES % (overflow, body), encoding="utf-8")
            return subprocess.run([sys.executable, str(SCRIPT), str(src), str(Path(tmp) / "c.pdf")],
                                  capture_output=True, text=True)

    def test_three_slides_print_three_pages(self):
        r = self.run_script("hidden", "<p>Two</p>")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("3 pages", r.stdout)

    def test_overflow_fails(self):
        r = self.run_script("visible; height: auto; min-height: 1350px", "<p>line</p>" * 40)
        self.assertEqual(r.returncode, 1)
        self.assertIn("[WARN]", r.stdout)


if __name__ == "__main__":
    unittest.main()
