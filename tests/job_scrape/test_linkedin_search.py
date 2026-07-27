"""
Specs for skills/job-scrape/scripts/linkedin_search.py - parsers only, no network.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import io
import json
import sys
import unittest
from contextlib import redirect_stderr
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "skills" / "job-scrape" / "scripts"))

import linkedin_search as li  # noqa: E402

SEARCH_HTML = """
<ul>
  <li>
    <div class="base-card" data-entity-urn="urn:li:jobPosting:4434569000">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000?refId=abc">
        <span class="sr-only">Backend Engineer</span>
      </a>
      <h3 class="base-search-card__title">Backend Engineer</h3>
      <h4 class="base-search-card__subtitle">
        <a href="https://www.linkedin.com/company/acme?trk=guest">Acme &amp; Co</a>
      </h4>
      <span class="job-search-card__location">Madrid, Spain</span>
      <time class="job-search-card__listdate--new" datetime="2026-07-20">3 days ago</time>
    </div>
  </li>
  <li>
    <div class="base-card" data-entity-urn="urn:li:jobPosting:4434569001">
      <span class="job-search-card__location">Nowhere</span>
    </div>
  </li>
</ul>"""

DETAIL_HTML = """
<section class="top-card-layout">
  <h1 class="top-card-layout__title">Senior Backend Engineer</h1>
  <a class="topcard__org-name-link" href="https://www.linkedin.com/company/acme?trk=guest">Acme &amp; Co</a>
  <span class="topcard__flavor topcard__flavor--bullet">Madrid, Spain</span>
  <a class="topcard__link" href="https://acme.example/apply?src=li">Apply</a>
  <div class="show-more-less-html__markup">
    <p>We need someone to own the API.</p><ul><li>Node</li><li>Postgres</li></ul>
  </div>
  <ul class="description__job-criteria-list">
    <li><h3 class="description__job-criteria-subheader">Seniority level</h3>
        <span class="description__job-criteria-text">Mid-Senior level</span></li>
    <li><h3 class="description__job-criteria-subheader">Employment type</h3>
        <span class="description__job-criteria-text">Full-time</span></li>
    <li><h3 class="description__job-criteria-subheader">Industries</h3>
        <span class="description__job-criteria-text">Software Development</span></li>
  </ul>
</section>"""


class TestNormalizeId(unittest.TestCase):
    def test_bare_id_urn_and_plain_url(self):
        self.assertEqual(li.normalize_id("4434569000"), "4434569000")
        self.assertEqual(li.normalize_id("urn:li:jobPosting:4434569000"), "4434569000")
        self.assertEqual(
            li.normalize_id("https://www.linkedin.com/jobs/view/4434569000"), "4434569000"
        )

    def test_share_button_shapes_with_trailing_slash(self):
        # The share button yields a trailing slash before the query string;
        # anchoring the ID on `?` alone rejected the most common paste.
        for url in (
            "https://www.linkedin.com/jobs/view/4434569000/",
            "https://www.linkedin.com/jobs/view/4434569000/?refId=abc&trackingId=x",
            "https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000/",
        ):
            with self.subTest(url=url):
                self.assertEqual(li.normalize_id(url), "4434569000")

    def test_slugged_url_with_query_string(self):
        self.assertEqual(
            li.normalize_id(
                "https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000?position=1"
            ),
            "4434569000",
        )

    def test_returns_none_without_an_id(self):
        self.assertIsNone(li.normalize_id("https://www.linkedin.com/jobs/"))
        self.assertIsNone(li.normalize_id("12345"))  # too short to be a job ID


class TestParseJobCards(unittest.TestCase):
    def test_one_card_per_posting_with_entities_decoded(self):
        cards = li.parse_job_cards(SEARCH_HTML)

        self.assertEqual(len(cards), 1)  # the titleless second card is skipped
        self.assertEqual(
            cards[0],
            {
                "id": "4434569000",
                "title": "Backend Engineer",
                "company": "Acme & Co",
                "companyUrl": "https://www.linkedin.com/company/acme",
                "location": "Madrid, Spain",
                "date": "2026-07-20",
                "url": "https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000",
            },
        )

    def test_quiet_when_a_small_response_yields_no_cards(self):
        stderr = io.StringIO()
        with redirect_stderr(stderr):
            self.assertEqual(li.parse_job_cards("<html><body>No results</body></html>"), [])
        self.assertEqual(stderr.getvalue(), "")

    def test_warns_when_a_large_response_yields_no_cards(self):
        stderr = io.StringIO()
        with redirect_stderr(stderr):
            self.assertEqual(li.parse_job_cards("<div>x</div>" * 600), [])

        payload = json.loads(stderr.getvalue())
        self.assertEqual(payload["code"], "NO_CARDS_PARSED")
        self.assertNotIn("error", payload)  # a warning, not a failure


class TestParseJobDetail(unittest.TestCase):
    def test_pulls_title_company_description_and_criteria(self):
        job = li.parse_job_detail(DETAIL_HTML, "4434569000")

        self.assertEqual(job["title"], "Senior Backend Engineer")
        self.assertEqual(job["company"], "Acme & Co")
        self.assertEqual(job["location"], "Madrid, Spain")
        self.assertEqual(job["applyUrl"], "https://acme.example/apply")
        self.assertEqual(job["seniority"], "Mid-Senior level")
        self.assertEqual(job["employmentType"], "Full-time")
        self.assertEqual(job["industries"], "Software Development")
        self.assertIn("own the API", job["description"])
        self.assertNotIn("<", job["description"])
        self.assertEqual(job["url"], "https://www.linkedin.com/jobs/view/4434569000")

    def test_placeholder_title_instead_of_raising(self):
        self.assertEqual(li.parse_job_detail("<html></html>", "1")["title"], "(untitled)")

    def test_nbsp_becomes_a_plain_space(self):
        # U+00A0 is invisible and breaks keyword matching on the JD.
        markup = '<div class="show-more-less-html__markup"><p>Own&nbsp;the API.</p></div>'
        description = li.parse_job_detail(markup, "1")["description"]
        self.assertIn("Own the API.", description)
        self.assertNotIn("\xa0", description)


class TestQueryFlags(unittest.TestCase):
    def test_jobage_maps_to_f_tpr_seconds(self):
        self.assertEqual(li.jobage_to_tpr(7), "r604800")
        self.assertEqual(li.jobage_to_tpr(30), "r2592000")
        self.assertIsNone(li.jobage_to_tpr(9999))  # the "all" sentinel
        self.assertIsNone(li.jobage_to_tpr(0))

    def test_workplace_type_maps_to_f_wt(self):
        self.assertEqual(li.work_type_flag("remote"), "2")
        self.assertEqual(li.work_type_flag("hybrid"), "3")
        self.assertEqual(li.work_type_flag("onsite"), "1")
        self.assertEqual(li.work_type_flag("on-site"), "1")
        self.assertIsNone(li.work_type_flag(None))


if __name__ == "__main__":
    unittest.main()
