"""
Specs for skills/xlsx-generator/scripts/xlsx_unpack.py: it must never delete a folder
that is not an earlier unpack, and pretty-printing must not change cell text.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import importlib.util
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "skills" / "xlsx-generator" / "scripts" / "xlsx_unpack.py"
spec = importlib.util.spec_from_file_location("xlsx_unpack", SCRIPT)
xlsx_unpack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(xlsx_unpack)


def make_xlsx(path):
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml", "<Types/>")
        z.writestr("xl/sharedStrings.xml", '<sst><si><t xml:space="preserve">a\n\nb</t></si></sst>')


def run(*args):
    return subprocess.run([sys.executable, "-I", "-X", "utf8", str(SCRIPT), *map(str, args)],
                          capture_output=True, text=True, encoding="utf-8", timeout=60)


class XlsxUnpackTest(unittest.TestCase):
    def test_refuses_a_folder_that_is_not_an_earlier_unpack(self):
        with tempfile.TemporaryDirectory() as tmp:
            book = Path(tmp) / "book.xlsx"
            make_xlsx(book)
            project = Path(tmp) / "project"
            project.mkdir()
            (project / "main.py").write_text("keep me", encoding="utf-8")

            result = run(book, project)

            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((project / "main.py").read_text(encoding="utf-8"), "keep me")

    def test_replaces_an_earlier_unpack(self):
        with tempfile.TemporaryDirectory() as tmp:
            book = Path(tmp) / "book.xlsx"
            make_xlsx(book)
            out = Path(tmp) / "out"

            self.assertEqual(run(book, out).returncode, 0)
            self.assertEqual(run(book, out).returncode, 0)
            self.assertTrue((out / "[Content_Types].xml").is_file())

    def test_pretty_print_keeps_blank_lines_inside_cell_text(self):
        xml = b'<sst><si><t xml:space="preserve">a\n\nb</t></si></sst>'

        pretty = xlsx_unpack.pretty_print_xml(xml)

        self.assertIn("a\n\nb", pretty)
        self.assertNotIn("\n\n<", pretty)


if __name__ == "__main__":
    unittest.main()
