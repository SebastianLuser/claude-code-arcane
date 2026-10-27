"""
Specs for skills/job-scrape/scripts/job_key.py - the seen_jobs.json key as code.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[2] / "skills" / "job-scrape" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import job_key  # noqa: E402


class TestMakeKey(unittest.TestCase):
    def test_company_and_title_slugs_joined_by_a_pipe(self):
        self.assertEqual(job_key.make_key("Acme", "Backend Developer"), "acme|backend-developer")

    def test_accents_and_punctuation_fold_away(self):
        self.assertEqual(job_key.make_key("Café Zürich Ñu", "Naïve Engineering / Data, Sr."), "cafe-zurich-nu|naive-engineering-data-sr")

    def test_legal_suffixes_leave_the_company(self):
        for name in ("Acme Inc.", "Acme LLC", "Acme S.A.", "Acme S.R.L.", "Acme GmbH"):
            self.assertEqual(job_key.company_slug(name), "acme", name)

    def test_a_company_that_is_only_a_suffix_word_keeps_it(self):
        self.assertEqual(job_key.company_slug("Company"), "company")

    def test_internal_dot_survives(self):
        self.assertEqual(job_key.company_slug("CodersLab.io"), "coderslab.io")

    def test_modality_qualifiers_leave_the_title(self):
        # Every pack applies: a qualifier from the Spanish pack too.
        spanish = json.loads((SCRIPTS / "qualifiers.es.json").read_text(encoding="utf-8"))["qualifiers"][0]
        for title in ("Backend Dev (Remote)", "Backend Dev (LATAM)", "Backend Dev ({0} - LATAM)".format(spanish.title())):
            self.assertEqual(job_key.title_slug(title), "backend-dev", title)

    def test_a_meaningful_parenthesis_stays(self):
        self.assertEqual(job_key.title_slug("Cyber Analyst (OT/IoT)"), "cyber-analyst-ot-iot")

    def test_a_long_title_gets_the_same_key_every_run_and_never_collides(self):
        base = "Senior Staff Platform Engineer Distributed Systems Observability and Reliability "
        one, two = job_key.title_slug(base + "Team A"), job_key.title_slug(base + "Team B")
        self.assertEqual(one, job_key.title_slug(base + "Team A"))
        self.assertNotEqual(one, two)
        self.assertLessEqual(len(one), job_key.TITLE_MAX + 1 + job_key.HASH_LEN)

    def test_a_non_latin_title_keys_on_the_portal_id(self):
        url = "https://www.linkedin.com/jobs/view/4434569000"
        self.assertEqual(job_key.title_slug("Программист 1С", url), "1-4434569000")
        self.assertNotEqual(job_key.title_slug("Аналитик 1С", "https://x/jobs/4434569001"), job_key.title_slug("Программист 1С", url))

    def test_a_non_latin_title_without_id_keys_on_the_url_hash(self):
        one = job_key.title_slug("Инженер", "https://example.com/a")
        self.assertTrue(one.startswith("untitled-"))
        self.assertEqual(one, job_key.title_slug("Инженер (другой)", "https://example.com/a"))

    def test_non_latin_companies_do_not_collide(self):
        self.assertNotEqual(job_key.company_slug("Сбер AI"), job_key.company_slug("Яндекс AI"))

    def test_latin_letters_without_ascii_form_are_not_lossy(self):
        self.assertEqual(job_key.company_slug("Ørsted"), "rsted")

    def test_every_key_is_canonical(self):
        for company, title in (("Acme", "Dev"), ("", ""), ("Сбер", "Инженер"), ("A.B", "C.D (Remote)")):
            self.assertRegex(job_key.make_key(company, title), job_key._CANONICAL, (company, title))


class TestAudit(unittest.TestCase):
    def run_audit(self, jobs):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "seen_jobs.json"
            path.write_text(json.dumps({"schema_version": 2, "updated": "2026-10-27", "jobs": jobs}), encoding="utf-8")
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                code = job_key.audit(path)
        return code, json.loads(out.getvalue())

    @staticmethod
    def entry(company, title, url):
        return {"company": company, "title": title, "status": "new", "sources": [{"source": "linkedin", "url": url}]}

    def test_a_clean_state_passes(self):
        code, report = self.run_audit({"acme|dev": self.entry("Acme", "Dev", "https://x/1")})
        self.assertEqual(code, 0)
        self.assertEqual(report["drifted_keys"], {})

    def test_one_url_under_two_keys_fails(self):
        code, report = self.run_audit({
            "acme|dev": self.entry("Acme", "Dev", "https://x/1"),
            "acme-inc|dev": self.entry("Acme Inc", "Dev", "https://x/1/"),
        })
        self.assertEqual(code, 1)
        self.assertEqual(report["duplicate_urls"], {"https://x/1": ["acme|dev", "acme-inc|dev"]})

    def test_a_key_with_slash_or_spaces_is_malformed(self):
        code, report = self.run_audit({"acme|dev/ops": self.entry("Acme", "Dev/Ops", "https://x/2")})
        self.assertEqual(code, 1)
        self.assertEqual(report["malformed_keys"], ["acme|dev/ops"])

    def test_an_old_key_is_reported_with_its_new_form_but_never_renamed(self):
        code, report = self.run_audit({"acme-inc|dev": self.entry("Acme Inc", "Dev", "https://x/3")})
        self.assertEqual(code, 0)
        self.assertEqual(report["drifted_keys"], {"acme-inc|dev": "acme|dev"})

    def test_an_unreadable_file_exits_1(self):
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(job_key.audit(Path(tempfile.gettempdir()) / "no-such-seen-jobs.json"), 1)

    def test_the_default_state_follows_career_workspace(self):
        with mock.patch.dict(os.environ, {"CAREER_WORKSPACE": "/ws"}):
            self.assertEqual(job_key.default_state(), Path("/ws/tools/job_scraper/seen_jobs.json"))


if __name__ == "__main__":
    unittest.main()
