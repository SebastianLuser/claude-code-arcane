"""
Specs for content-humanizer's humanize.py and detect.py, in English and Spanish.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "content-humanizer" / "scripts"))

import detect  # noqa: E402
from humanize import detect_lang, humanize, load_lexicon  # noqa: E402

EN = ("In today's fast-paced world, it's important to note that AI is crucial. "
      "We built a robust platform — see https://example.com/robust-docs for details.")
ES = ("En el mundo actual, es importante destacar que la IA es fundamental. "
      "Construimos una solución robusta​ para el equipo. ¿Qué opinan?")


class DetectLangTest(unittest.TestCase):
    def test_english(self):
        self.assertEqual(detect_lang(EN), "en")

    def test_spanish(self):
        self.assertEqual(detect_lang(ES), "es")


class HumanizeTest(unittest.TestCase):
    def test_english_lexicon_and_typography(self):
        clean, report = humanize(EN, load_lexicon("en"))
        self.assertNotIn("—", clean)
        self.assertIn("solid platform", clean)
        self.assertNotIn("important to note", clean)
        self.assertTrue(clean.startswith("Right now, AI is important."))

    def test_urls_are_untouched(self):
        clean, _ = humanize(EN, load_lexicon("en"))
        self.assertIn("https://example.com/robust-docs", clean)

    def test_spanish_keeps_agreement_and_strips_invisible(self):
        clean, report = humanize(ES, load_lexicon("es"))
        self.assertIn("solución sólida", clean)
        self.assertNotIn("​", clean)
        self.assertTrue(clean.startswith("Hoy, la IA es fundamental."))

    def test_null_replacement_is_flagged_not_replaced(self):
        clean, report = humanize(ES, load_lexicon("es"))
        self.assertIn("fundamental", clean)
        flagged = [h for h in report["lexical"] if h["find"] == "fundamental"]
        self.assertEqual(flagged[0]["replace"], "(rewrite by hand)")

    def test_spanish_engagement_bait_is_a_structure(self):
        _, report = humanize(ES, load_lexicon("es"))
        self.assertIn("Reflex engagement bait", [s["name"] for s in report["structures"]])


class DetectTest(unittest.TestCase):
    def test_humanizing_raises_the_score(self):
        lex = load_lexicon("en")
        clean, _ = humanize(EN, lex)
        _, before, _ = detect.run(EN, lex)
        _, after, _ = detect.run(clean, lex)
        self.assertGreater(after, before)

    def test_spanish_pronouns_include_accented_forms(self):
        import re
        found = re.findall(load_lexicon("es")["voice"]["pronouns"], "Para mí y para ti, no.", re.IGNORECASE)
        self.assertEqual(found, ["mí", "ti"])

    def test_spanish_voice_runs_without_contractions(self):
        results, overall, verdict = detect.run(ES * 3, load_lexicon("es"))
        self.assertNotIn("contractions", results["VOICE"][1])
        self.assertIn(verdict, ("PASS", "REVIEW", "FLAGGED"))


if __name__ == "__main__":
    unittest.main()
