"""
Specs for skills/vault-audit/scripts/vault_audit.py - parsers and the audit over
fixture vaults built in a tmpdir. No network, no real vault.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import os
import shutil
import sys
import tempfile
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "skills" / "vault-audit" / "scripts"))

import vault_audit as va  # noqa: E402


def args_for(*argv):
    return va.build_parser().parse_args(["vault"] + list(argv))


class VaultFixture(unittest.TestCase):
    """Builds a throwaway vault; every audit spec inherits this."""

    def setUp(self):
        self.root = tempfile.mkdtemp(prefix="vault-audit-test-")
        os.mkdir(os.path.join(self.root, ".obsidian"))

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def note(self, relative_path, body):
        full = os.path.join(self.root, relative_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as handle:
            handle.write(body)
        return full

    def audit(self, *argv):
        return va.audit(self.root, args_for(*argv))


class TestParseFrontmatter(unittest.TestCase):
    def test_reads_scalars_inline_lists_and_block_lists(self):
        text = "---\ncreated: 2026-07-27\ntags: [a, b]\naliases:\n  - PG\n  - pg\n---\nbody\n"

        fields, offset = va.parse_frontmatter(text)

        self.assertEqual(fields["created"], "2026-07-27")
        self.assertEqual(fields["tags"], ["a", "b"])
        self.assertEqual(fields["aliases"], ["PG", "pg"])
        self.assertEqual("\n".join(text.split("\n")[offset:]).strip(), "body")

    def test_no_frontmatter_means_no_fields_and_no_offset(self):
        self.assertEqual(va.parse_frontmatter("# Just a note\n"), ({}, 0))

    def test_unterminated_frontmatter_leaves_no_body_instead_of_reading_it_as_yaml(self):
        text = "---\ntype: atomic\nbody without close\n"

        fields, offset = va.parse_frontmatter(text)

        self.assertEqual(fields.get("type"), "atomic")
        self.assertEqual("\n".join(text.split("\n")[offset:]), "")


class TestStripCode(unittest.TestCase):
    def test_removes_fenced_and_inline_code(self):
        text = "real [[A]]\n```\n[[B]]\n```\nand `[[C]]`\n"

        stripped = va.strip_code(text)

        self.assertIn("[[A]]", stripped)
        self.assertNotIn("[[B]]", stripped)
        self.assertNotIn("[[C]]", stripped)


class TestInlineTags(unittest.TestCase):
    def test_matches_tags_and_nested_tags(self):
        self.assertEqual(va.INLINE_TAG.findall("#work and #area/health"), ["work", "area/health"])

    def test_ignores_headings_url_fragments_and_numbers(self):
        self.assertEqual(va.INLINE_TAG.findall("## Heading"), [])
        self.assertEqual(va.INLINE_TAG.findall("https://x.com/a#section"), [])
        self.assertEqual(va.INLINE_TAG.findall("#1 place"), [])


class TestLinkTarget(unittest.TestCase):
    def test_strips_alias_and_heading(self):
        self.assertEqual(va.link_target("folder/Note#Heading|Alias"), "folder/Note")
        self.assertEqual(va.link_target("Note|Display"), "Note")
        self.assertEqual(va.link_target("Note"), "Note")

    def test_same_note_heading_link_has_no_target(self):
        self.assertEqual(va.link_target("#Heading"), "")


class TestResolve(unittest.TestCase):
    def setUp(self):
        notes = {
            "Hubs/Postgres.md": {"fields": {"aliases": ["PG", "postgre sql"]}},
            "03_Resources/Indices.md": {},
            "a/Dup.md": {},
            "b/Dup.md": {},
        }
        self.by_path, self.by_name, self.by_alias = va.build_index(notes, {"assets/img.png": {}})

    def resolve(self, target):
        return va.resolve(target, self.by_path, self.by_name, self.by_alias)

    def test_resolves_by_bare_name_by_path_and_case_insensitively(self):
        self.assertEqual(self.resolve("Postgres"), ("Hubs/Postgres.md", False))
        self.assertEqual(self.resolve("Hubs/Postgres"), ("Hubs/Postgres.md", False))
        self.assertEqual(self.resolve("postgres"), ("Hubs/Postgres.md", False))

    def test_resolves_an_attachment(self):
        self.assertEqual(self.resolve("img.png"), ("assets/img.png", False))

    def test_flags_a_duplicated_basename_as_ambiguous(self):
        resolved, ambiguous = self.resolve("Dup")

        self.assertIn(resolved, ("a/Dup.md", "b/Dup.md"))
        self.assertTrue(ambiguous)

    def test_resolves_a_link_written_as_an_alias(self):
        # Obsidian follows frontmatter aliases, so [[PG]] is a working link and
        # reporting it as broken would flood the audit with false positives.
        self.assertEqual(self.resolve("PG"), ("Hubs/Postgres.md", False))
        self.assertEqual(self.resolve("postgre sql"), ("Hubs/Postgres.md", False))

    def test_a_filename_wins_over_an_alias(self):
        self.assertEqual(self.resolve("Indices"), ("03_Resources/Indices.md", False))

    def test_returns_none_for_a_target_that_does_not_exist(self):
        self.assertEqual(self.resolve("Nope"), (None, False))


class TestLinkFindings(VaultFixture):
    def test_separates_orphans_from_notes_that_merely_lack_backlinks(self):
        self.note("Hubs/Topic.md", "---\ncreated: 2026-07-01\ntype: hub\n---\n[[03_Resources/Idea]]\n")
        self.note("03_Resources/Idea.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nlinked\n")
        self.note("03_Resources/Lonely.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nnothing here\n")

        findings = self.audit()["findings"]

        self.assertEqual(findings["orphans"], ["03_Resources/Lonely.md"])
        self.assertEqual(findings["no_backlinks"], ["Hubs/Topic.md"])

    def test_reports_a_broken_link_with_its_source(self):
        self.note("A.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\n[[Ghost]]\n")

        findings = self.audit()["findings"]

        self.assertEqual(findings["broken_links"], [{"source": "A.md", "target": "Ghost"}])

    def test_a_link_inside_a_code_block_is_not_a_broken_link(self):
        self.note("A.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\n"
                          "use `[[Syntax]]` like this:\n```\n[[Example]]\n```\n[[Real]]\n")

        findings = self.audit()["findings"]

        self.assertEqual([b["target"] for b in findings["broken_links"]], ["Real"])

    def test_embeds_count_as_links_and_mark_the_attachment_as_used(self):
        self.note("A.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\n![[assets/img.png|300]]\n")
        self.note("assets/img.png", "not really a png")
        self.note("assets/unused.png", "orphan")

        report = self.audit()

        self.assertEqual(report["counts"]["links"], 1)
        self.assertEqual(report["findings"]["orphan_attachments"], ["assets/unused.png"])


class TestNoteFindings(VaultFixture):
    def test_flags_a_note_untouched_past_the_stale_threshold(self):
        path = self.note("03_Resources/Old.md",
                         "---\ncreated: 2020-01-01\ntype: atomic\n---\n" + "word " * 50)
        old = time.time() - 200 * 86400
        os.utime(path, (old, old))

        findings = self.audit("--stale-days", "180")["findings"]

        self.assertEqual([s["path"] for s in findings["stale"]], ["03_Resources/Old.md"])
        self.assertGreaterEqual(findings["stale"][0]["days"], 199)

    def test_hollow_threshold_counts_body_words_only(self):
        self.note("03_Resources/Short.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nthree words here\n")
        self.note("03_Resources/Long.md",
                  "---\ncreated: 2026-07-01\ntype: atomic\n---\n" + "word " * 40)

        findings = self.audit("--hollow-words", "30")["findings"]

        self.assertEqual([h["path"] for h in findings["hollow"]], ["03_Resources/Short.md"])

    def test_reports_which_required_frontmatter_field_is_missing(self):
        self.note("03_Resources/Missing.md", "---\ntype: atomic\n---\nbody\n")

        findings = self.audit()["findings"]

        self.assertEqual(findings["missing_frontmatter"],
                         [{"path": "03_Resources/Missing.md", "missing": ["created"]}])

    def test_required_fields_are_configurable(self):
        self.note("03_Resources/Missing.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nbody\n")

        findings = self.audit("--require", "status")["findings"]

        self.assertEqual(findings["missing_frontmatter"],
                         [{"path": "03_Resources/Missing.md", "missing": ["status"]}])

    def test_templates_and_archive_are_scanned_but_kept_out_of_the_findings(self):
        self.note("Templates/Atomic.md", "hollow by design\n")
        self.note("04_Archive/Closed.md", "archived\n")

        report = self.audit()

        self.assertEqual(report["counts"]["notes"], 2)
        self.assertEqual(report["counts"]["notes_audited"], 0)
        self.assertEqual(report["findings"]["orphans"], [])

    def test_exempt_folders_are_configurable_for_a_vault_with_its_own_layout(self):
        self.note("Blueprints/Atomic.md", "hollow by design\n")
        self.note("03_Resources/Real.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nreal\n")

        report = self.audit("--exempt", "Blueprints")

        self.assertEqual(report["thresholds"]["exempt_dirs"], ["Blueprints"])
        self.assertEqual(report["counts"]["notes_audited"], 1)
        self.assertEqual(report["findings"]["orphans"], ["03_Resources/Real.md"])

    def test_audit_all_includes_them(self):
        self.note("Templates/Atomic.md", "hollow by design\n")

        report = self.audit("--audit-all")

        self.assertEqual(report["counts"]["notes_audited"], 1)
        self.assertEqual(report["findings"]["orphans"], ["Templates/Atomic.md"])


class TestStatusMaturity(VaultFixture):
    """The contract's status field is what makes stale and hollow actionable."""

    def aged(self, rel, body, days):
        path = self.note(rel, body)
        when = time.time() - days * 86400
        os.utime(path, (when, when))
        return path

    def test_an_evergreen_note_is_not_stale_no_matter_how_old(self):
        self.aged("03_Resources/Old.md",
                  "---\ncreated: 2020-01-01\ntype: atomic\nstatus: evergreen\n---\n" + "word " * 50,
                  400)
        self.aged("03_Resources/Other.md",
                  "---\ncreated: 2020-01-01\ntype: atomic\n---\n" + "word " * 50, 400)

        findings = self.audit()["findings"]

        self.assertEqual([s["path"] for s in findings["stale"]], ["03_Resources/Other.md"])

    def test_a_seed_is_allowed_to_be_short_but_not_forever(self):
        self.aged("03_Resources/Recent.md",
                  "---\ncreated: 2026-07-01\ntype: atomic\nstatus: seed\n---\nshort\n", 3)
        self.aged("03_Resources/Abandoned.md",
                  "---\ncreated: 2026-01-01\ntype: atomic\nstatus: seed\n---\nshort\n", 60)

        findings = self.audit("--seed-days", "30")["findings"]

        self.assertEqual(findings["hollow"], [])  # neither counts as hollow
        self.assertEqual([s["path"] for s in findings["stale_seeds"]],
                         ["03_Resources/Abandoned.md"])

    def test_an_old_seed_is_reported_once_not_as_three_separate_problems(self):
        self.aged("03_Resources/Abandoned.md",
                  "---\ncreated: 2026-01-01\ntype: atomic\nstatus: seed\n---\nshort\n", 400)

        findings = self.audit("--seed-days", "30", "--stale-days", "180")["findings"]

        self.assertEqual(len(findings["stale_seeds"]), 1)
        self.assertEqual(findings["stale"], [])
        self.assertEqual(findings["hollow"], [])

    def test_an_archived_note_is_out_of_scope_wherever_it_lives(self):
        self.note("03_Resources/Closed.md",
                  "---\ncreated: 2026-01-01\ntype: atomic\nstatus: archived\n---\nno links\n")

        report = self.audit()

        self.assertEqual(report["counts"]["notes_audited"], 0)
        self.assertEqual(report["findings"]["orphans"], [])

    def test_contested_notes_are_listed_so_a_review_can_resolve_them(self):
        self.note("03_Resources/Disputed.md",
                  "---\ncreated: 2026-07-01\ntype: atomic\nstatus: contested\n---\n"
                  "this contradicts [[Other]]\n")

        report = self.audit()

        self.assertEqual(report["findings"]["contested"], ["03_Resources/Disputed.md"])
        self.assertEqual(report["counts"]["by_status"]["contested"], 1)

    def test_a_project_lifecycle_value_is_inert_not_misread_as_maturity(self):
        # Projects reuse `status` for their own vocabulary (e.g. active|paused|closed).
        # The audit must treat an unknown value as no value instead of guessing.
        self.aged("01_Projects/Migration.md",
                  "---\ncreated: 2026-01-01\ntype: project\nstatus: active\n---\n" + "word " * 50,
                  400)

        findings = self.audit()["findings"]

        self.assertEqual([s["path"] for s in findings["stale"]], ["01_Projects/Migration.md"])
        self.assertEqual(findings["stale_seeds"], [])

    def test_notes_without_a_status_are_counted_as_such(self):
        self.note("A.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nbody\n")

        self.assertEqual(self.audit()["counts"]["by_status"], {"(no status)": 1})


