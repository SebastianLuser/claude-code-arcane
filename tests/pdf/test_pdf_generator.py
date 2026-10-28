"""
Specs for skills/pdf-generator/scripts: user text is escaped before it reaches HTML or
ReportLab markup, and a radio choice is shown on the widget, not only stored in /V.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import contextlib
import importlib.util
import io
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[2] / "skills" / "pdf-generator" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import cover  # noqa: E402

HAS_PDF_LIBS = all(importlib.util.find_spec(p) for p in ("pypdf", "reportlab"))


class CoverTest(unittest.TestCase):
    def test_title_and_author_stay_text(self):
        tokens = {"cover_pattern": "fullbleed", "title": "Why <script> tags", "author": "A & B",
                  "subtitle": "", "date": "", "accent": "#000", "cover_bg": "#fff", "dark": "#000",
                  "muted": "#777", "text_light": "#fff", "page_bg": "#fff", "font_display": "Inter",
                  "font_body": "Inter", "doc_type": "report"}

        page = cover.render(tokens)

        self.assertIn("Why &lt;script&gt; tags", page)
        self.assertNotIn("<script>", page)


@unittest.skipUnless(HAS_PDF_LIBS, "needs pypdf and reportlab")
class ReformatTest(unittest.TestCase):
    def test_inline_markdown_escapes_and_keeps_snake_case(self):
        import reformat_parse

        text = reformat_parse._md_inline("Latency < 200ms for R&D in config_file_path, _really_ fast")

        self.assertEqual(text, "Latency &lt; 200ms for R&amp;D in config_file_path, <i>really</i> fast")


@unittest.skipUnless(HAS_PDF_LIBS, "needs pypdf and reportlab")
class RadioFillTest(unittest.TestCase):
    def test_the_chosen_option_is_the_one_shown(self):
        from pypdf import PdfReader
        from reportlab.pdfgen import canvas

        with tempfile.TemporaryDirectory() as tmp:
            # Arrange
            form, out = Path(tmp) / "form.pdf", Path(tmp) / "out.pdf"
            c = canvas.Canvas(str(form))
            for i, value in enumerate(["red", "blue"]):
                c.acroForm.radio(name="color", value=value, selected=value == "red", x=50 + 60 * i, y=700)
            c.showPage()
            c.save()

            # Act
            subprocess.run([sys.executable, str(SCRIPTS / "fill_write.py"), "--input", str(form), "--out",
                            str(out), "--values", '{"color": "blue"}'], check=True, capture_output=True, timeout=60)

            # Assert
            field = PdfReader(str(out)).trailer["/Root"]["/AcroForm"]["/Fields"][0].get_object()
            shown = {next(iter(set(k.get_object()["/AP"]["/N"]) - {"/Off"})): k.get_object()["/AS"]
                     for k in field["/Kids"]}
            self.assertEqual(field["/V"], "/blue")
            self.assertEqual(shown, {"/red": "/Off", "/blue": "/blue"})


class DependencyCheckTest(unittest.TestCase):
    def test_a_missing_package_is_reported_not_installed(self):
        import _deps

        with contextlib.redirect_stderr(io.StringIO()) as err, self.assertRaises(SystemExit) as stop:
            _deps.require("surely_not_a_real_package_xyz")

        self.assertEqual(stop.exception.code, 2)
        self.assertIn("pip install surely_not_a_real_package_xyz", err.getvalue())


if __name__ == "__main__":
    unittest.main()
