"""
Specs for career_registry.py on a fixture workspace.

Writes real files to a tmpdir instead of mocking the filesystem: the script
exists to read notes other people wrote by hand, so parsing those files is
exactly what has to be tested.

Run from the root: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "career-registry" / "scripts"))

import career_registry as cr  # noqa: E402


NOTES = {
    "03-Applications/Acme - Backend.md": """---
type: application
company: Acme Inc
profile: Backend
status: applied
match_score: 78
source: linkedin
applied_date: 2026-07-10
updated: 2026-07-10
posting_url: https://www.linkedin.com/jobs/view/4123456789?utm_source=share&trk=abc
---
""",
    "03-Applications/Globex - Shopify.md": """---
type: freelance
client: Globex
platform: upwork
status: proposal_sent
match_score: 82
connects_spent: 12
bid: 2400
sent_date: 2026-08-01
updated: 2026-08-01
posting_url: https://www.upwork.com/jobs/~01abc
---
""",
    # Accents, legal suffix, legacy `score` and empty status: the four
    # annoying cases in a single note.
    "03-Applications/Zurich - seen.md": """---
type: freelance
client: Zürich Labs SA
status:
score: 44
---
""",
    "08-Contracts/Globex - Store.md": """---
type: contract
client: Globex
status: active
agreed_amount: 2400
estimated_hours: 40
actual_hours: 58
start_date: 2026-08-05
updated: 2026-08-05
---
""",
}

# The schema shape: `jobs` is a job_key -> entry map and URLs live in sources[].
SEEN = {"schema_version": 2, "updated": "2026-08-05", "jobs": {
    "acme|backend": {"sources": [{"source": "linkedin",
                                  "url": "https://www.linkedin.com/jobs/view/4123456789"}],
                     "status": "note_created", "note": "03-Applications/Acme - Backend.md",
                     "quick_score": "high"},
    "ghost|role": {"sources": [{"source": "other", "url": "https://example.com/ghost"}],
                   "status": "note_created", "note": "03-Applications/Deleted.md"},
}}


class WorkspaceCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        for rel, body in NOTES.items():
            target = self.tmp / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(body, encoding="utf-8")
        seen = self.tmp / "tools" / "job_scraper" / "seen_jobs.json"
        seen.parent.mkdir(parents=True, exist_ok=True)
        seen.write_text(json.dumps(SEEN), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def rows(self):
        rows, _ = cr.load_notes(self.tmp)
        return rows


class TestNormalization(unittest.TestCase):
    def test_legal_suffix_does_not_distinguish_a_company(self):
        self.assertEqual(cr.slug("Acme Inc"), cr.slug("acme"))
        self.assertEqual(cr.slug("Globex SA"), cr.slug("globex"))

    def test_abbreviated_legal_suffix_with_dots(self):
        # "S.A." split into tokens gives "s" and "a", which are not in the
        # suffix list. The dots have to collapse before tokenizing.
        self.assertEqual(cr.slug("Globex S.A."), cr.slug("globex"))
        self.assertEqual(cr.slug("Acme S.R.L."), cr.slug("acme"))

    def test_accents_do_not_distinguish_a_company(self):
        self.assertEqual(cr.slug("Zürich Labs"), cr.slug("zurich labs"))

    def test_every_legal_suffix_form_names_the_same_company(self):
        for name in ("Acme Ltda", "Acme Corporation", "Acme Limited", "Acme S.A. de C.V.", "Acme SAPI de CV"):
            self.assertEqual(cr.slug(name), "acme", name)

    def test_a_suffix_word_at_the_start_is_part_of_the_name(self):
        self.assertEqual(cr.slug("AB Tasty"), "ab tasty")
        self.assertEqual(cr.slug("Spa Group"), "spa group")

    def test_tracking_parameter_first_in_the_query(self):
        self.assertEqual(cr.canonical_url("https://acme.com/jobs?utm_source=li&id=5#apply"),
                         cr.canonical_url("https://acme.com/jobs?id=5"))
        self.assertEqual(cr.canonical_url("https://acme.com/jobs/?utm_source=li"), "https://acme.com/jobs")

    def test_url_canonicalization_ignores_tracking(self):
        a = cr.canonical_url("https://www.linkedin.com/jobs/view/123?utm_source=share&trk=x")
        b = cr.canonical_url("https://www.linkedin.com/jobs/view/123?trackingId=other")
        self.assertEqual(a, b)
        self.assertEqual(a, "https://www.linkedin.com/jobs/view/123")

    def test_empty_number_is_none_not_zero(self):
        # An empty template field is not a zero: if it were 0, a contract with
        # no hours logged would show up as "40 hours over".
        self.assertIsNone(cr.number(""))
        self.assertIsNone(cr.number(None))
        self.assertEqual(cr.number("58"), 58.0)
        self.assertEqual(cr.number("2,5"), 2.5)


class TestFrontmatter(unittest.TestCase):
    def test_reads_flat_keys(self):
        fields = cr.parse_frontmatter("---\ntype: freelance\nbid: 2400\n---\nbody")
        self.assertEqual(fields["type"], "freelance")
        self.assertEqual(fields["bid"], "2400")

    def test_block_list_does_not_swallow_a_scalar(self):
        # The bug already paid for once in vault_audit: the block list
        # overwrote the scalar value already read.
        fields = cr.parse_frontmatter("---\nprofile: Backend\ntags:\n  - a\n  - b\n---")
        self.assertEqual(fields["profile"], "Backend")
        self.assertEqual(fields["tags"], ["a", "b"])

    def test_bom_and_quoted_values(self):
        fields = cr.parse_frontmatter("﻿---\nstatus: \"applied\"\ncompany: 'Acme'\n---")
        self.assertEqual(fields, {"status": "applied", "company": "Acme"})

    def test_no_frontmatter_returns_empty(self):
        self.assertEqual(cr.parse_frontmatter("# just a title"), {})
        self.assertEqual(cr.parse_frontmatter("---\nnot closed"), {})


class TestLoadNotes(WorkspaceCase):
    def test_reads_both_folders_and_all_types(self):
        types = sorted(r["type"] for r in self.rows())
        self.assertEqual(types, ["application", "contract", "freelance", "freelance"])

    def test_company_and_client_land_in_one_column(self):
        # Jobs use `company`, freelance uses `client`. The registry merges them
        # or the CSV comes out with half a column empty.
        by_title = {r["title"]: r for r in self.rows()}
        self.assertEqual(by_title["Acme - Backend"]["counterpart"], "Acme Inc")
        self.assertEqual(by_title["Globex - Shopify"]["counterpart"], "Globex")

    def test_legacy_score_field_is_read(self):
        row = next(r for r in self.rows() if r["title"].startswith("Zurich"))
        self.assertEqual(row["match_score"], "44")

    def test_open_state_depends_on_type(self):
        by_title = {r["title"]: r for r in self.rows()}
        # `applied` is open for jobs; `active` is open for contracts.
        self.assertEqual(by_title["Acme - Backend"]["open"], "yes")
        self.assertEqual(by_title["Globex - Store"]["open"], "yes")
        # Without a status it cannot count as open.
        self.assertEqual(by_title["Zurich - seen"]["open"], "no")

    def test_ignores_index_files(self):
        (self.tmp / "03-Applications" / "_index.md").write_text("---\ntype: x\n---", encoding="utf-8")
        self.assertEqual(len(self.rows()), 4)

    def test_pre_english_layout_is_reported(self):
        # An unmigrated workspace reads as empty; the problem list says why.
        (self.tmp / cr.LEGACY_APPLICATIONS_DIR).mkdir()
        _, problems = cr.load_notes(self.tmp)
        self.assertTrue(any("migrate_workspace.py" in p["problem"] for p in problems))


class TestCheck(WorkspaceCase):
    def test_finds_by_company_ignoring_legal_suffix(self):
        hits = cr.match_rows(self.rows(), "acme")
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0]["matched_by"], "same counterpart")

    def test_finds_by_url_with_different_tracking(self):
        hits = cr.match_rows(self.rows(),
                             "https://www.linkedin.com/jobs/view/4123456789?utm_source=other")
        self.assertEqual(hits[0]["matched_by"], "same posting URL")

    def test_finds_by_company_with_accents(self):
        hits = cr.match_rows(self.rows(), "zurich labs")
        self.assertEqual(len(hits), 1)

    def test_unknown_returns_nothing(self):
        self.assertEqual(cr.match_rows(self.rows(), "Initech"), [])

    def test_sent_and_merely_seen_are_different_answers(self):
        # The distinction that makes the command useful: "seen" invites a
        # second look, "already applied" says do not repeat.
        sent = [h for h in cr.match_rows(self.rows(), "acme") if h["status"] in cr.SENT_STATES]
        seen_only = [h for h in cr.match_rows(self.rows(), "zurich labs")
                     if h["status"] in cr.SENT_STATES]
        self.assertTrue(sent)
        self.assertFalse(seen_only)

    def test_url_is_found_in_the_dedup_sources(self):
        seen = cr.load_seen_jobs(self.tmp)
        url = cr.canonical_url("https://www.linkedin.com/jobs/view/4123456789?trk=x")
        hits = [e for e in cr.seen_entries(seen) if url in cr.entry_urls(e)]
        self.assertEqual([e["status"] for e in hits], ["note_created"])


class TestAuditSignals(WorkspaceCase):
    def test_flags_hours_over_estimate(self):
        rows = self.rows()
        drift = [r for r in rows if (r.get("actual_hours") or 0) > (r.get("estimated_hours") or 0)
                 and r.get("estimated_hours")]
        self.assertEqual(len(drift), 1)
        self.assertEqual(drift[0]["actual_hours"] - drift[0]["estimated_hours"], 18)

    def test_flags_missing_status(self):
        missing = [r["note"] for r in self.rows() if not r["status"]]
        self.assertEqual(len(missing), 1)

    def test_detects_broken_dedup_pointer(self):
        seen = cr.load_seen_jobs(self.tmp)
        existing = {r["note"] for r in self.rows()}
        broken = [e for e in cr.seen_entries(seen)
                  if e.get("note") and not any(e["note"] in n or n in e["note"] for n in existing)]
        self.assertEqual(len(broken), 1)
        self.assertEqual(broken[0]["note"], "03-Applications/Deleted.md")

    def test_missing_seen_jobs_is_not_an_error(self):
        # Someone can install +freelance without ever having run a scan.
        (self.tmp / "tools" / "job_scraper" / "seen_jobs.json").unlink()
        self.assertIsNone(cr.load_seen_jobs(self.tmp))


class TestCsvContract(unittest.TestCase):
    def test_columns_cover_both_profiles(self):
        for column in ("type", "counterpart", "status", "match_score",
                       "application_cost", "days_idle", "note"):
            self.assertIn(column, cr.CSV_COLUMNS)

    def test_sent_states_cover_both_vocabularies(self):
        self.assertIn("applied", cr.SENT_STATES)        # jobs
        self.assertIn("proposal_sent", cr.SENT_STATES)  # freelance


if __name__ == "__main__":
    unittest.main()