class TestTasks(VaultFixture):
    def days_ago(self, days):
        return time.strftime("%Y-%m-%d", time.localtime(time.time() - days * 86400))

    def test_counts_open_and_done_across_the_vault(self):
        self.note("_inbox/today.md", "---\ncreated: 2026-07-01\ntype: dump\n---\n"
                                   "- [ ] one\n- [x] another\n- [-] canceled\n")

        counts = self.audit()["counts"]

        self.assertEqual(counts["tasks_open"], 1)
        self.assertEqual(counts["tasks_done"], 1)

    def test_flags_open_tasks_left_in_a_dated_note_past_the_carry_window(self):
        # The vault convention cancels a task in place instead of carrying it
        # forward, so an open task in a note from days ago is drift, not backlog.
        self.note("_inbox/{0}.md".format(self.days_ago(10)),
                  "---\ncreated: 2026-07-01\ntype: dump\n---\n- [ ] left open\n")
        self.note("_inbox/{0}.md".format(self.days_ago(1)),
                  "---\ncreated: 2026-07-01\ntype: dump\n---\n- [ ] from yesterday\n")

        findings = self.audit("--task-days", "7")["findings"]

        self.assertEqual(len(findings["stale_open_tasks"]), 1)
        self.assertEqual(findings["stale_open_tasks"][0]["open"], 1)
        self.assertGreaterEqual(findings["stale_open_tasks"][0]["days"], 10)

    def test_a_dated_note_with_no_open_task_is_not_flagged(self):
        self.note("_inbox/{0}.md".format(self.days_ago(30)),
                  "---\ncreated: 2026-07-01\ntype: dump\n---\n- [x] closed\n- [-] canceled\n")

        self.assertEqual(self.audit()["findings"]["stale_open_tasks"], [])


