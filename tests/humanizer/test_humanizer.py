"""
Specs for content-humanizer's humanize.py and detect.py.

Language knowledge lives in the slop.<lang>.json packs, and so does each pack's
spec under "examples": every test that needs a language iterates the packs, so
a new pack is tested with no new test code.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = REPO_ROOT / "skills" / "content-humanizer" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import detect  # noqa: E402
from humanize import LANGS, UNKNOWN, detect_lang, humanize, load_lexicon  # noqa: E402

PACKS = {lang: load_lexicon(lang) for lang in LANGS}
DRAFT = ("In today's fast-paced world, it's important to note that AI is crucial. "
         "We built a robust platform \u2014 see https://example.com/robust-docs for details.")
# Portuguese, a language with no pack. Before detection had a threshold it was
# read as Spanish and the Spanish lexicon rewrote its words. Escapes keep accented
# words out of this file; the zero-width space and the em dash show that the
# language-neutral passes still run.
PT = ("A intelig\u00eancia artificial \u00e9 crucial no nosso trabalho\u200b. Constru\u00edmos uma "
      "plataforma robusta \u2014 vamos revolucionar a educa\u00e7\u00e3o com um paradigma novo.")
PT_WORDS = ("crucial", "robusta", "revolucionar", "paradigma")


def run_script(name, *args, text):
    """Run a script the way a user does, under python -I, on `text` saved to a file."""
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as fh:
        fh.write(text)
    try:
        env = dict(os.environ, PYTHONUTF8="1")
        return subprocess.run([sys.executable, "-I", str(SCRIPTS / name), fh.name, *args],
                              capture_output=True, text=True, env=env, cwd=tempfile.gettempdir())
    finally:
        os.unlink(fh.name)


class PackShapeTest(unittest.TestCase):
    def test_languages_are_the_pack_files(self):
        files = sorted(p.name[len("slop."):-len(".json")] for p in SCRIPTS.glob("slop.*.json"))
        self.assertTrue(files)
        self.assertEqual(list(LANGS), files)

    def test_every_pack_carries_stopwords_and_examples(self):
        for lang, pack in PACKS.items():
            with self.subTest(lang=lang):
                self.assertTrue(pack["stopwords"])
                self.assertTrue(pack["examples"]["rewrite"])
                self.assertTrue(pack["examples"]["keep"])


class DetectLangTest(unittest.TestCase):
    def test_every_example_is_detected_as_its_pack(self):
        for lang, pack in PACKS.items():
            examples = pack["examples"]
            for text in [e["text"] for e in examples["rewrite"]] + examples["keep"]:
                with self.subTest(lang=lang, text=text):
                    self.assertEqual(detect_lang(text), lang)

    def test_a_language_without_a_pack_is_unknown(self):
        self.assertEqual(detect_lang(PT), UNKNOWN)

    def test_text_without_words_is_unknown(self):
        self.assertEqual(detect_lang("42 - https://example.com/docs"), UNKNOWN)


class HumanizeTest(unittest.TestCase):
    def test_rewrite_examples(self):
        for lang, pack in PACKS.items():
            for example in pack["examples"]["rewrite"]:
                with self.subTest(lang=lang, text=example["text"]):
                    clean, report = humanize(example["text"], pack)
                    self.assertEqual(clean, example["clean"] + "\n")
                    # Flagged, not replaced: lexicon entries with "replace": null, and structures.
                    flagged = {h["find"] for h in report["lexical"] if h["replace"] == "(rewrite by hand)"}
                    flagged |= {s["name"] for s in report["structures"]}
                    self.assertEqual(sorted(flagged), example["flags"])

    def test_keep_examples_are_left_alone(self):
        for lang, pack in PACKS.items():
            for text in pack["examples"]["keep"]:
                with self.subTest(lang=lang, text=text):
                    clean, report = humanize(text, pack)
                    self.assertEqual(report["lexical"], [])
                    self.assertEqual(clean, text + "\n")

    def test_urls_are_untouched(self):
        clean, _ = humanize(DRAFT, PACKS["en"])
        self.assertIn("https://example.com/robust-docs", clean)


class UnknownLanguageTest(unittest.TestCase):
    def test_some_pack_would_have_rewritten_the_text(self):
        # What makes the next test mean something: a pack's lexicon does match these words.
        self.assertTrue(any(humanize(PT, pack)[1]["lexical"] for pack in PACKS.values()))

    def test_unknown_applies_no_lexicon_and_keeps_the_words(self):
        clean, report = humanize(PT, load_lexicon(UNKNOWN))
        self.assertEqual(report["lexical"], [])
        for word in PT_WORDS:
            self.assertIn(word, clean)
        self.assertNotIn("\u200b", clean)
        self.assertNotIn("\u2014", clean)

    def test_cli_reports_unknown_and_says_so(self):
        r = run_script("humanize.py", "--json", text=PT)
        out = json.loads(r.stdout)
        self.assertEqual(out["lang"], UNKNOWN)
        for word in PT_WORDS:
            self.assertIn(word, out["text"])
        self.assertIn("no lexicon applied", r.stderr)

    def test_detect_does_not_judge_vocabulary_or_voice(self):
        results, _, _ = detect.run(PT * 3, load_lexicon(UNKNOWN))
        self.assertEqual(results["SLOP DENSITY"][0], 50.0)
        self.assertEqual(results["VOICE"][0], 50.0)


class DetectTest(unittest.TestCase):
    def test_humanizing_raises_the_score(self):
        for lang, pack in PACKS.items():
            for example in pack["examples"]["rewrite"]:
                with self.subTest(lang=lang, text=example["text"]):
                    _, before, _ = detect.run(example["text"], pack)
                    _, after, _ = detect.run(example["clean"], pack)
                    self.assertGreater(after, before)

    def test_pronoun_examples(self):
        for lang, pack in PACKS.items():
            example = pack["examples"]["pronouns"]
            with self.subTest(lang=lang):
                found = re.findall(pack["voice"]["pronouns"], example["text"], re.IGNORECASE)
                self.assertEqual(found, example["found"])

    def test_voice_counts_contractions_only_when_the_pack_has_them(self):
        for lang, pack in PACKS.items():
            with self.subTest(lang=lang):
                results, _, verdict = detect.run(pack["examples"]["rewrite"][0]["text"] * 3, pack)
                self.assertEqual("contractions" in results["VOICE"][1], bool(pack["voice"]["contractions"]))
                self.assertIn(verdict, ("PASS", "REVIEW", "FLAGGED"))


class IsolatedModeTest(unittest.TestCase):
    def test_detect_runs_under_python_isolated_mode(self):
        # -I drops the script's folder from sys.path; detect.py imports humanize.py from it.
        r = run_script("detect.py", "--json", text=DRAFT)
        self.assertNotIn("ModuleNotFoundError", r.stderr)
        self.assertIn("human_score", r.stdout)


if __name__ == "__main__":
    unittest.main()
