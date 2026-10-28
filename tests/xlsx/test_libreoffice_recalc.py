"""
Specs for skills/xlsx-generator/scripts/libreoffice_recalc.py with a fake soffice: success
needs a file LibreOffice actually wrote, not the copy of the input.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[2] / "skills" / "xlsx-generator" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import libreoffice_recalc  # noqa: E402

# Writes "<outdir>/<stem>.xlsx" only when WRITE is set, like soffice --convert-to.
FAKE = """import os, sys
args = sys.argv[1:]
if args[0] == "--version":
    print("LibreOffice 0.0"); sys.exit(0)
out_dir, src = args[args.index("--outdir") + 1], args[-1]
if os.environ.get("WRITE"):
    stem = os.path.splitext(os.path.basename(src))[0]
    open(os.path.join(out_dir, stem + ".xlsx"), "wb").write(b"recalculated")
"""


def fake_soffice(folder):
    script = Path(folder) / "soffice.py"
    script.write_text(FAKE, encoding="utf-8")
    if sys.platform == "win32":
        launcher = Path(folder) / "soffice.cmd"
        launcher.write_text(f'@"{sys.executable}" "{script}" %*\n', encoding="utf-8")
    else:
        launcher = Path(folder) / "soffice"
        launcher.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{script}" "$@"\n', encoding="utf-8")
        launcher.chmod(0o755)
    return str(launcher)


class RecalcTest(unittest.TestCase):
    def run_recalc(self, write):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        src, out = Path(tmp.name) / "book.xlsx", Path(tmp.name) / "result.xlsx"
        src.write_bytes(b"original")
        env = {"WRITE": "1"} if write else {}
        with mock.patch.object(libreoffice_recalc, "find_soffice", return_value=fake_soffice(tmp.name)), \
                mock.patch.dict("os.environ", env):
            ok, message = libreoffice_recalc.recalculate(str(src), str(out))
        return ok, message, out

    def test_exit_zero_without_output_is_a_failure(self):
        ok, message, out = self.run_recalc(write=False)

        self.assertFalse(ok, message)
        self.assertFalse(out.exists())

    def test_the_written_file_is_the_result(self):
        ok, _, out = self.run_recalc(write=True)

        self.assertTrue(ok)
        self.assertEqual(out.read_bytes(), b"recalculated")


if __name__ == "__main__":
    unittest.main()
