"""
Specs for skills/cv-ats-export/scripts/cv_export.py and linkedin-carousel/scripts/carousel_pdf.py:
a browser that exits 0 without writing must not leave an old PDF reported as fresh.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import contextlib
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILLS = Path(__file__).resolve().parents[2] / "skills"
sys.path.insert(0, str(SKILLS / "cv-ats-export" / "scripts"))

import cv_export  # noqa: E402

CAROUSEL = SKILLS / "linkedin-carousel" / "scripts" / "carousel_pdf.py"


def fake_browser(folder):
    """A 'browser' that exits 0 and writes nothing, like Chrome when the PDF is locked."""
    script = Path(folder) / "browser.py"
    script.write_text("import sys\nsys.exit(0)\n", encoding="utf-8")
    if sys.platform == "win32":
        launcher = Path(folder) / "browser.cmd"
        launcher.write_text(f'@"{sys.executable}" "{script}" %*\n', encoding="utf-8")
    else:
        launcher = Path(folder) / "browser"
        launcher.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{script}" "$@"\n', encoding="utf-8")
        launcher.chmod(0o755)
    return str(launcher)


class StalePdfTest(unittest.TestCase):
    def test_cv_export_fails_when_the_browser_writes_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Arrange
            md = Path(tmp) / "CV - Ana.md"
            md.write_text("# Ana\n\nNEW BULLET\n", encoding="utf-8")
            old = Path(tmp) / "out" / "Ana.pdf"
            old.parent.mkdir()
            old.write_bytes(b"%PDF-1.4 old")

            # Act
            with contextlib.redirect_stdout(io.StringIO()):
                ok = cv_export.export(md, fake_browser(tmp), Path(tmp), old.parent, check_ats=False)

            # Assert
            self.assertFalse(ok)
            self.assertFalse(old.exists())

    def test_carousel_fails_when_the_browser_writes_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Arrange
            src = Path(tmp) / "c.html"
            src.write_text("<section class='slide'>x</section>", encoding="utf-8")
            out = Path(tmp) / "c.pdf"
            out.write_bytes(b"%PDF-1.4 old")
            code = "import sys; import carousel_pdf as c; b = sys.argv.pop(); c.find_browser = lambda: b; c.main()"

            # Act
            result = subprocess.run([sys.executable, "-c", code, str(src), str(out), fake_browser(tmp)],
                                    cwd=CAROUSEL.parent, capture_output=True, text=True, timeout=60)

            # Assert
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("[ERROR] browser exit 0", result.stderr)
            self.assertFalse(out.exists())


if __name__ == "__main__":
    unittest.main()