class TestTagsAndMetrics(VaultFixture):
    def test_merges_frontmatter_and_inline_tags_and_finds_single_use(self):
        self.note("A.md", "---\ncreated: 2026-07-01\ntype: atomic\ntags: [common]\n---\n#single\n[[B]]\n")
        self.note("B.md", "---\ncreated: 2026-07-01\ntype: atomic\ntags: [common]\n---\nbody\n")

        report = self.audit()

        self.assertEqual(report["counts"]["tags"], 2)
        self.assertEqual(report["findings"]["single_use_tags"], ["single"])

    def test_average_links_per_note_counts_every_note_including_exempt_ones(self):
        self.note("A.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\n[[B]]\n[[B]]\n")
        self.note("B.md", "---\ncreated: 2026-07-01\ntype: atomic\n---\nbody\n")

        self.assertEqual(self.audit()["metrics"]["avg_links_per_note"], 1.0)


class TestCap(unittest.TestCase):
    def test_truncates_each_list_and_says_so(self):
        report = {"findings": {"orphans": ["a", "b", "c"], "stale": []}}

        capped = va.cap(report, 2)

        self.assertEqual(capped["findings"]["orphans"], ["a", "b"])
        self.assertEqual(capped["totals"]["orphans"], 3)
        self.assertEqual(capped["truncated"], ["orphans"])

    def test_zero_means_no_cap(self):
        report = {"findings": {"orphans": ["a", "b", "c"]}}

        capped = va.cap(report, 0)

        self.assertEqual(capped["findings"]["orphans"], ["a", "b", "c"])
        self.assertNotIn("truncated", capped)


if __name__ == "__main__":
    unittest.main()
