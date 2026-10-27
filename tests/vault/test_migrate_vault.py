"""
Specs for skills/second-brain/scripts/migrate_vault.py on a throwaway vault.

The old contract names are read from legacy_contract.es.json, the same file the
script uses, so this spec holds no copy of them.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import contextlib
import io
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[2] / "skills" / "second-brain" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import migrate_vault as mv  # noqa: E402

LEGACY = json.loads((SCRIPTS / "legacy_contract.es.json").read_text(encoding="utf-8"))


def old(section, new):
    """The old name of `new` in one section of the legacy mapping."""
    return {value: key for key, value in LEGACY[section].items()}[new]


def heading(new):
    return old("note_headings", new)


NOTES_WORD = heading("## Notes").lstrip("# ")


class MigrateVaultTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix="vault-migrate-test-")
        self.write(".obsidian/app.json", "{}")
        self.write(".obsidian/snippet.md", heading("## History") + "\n")
        self.write("CLAUDE.md", "\n".join([
            "# My vault",
            "",
            old("claude_md_headings", "## Paths"),
            "",
            "| Role | Path |",
            "|---|---|",
            "| `templates` | `Tpl` |",
            "| `areas` | `{0}` |".format(old("claude_md_values", "(unused)")),
            "",
            "Projects use `{0}`.".format(old("claude_md_values", "active | paused | closed")),
            "",
        ]))
        self.write("Hubs/Postgres.md", "\r\n".join([
            "---", "created: 2026-01-01", "type: hub", "---", "# Postgres", "",
            heading("## Current status"), "Fast enough.", "",
            heading("## Notes"), "These {0} stay as written mid-sentence.".format(NOTES_WORD), "",
            "## {0} and more".format(NOTES_WORD), "",
            "```", heading("## History"), "```", "",
            heading("## History"), "- 2026-01-01 - created", "",
        ]))
        self.write("01_Projects/Migration.md",
                   "---\ncreated: 2026-01-01\ntype: project\nstatus: {0}\n---\n# Migration\n".format(
                       old("project_status", "active")))
        self.write("01_Projects/Odd.md",
                   "---\ncreated: 2026-01-01\ntype: project\nstatus: someday\n---\n# Odd\n")
        self.write("03_Resources/Article.md",
                   "---\ntype: clip\n---\n# Article\n{0} it explains caching\n".format(
                       old("clip_labels", "**Why I saved it:**")))
        self.write("Tpl/Daily.md", "---\ntype: daily\n---\n{0}\n".format(heading("## Reflection")))
        self.write("Bases/Dashboard.base", "\n".join([
            "formulas:",
            "  {0}: '(now() - file.mtime).days'".format(old("base_identifiers", "days_untouched")),
            "views:",
            "  - type: table",
            '    name: "{0}"'.format(old("base_labels", "Active projects")),
            "    filters:",
            "      - 'status != \"{0}\"'".format(old("project_status", "closed")),
            "      - 'status != \"someday\"'",
            "",
        ]))

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def write(self, rel, text):
        path = Path(self.root, rel)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(text.encode("utf-8"))

    def read(self, rel):
        return Path(self.root, rel).read_bytes().decode("utf-8")

    def snapshot(self):
        return {str(p.relative_to(self.root)): p.read_bytes()
                for p in Path(self.root).rglob("*") if p.is_file()}

    def run_cli(self, *argv):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = mv.main([self.root] + list(argv))
        self.assertEqual(code, 0)
        return out.getvalue()

    def backups(self):
        folder = Path(self.root, mv.BACKUP_DIR)
        return sorted(p.name for p in folder.iterdir()) if folder.exists() else []

    def test_dry_run_changes_nothing(self):
        before = self.snapshot()

        output = self.run_cli()

        self.assertEqual(self.snapshot(), before)
        self.assertIn("Hubs/Postgres.md", output)
        self.assertIn("Dry run", output)
        self.assertEqual(self.backups(), [])

    def test_apply_migrates_headings_status_bases_and_the_contract(self):
        self.run_cli("--apply")

        hub = self.read("Hubs/Postgres.md")
        for heading in ("## Current status", "## Notes", "## History"):
            self.assertIn("\r\n" + heading + "\r\n", hub)
        self.assertIn("status: active\n", self.read("01_Projects/Migration.md"))
        self.assertIn("**Why I saved it:** it explains caching", self.read("03_Resources/Article.md"))
        self.assertIn("## Reflection", self.read("Tpl/Daily.md"))
        base = self.read("Bases/Dashboard.base")
        self.assertIn('name: "Active projects"', base)
        self.assertIn('\'status != "closed"\'', base)
        self.assertIn("days_untouched:", base)
        claude = self.read("CLAUDE.md")
        self.assertIn("\n## Paths\n", claude)
        self.assertIn("| `areas` | `(unused)` |", claude)
        self.assertIn("`active | paused | closed`", claude)

    def test_body_text_fences_and_vault_config_are_untouched(self):
        self.run_cli("--apply")

        hub = self.read("Hubs/Postgres.md")
        self.assertIn("These {0} stay as written mid-sentence.".format(NOTES_WORD), hub)
        self.assertIn("## {0} and more".format(NOTES_WORD), hub)
        self.assertIn("```\r\n" + heading("## History") + "\r\n```", hub)
        self.assertEqual(self.read(".obsidian/snippet.md"), heading("## History") + "\n")

    def test_apply_backs_up_the_original_of_every_changed_file(self):
        before = self.snapshot()

        self.run_cli("--apply")

        [stamp] = self.backups()
        folder = Path(self.root, mv.BACKUP_DIR, stamp)
        saved = {str(p.relative_to(folder)): p.read_bytes() for p in folder.rglob("*") if p.is_file()}
        self.assertIn(os.path.join("Hubs", "Postgres.md"), saved)
        self.assertNotIn(os.path.join("01_Projects", "Odd.md"), saved)
        for rel, data in saved.items():
            self.assertEqual(data, before[rel])

    def test_a_second_apply_is_a_no_op(self):
        self.run_cli("--apply")
        after_first = self.snapshot()

        output = self.run_cli("--apply")

        self.assertIn("Nothing to migrate", output)
        self.assertEqual(self.snapshot(), after_first)
        self.assertEqual(len(self.backups()), 1)

    def test_an_unknown_status_is_kept_and_reported(self):
        output = self.run_cli("--apply")

        self.assertIn("status: someday\n", self.read("01_Projects/Odd.md"))
        self.assertIn("01_Projects/Odd.md:4: project status 'someday'", output)
        self.assertIn("Bases/Dashboard.base:8: status filter value 'someday'", output)
        self.assertIn("'status != \"someday\"'", self.read("Bases/Dashboard.base"))

    def test_templates_come_from_the_paths_table(self):
        result = mv.plan(self.root)

        self.assertEqual(result["templates"], "Tpl")
        flagged = {c["path"]: c["template"] for c in result["changes"]}
        self.assertTrue(flagged["Tpl/Daily.md"])
        self.assertFalse(flagged["Hubs/Postgres.md"])

    def test_a_folder_without_obsidian_is_refused(self):
        shutil.rmtree(os.path.join(self.root, ".obsidian"))
        before = self.snapshot()

        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(mv.main([self.root, "--apply"]), 1)
        self.assertEqual(self.snapshot(), before)


if __name__ == "__main__":
    unittest.main()
