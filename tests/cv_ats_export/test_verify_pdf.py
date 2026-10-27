"""
Specs for skills/cv-ats-export/scripts/verify_pdf.py - no pypdf needed: the text
layer is stubbed, the checks are what is under test.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "skills" / "cv-ats-export" / "scripts"))

import verify_pdf  # noqa: E402


class TestNormalize(unittest.TestCase):
    def test_typographic_punctuation_folds_to_ascii(self):
        self.assertEqual(verify_pdf.normalize_text("O’Brien “Sr” 2019–2024"), "O'Brien \"Sr\" 2019-2024")

    def test_decomposed_accents_fold_to_composed(self):
        self.assertEqual(verify_pdf.normalize_text("José"), "José")


class TestAsciiDates(unittest.TestCase):
    def find(self, text):
        return [dash for _, dash in verify_pdf.find_non_ascii_date_ranges(text)]

    def test_a_year_range_with_an_en_dash_is_caught(self):
        self.assertEqual(self.find("Acme  2019–2024"), ["–"])

    def test_a_year_to_present_with_an_em_dash_is_caught(self):
        self.assertEqual(self.find("Mar 2016 — Presente"), ["—"])

    def test_ascii_ranges_pass(self):
        self.assertEqual(self.find("2019-2024\nMar 2016 - Presente"), [])

    def test_quantities_are_not_dates(self):
        self.assertEqual(self.find("EUR 1500–2000 y 2000–5000 req/s"), [])

    def test_a_season_written_short_is_still_a_date(self):
        self.assertEqual(self.find("Temporada 2019–20"), ["–"])

    def test_a_dash_opening_the_next_line_does_not_join_the_year(self):
        self.assertEqual(self.find("Desde 2019\n– un bullet"), [])


class TestVerify(unittest.TestCase):
    def verify(self, raw, **kw):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            path = f.name
        try:
            with mock.patch.object(verify_pdf, "extract_text", return_value=(1, raw)):
                return verify_pdf.verify(path, **kw)
        finally:
            Path(path).unlink()

    def test_contains_matches_through_curly_quotes_and_dashes(self):
        self.assertEqual(self.verify("Jane O’Brien — 2019–2024", contains=["Jane O'Brien", "2019-2024"]), [])

    def test_ascii_dates_is_off_unless_asked(self):
        self.assertEqual(self.verify("Acme 2019–2024"), [])

    def test_ascii_dates_names_the_code_point(self):
        problems = self.verify("Acme 2019–2024", ascii_dates=True)
        self.assertEqual(len(problems), 1)
        self.assertIn("U+2013", problems[0])

    def test_a_missing_file_is_reported_without_reading_it(self):
        self.assertEqual(verify_pdf.verify("no-such.pdf"), ["does not exist: no-such.pdf"])


if __name__ == "__main__":
    unittest.main()
