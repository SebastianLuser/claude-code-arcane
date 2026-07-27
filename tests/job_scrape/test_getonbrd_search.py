"""
Specs for skills/job-scrape/scripts/getonbrd_search.py - parsers only, no network.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import sys
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "skills" / "job-scrape" / "scripts"))

import getonbrd_search as gob  # noqa: E402

RECORD = {
    "id": "backend-developer-acme-remote-a1b2",
    "links": {
        "public_url": "https://www.getonbrd.com/jobs/programming/backend-developer-acme-remote-a1b2"
    },
    "attributes": {
        "title": "Backend Developer",
        "description": "<p>Own the API.</p><ul><li>Node</li><li>Postgres</li></ul>",
        "functions": "<p>Ship features</p>",
        "desirable": "<p>Go</p>",
        "remote": True,
        "remote_modality": "remote_local",
        "remote_zone": "latam",
        "countries": ["Chile", "Argentina"],
        "min_salary": 2000,
        "max_salary": 2500,
        "published_at": 1767225600,  # 2026-01-01T00:00:00Z
        "applications_count": 12,
        "seniority": {"data": {"attributes": {"name": "Senior"}}},
        "company": {"data": {"attributes": {"name": "Acme"}}},
    },
}

SLUG = "full-stack-developer-buildwithin-remote-b1ef"


class TestSlugFromInput(unittest.TestCase):
    def test_every_url_shape_and_the_bare_slug(self):
        for value in (
            f"https://www.getonbrd.com/jobs/programming/{SLUG}",
            f"https://www.getonbrd.com/jobs/{SLUG}",
            f"https://www.getonbrd.com/jobs/{SLUG}/",
            f"https://www.getonbrd.com/empleos/programacion/{SLUG}?utm_source=x",
            SLUG,
        ):
            with self.subTest(value=value):
                self.assertEqual(gob.slug_from_input(value), SLUG)

    def test_none_for_anything_that_is_not_a_job_reference(self):
        self.assertIsNone(gob.slug_from_input("https://example.com/jobs/whatever"))
        self.assertIsNone(gob.slug_from_input("not a slug!"))


class TestSlugTokens(unittest.TestCase):
    def test_drops_the_trailing_hash_but_keeps_real_words(self):
        self.assertEqual(
            gob.slug_tokens("backend-developer-acme-remote-a1b2"),
            ["backend", "developer", "acme", "remote"],
        )
        self.assertEqual(
            gob.slug_tokens("net-backend-developer-2brains-remote"),
            ["net", "backend", "developer", "2brains", "remote"],
        )


class TestBuildQueries(unittest.TestCase):
    def test_progressively_narrower_queries_without_stopwords(self):
        queries = gob.build_queries(["senior", "developer", "de", "backend", "acme", "remote"])

        self.assertEqual(queries[0], "senior developer de backend acme remote")
        self.assertNotIn(" de ", queries[1])  # stopwords dropped on the second pass
        self.assertTrue(all(len(q) >= 3 for q in queries))
        self.assertEqual(len(queries), len(set(queries)))  # deduped


class TestHtmlToText(unittest.TestCase):
    def test_keeps_list_and_paragraph_breaks_and_decodes_entities(self):
        text = gob.html_to_text("<p>Hola &amp; chau</p><ul><li>uno</li><li>dos</li></ul>")

        self.assertIn("Hola & chau", text)
        self.assertIn("- uno", text)
        self.assertNotIn("<", text)

    def test_decodes_supplementary_plane_entities(self):
        self.assertEqual(gob.html_to_text("<p>&#128512;</p>"), "\U0001F600")
        self.assertEqual(gob.html_to_text("<p>caf&#xE9;</p>"), "café")

    def test_nbsp_becomes_a_plain_space(self):
        self.assertEqual(gob.html_to_text("<p>uno&nbsp;dos</p>"), "uno dos")

    def test_none_for_empty_input(self):
        self.assertIsNone(gob.html_to_text(""))
        self.assertIsNone(gob.html_to_text(None))
        self.assertIsNone(gob.html_to_text("<p></p>"))


class TestNormalizeJob(unittest.TestCase):
    def test_flattens_a_json_api_record(self):
        job = gob.normalize_job(RECORD)

        self.assertEqual(job["id"], "backend-developer-acme-remote-a1b2")
        self.assertEqual(job["title"], "Backend Developer")
        self.assertEqual(job["company"], "Acme")
        self.assertEqual(job["seniority"], "Senior")
        self.assertIs(job["remote"], True)
        self.assertEqual(job["remote_modality"], "remote_local")
        self.assertEqual(job["remote_zone"], "latam")
        self.assertEqual(job["countries"], ["Chile", "Argentina"])
        self.assertEqual(job["salary_min_usd_month"], 2000)
        self.assertEqual(job["salary_max_usd_month"], 2500)
        self.assertEqual(job["applications_count"], 12)
        self.assertEqual(job["date"], "2026-01-01")
        self.assertEqual(
            job["url"],
            "https://www.getonbrd.com/jobs/programming/backend-developer-acme-remote-a1b2",
        )
        self.assertIn("Own the API", job["description"])
        self.assertIn("Funciones:", job["description"])
        self.assertIn("Deseable:", job["description"])

    def test_survives_a_record_with_nothing_but_an_id(self):
        job = gob.normalize_job({"id": "x"})

        self.assertEqual(job["title"], "(untitled)")
        self.assertIsNone(job["company"])
        self.assertIsNone(job["date"])
        self.assertEqual(job["countries"], [])
        self.assertIsNone(job["salary_min_usd_month"])
        self.assertEqual(job["url"], "https://www.getonbrd.com/jobs/x")


class TestBriefJob(unittest.TestCase):
    def test_truncates_a_long_description_and_flags_it(self):
        job = gob.brief_job({**gob.normalize_job(RECORD), "description": "x" * 900})

        self.assertEqual(len(job["description"]), 303)  # 300 + "..."
        self.assertTrue(job["description_truncated"])

    def test_leaves_a_short_description_untouched(self):
        job = gob.brief_job({**gob.normalize_job(RECORD), "description": "short one"})

        self.assertEqual(job["description"], "short one")
        self.assertFalse(job["description_truncated"])

    def test_keeps_the_structured_fields_triage_scores_on(self):
        job = gob.brief_job(gob.normalize_job(RECORD))

        self.assertEqual(job["salary_max_usd_month"], 2500)
        self.assertEqual(job["countries"], ["Chile", "Argentina"])
        self.assertEqual(job["seniority"], "Senior")


class TestClientSideFilters(unittest.TestCase):
    def test_remote_mode_matching(self):
        job = gob.normalize_job(RECORD)

        self.assertTrue(gob.matches_remote(job, "remote"))
        self.assertFalse(gob.matches_remote(job, "hybrid"))
        self.assertFalse(gob.matches_remote(job, "onsite"))
        self.assertTrue(gob.matches_remote(job, None))  # no filter

    def test_jobage_passes_everything_when_unset_or_dateless(self):
        job = gob.normalize_job(RECORD)

        self.assertTrue(gob.within_jobage(job, gob.JOBAGE_ALL))
        self.assertTrue(gob.within_jobage(job, 0))
        self.assertTrue(gob.within_jobage({**job, "date": None}, 7))

    def test_jobage_rejects_an_old_posting(self):
        job = gob.normalize_job(RECORD)  # published 2026-01-01

        self.assertFalse(gob.within_jobage(job, 7))

    def test_jobage_window_is_measured_from_utc_midnight(self):
        # published_at is UTC and the window is days * 86400 from the date's UTC
        # midnight, so "--jobage 7" covers today plus the six previous days: a
        # posting dated exactly 7 days ago is already 7d + the current time of
        # day old. Reading the date in local time instead (mktime) shifts this
        # by an hour under DST and drops the oldest day of the window.
        job = gob.normalize_job(RECORD)

        def days_ago(n):
            return time.strftime("%Y-%m-%d", time.gmtime(time.time() - n * 86400))

        self.assertTrue(gob.within_jobage({**job, "date": days_ago(0)}, 7))
        self.assertTrue(gob.within_jobage({**job, "date": days_ago(6)}, 7))
        self.assertFalse(gob.within_jobage({**job, "date": days_ago(8)}, 7))

    def test_salary_column_marks_unknown_bounds(self):
        job = gob.normalize_job(RECORD)

        self.assertEqual(gob.salary_col(job), "2000-2500")
        self.assertEqual(gob.salary_col({**job, "salary_min_usd_month": None}), "?-2500")
        self.assertEqual(
            gob.salary_col({**job, "salary_min_usd_month": None, "salary_max_usd_month": None}),
            "-",
        )


if __name__ == "__main__":
    unittest.main()
