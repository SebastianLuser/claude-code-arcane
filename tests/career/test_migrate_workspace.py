"""
Specs for skills/career-registry/scripts/migrate_workspace.py on a temp workspace
with the old layout.

The old names come from the script's own legacy_contract.es.json, so the
fixtures follow the pack and this file stays in English.

Run from the root: python -m unittest discover -s tests -p "test_*.py"
"""

import contextlib
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "career-registry" / "scripts"))

import migrate_workspace as mw  # noqa: E402


def inverse(mapping):
    return {new: old for old, new in mapping.items()}


# New name -> old name, read from the pack.
DIR = inverse(mw.FOLDERS)
FILE = {new: old for _, old, new in mw.FILE_RENAMES}
KEY = inverse(mw.KEYS)
VALUE = {key: inverse(mapping) for key, mapping in mw.LEGACY["frontmatter_values"].items()}
SEEN_KEY = inverse(mw.SEEN_ENTRY_KEYS)
SEEN_STATUS = inverse(mw.SEEN_STATUS)
SLUG = inverse(mw.SEEN["job_key_slugs"])
OLD_SCHEME = mw.NOTE_URL_SCHEME[0]

APPS = DIR["03-Applications"]
PROFILES = DIR["01-Profiles"]
MASTER = FILE["Master Profile.md"]
MASTER_LINK = "[[" + MASTER[:-3]
APP_TEMPLATE = FILE["Application.md"]
PORTFOLIO = FILE["Portfolio Web Data.md"]


def accented(word):
    """The accent the migration has to ignore, on the first i."""
    return word.replace("i", "í", 1)


def fm(*pairs, eol="\n"):
    """Frontmatter block from (new key, value) pairs, written with the old key."""
    return "---" + eol + "".join("{0}: {1}{2}".format(KEY[k], v, eol) for k, v in pairs) + "---" + eol


OLD = {
    "00-Dashboard.md": fm(("type", "dashboard")) + "# Dashboard\n",
    PROFILES + "/" + MASTER: fm(
        ("type", VALUE["type"]["profile"]),
        ("work_mode", "[{0}, {1}]".format(VALUE["work_mode"]["remote"],
                                          accented(VALUE["work_mode"]["hybrid"])))),
    PROFILES + "/Backend.md": (
        "---\n{0}: {1}\n{2}: 75\n{3}:\n  - php\n---\n".format(
            KEY["type"], VALUE["type"]["profile"], KEY["min_match_score"], KEY["exclude_keywords"])
        + "See " + MASTER_LINK + "]].\n"),
    APPS + "/Acme - Backend.md": fm(
        ("type", VALUE["type"]["application"]), ("company", "Acme"),
        ("profile", '"' + MASTER_LINK + ']]"'), ("status", VALUE["status"]["applied"]),
        ("priority", VALUE["priority"]["high"].title()), ("work_mode", "Remote (LATAM)"),
        ("updated", "2026-07-10"), eol="\r\n")
        + "## Notes\r\n{0}: {1} stays in the body.\r\n".format(KEY["status"],
                                                               VALUE["status"]["interested"]),
    APPS + "/Globex - Store.md": fm(
        ("type", "freelance"), ("client", "Globex"), ("status", "waiting_on_client"),
        ("client_risk", VALUE["client_risk"]["DO NOT APPLY"].upper()),
        ("pricing", VALUE["pricing"]["fixed"])),
    DIR["08-Contracts"] + "/Globex.md": fm(
        ("type", VALUE["type"]["contract"]), ("status", VALUE["status"]["active"]),
        ("actual_hours", 58)),
    "Templates/" + APP_TEMPLATE: fm(
        ("type", VALUE["type"]["application"]), ("status", VALUE["status"]["interested"]),
        ("date", "{{date:YYYY-MM-DD}}")),
    "portfolio/" + PORTFOLIO: fm(("date", "2026-01-01")) + "site data\n",
}
SEEN = {"schema_version": 1, inverse(mw.SEEN_TOP_KEYS)["updated"]: "2026-08-01", "jobs": {
    "acme|backend": {
        "title": "Backend", "company": "Acme", "status": SEEN_STATUS["note_created"],
        SEEN_KEY["note"]: "Acme - Backend.md", SEEN_KEY["profile"]: "Backend",
        "sources": [{"source": VALUE["source"]["other"], "url": OLD_SCHEME + "Acme - Backend.md",
                     inverse(mw.SEEN_SOURCE_KEYS)["published"]: "2026-07-01"}]},
    SLUG["no-company"] + "|untitled-abc123": {
        "title": "?", "company": "", "status": SEEN_STATUS["discarded"],
        SEEN_KEY["discard_reason"]: "spam", "sources": []},
}}


class MigrationCase(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp())
        self.ws = self.root / "career-workspace"
        for rel, body in OLD.items():
            self.write(rel, body)
        seen = self.ws / "tools" / "job_scraper" / "seen_jobs.json"
        seen.parent.mkdir(parents=True)
        seen.write_text(json.dumps(SEEN), encoding="utf-8")

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def run_cli(self, *args):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = mw.main(["--workspace", str(self.ws)] + list(args))
        self.assertEqual(code, 0)
        return json.loads(out.getvalue())

    def snapshot(self):
        return {p.relative_to(self.ws).as_posix(): p.read_bytes()
                for p in sorted(self.ws.rglob("*")) if p.is_file()}

    def write(self, rel, body):
        path = self.ws / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="") as handle:
            handle.write(body)

    def read(self, rel):
        with open(self.ws / rel, encoding="utf-8", newline="") as handle:
            return handle.read()


class TestPack(unittest.TestCase):
    def test_every_old_value_maps_to_a_valid_english_one(self):
        for key, mapping in mw.LEGACY["frontmatter_values"].items():
            valid = mw.VALID.get(key)
            for old, new in mapping.items():
                self.assertEqual(old, mw.fold(old), "pack values are stored folded")
                if valid:
                    self.assertIn(mw.fold(new), valid, "{0}: {1}".format(key, new))


class TestDryRun(MigrationCase):
    def test_changes_nothing_and_shows_the_plan(self):
        before = self.snapshot()
        report = self.run_cli()
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(report["mode"], "dry-run")
        self.assertIsNone(report["backup"])
        self.assertIn({"from": APPS, "to": "03-Applications", "how": "rename"},
                      report["rename_folders"])
        self.assertIn({"from": PROFILES + "/" + MASTER, "to": PROFILES + "/Master Profile.md"},
                      report["rename_files"])
        self.assertIn({"from": "Templates/" + APP_TEMPLATE, "to": "Templates/Application.md"},
                      report["rename_files"])
        self.assertEqual(report["state_files"][0]["file"], "tools/job_scraper/seen_jobs.json")
        self.assertFalse(list(self.root.glob("*.backup-*")))


class TestApply(MigrationCase):
    def test_migrates_layout_frontmatter_and_state(self):
        report = self.run_cli("--apply")
        self.assertFalse(report["nothing_to_do"])

        for old, new in mw.FOLDERS.items():
            self.assertFalse((self.ws / old).exists(), old)
        self.assertTrue((self.ws / "01-Profiles" / "Master Profile.md").is_file())
        self.assertTrue((self.ws / "Templates" / "Application.md").is_file())
        self.assertTrue((self.ws / "portfolio" / "Portfolio Web Data.md").is_file())

        note = self.read("03-Applications/Acme - Backend.md")
        self.assertIn("type: application\r\n", note)
        self.assertIn("company: Acme\r\n", note)
        self.assertIn('profile: "[[Master Profile]]"\r\n', note)
        self.assertIn("status: applied\r\n", note)
        self.assertIn("priority: high\r\n", note)
        self.assertIn("updated: 2026-07-10\r\n", note)
        # The body is never touched, line endings included.
        self.assertTrue(note.endswith(OLD[APPS + "/Acme - Backend.md"].split("---\r\n")[-1]))

        profile = self.read("01-Profiles/Master Profile.md")
        self.assertIn("work_mode: [remote, hybrid]", profile)
        backend = self.read("01-Profiles/Backend.md")
        self.assertIn("min_match_score: 75\nexclude_keywords:\n  - php\n", backend)
        self.assertIn("See " + MASTER_LINK + "]].", backend)

        proposal = self.read("03-Applications/Globex - Store.md")
        self.assertIn("client_risk: DO NOT APPLY", proposal)
        self.assertIn("pricing: fixed", proposal)
        self.assertIn("status: active", self.read("08-Contracts/Globex.md"))
        self.assertIn("actual_hours: 58", self.read("08-Contracts/Globex.md"))
        self.assertIn("date: {{date:YYYY-MM-DD}}", self.read("Templates/Application.md"))
        # portfolio/ is not a contract note: renamed, frontmatter left alone.
        self.assertIn(KEY["date"] + ": 2026-01-01", self.read("portfolio/Portfolio Web Data.md"))

        seen = json.loads(self.read("tools/job_scraper/seen_jobs.json"))
        self.assertEqual(seen["schema_version"], 2)
        self.assertEqual(seen["updated"], "2026-08-01")
        self.assertEqual(set(seen), {"schema_version", "updated", "jobs"})
        entry = seen["jobs"]["acme|backend"]
        self.assertEqual(entry["status"], "note_created")
        self.assertEqual(entry["note"], "Acme - Backend.md")
        self.assertEqual(entry["profile"], "Backend")
        self.assertEqual(entry["sources"][0], {"source": "other", "url": "note://Acme - Backend.md",
                                               "published": "2026-07-01"})
        dropped = seen["jobs"]["no-company|untitled-abc123"]
        self.assertEqual(dropped["status"], "discarded")
        self.assertEqual(dropped["discard_reason"], "spam")

    def test_old_hash_fallback_keys_are_renamed(self):
        self.write("tools/job_scraper/seen_jobs.json", json.dumps({"schema_version": 1, "jobs": {
            SLUG["company"] + "-a1b2c3|" + SLUG["untitled"] + "-0f0f0f": {"status": "new"}}}))
        self.run_cli("--apply")
        seen = json.loads(self.read("tools/job_scraper/seen_jobs.json"))
        self.assertEqual(list(seen["jobs"]), ["company-a1b2c3|untitled-0f0f0f"])

    def test_backup_holds_the_original(self):
        report = self.run_cli("--apply")
        backup = Path(report["backup"])
        self.assertEqual(backup.parent, self.root)
        original = backup / APPS / "Acme - Backend.md"
        self.assertTrue(original.is_file())
        self.assertIn("{0}: {1}".format(KEY["status"], VALUE["status"]["applied"]),
                      original.read_text(encoding="utf-8"))

    def test_second_apply_is_a_no_op(self):
        self.run_cli("--apply")
        before = self.snapshot()
        report = self.run_cli("--apply")
        self.assertTrue(report["nothing_to_do"])
        self.assertIsNone(report["backup"])
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(len(list(self.root.glob("*.backup-*"))), 1)

    def test_unknown_values_are_kept_and_reported(self):
        report = self.run_cli("--apply")
        unknown = {(u["key"], u["value"]) for u in report["unknown_values"]}
        self.assertIn(("status", "waiting_on_client"), unknown)
        self.assertIn(("work_mode", "Remote (LATAM)"), unknown)
        self.assertIn("status: waiting_on_client", self.read("03-Applications/Globex - Store.md"))
        self.assertIn("work_mode: Remote (LATAM)", self.read("03-Applications/Acme - Backend.md"))

    def test_body_links_to_renamed_notes_are_reported(self):
        report = self.run_cli()
        links = {b["note"]: b["links"] for b in report["body_links_to_old_names"]}
        self.assertEqual(links, {PROFILES + "/Backend.md": [MASTER_LINK]})

    def test_an_existing_new_folder_is_merged_without_overwriting(self):
        self.write("03-Applications/Acme - Backend.md", "---\ntype: application\n---\n")
        report = self.run_cli("--apply")
        self.assertTrue((self.ws / "03-Applications" / "Globex - Store.md").is_file())
        self.assertIn("type: application\n---\n", self.read("03-Applications/Acme - Backend.md"))
        self.assertTrue((self.ws / APPS / "Acme - Backend.md").is_file())
        self.assertTrue(any("left in " + APPS in c["problem"] for c in report["conflicts"]))

    def test_a_key_already_in_english_is_not_duplicated(self):
        old_status = KEY["status"]
        self.write(DIR["04-Companies"] + "/Acme.md",
                   "---\n{0}: x\nstatus: interested\n---\n".format(old_status))
        report = self.run_cli("--apply")
        text = self.read("04-Companies/Acme.md")
        self.assertIn("{0}: x\nstatus: interested".format(old_status), text)
        self.assertTrue(any("'{0}'".format(old_status) in c["problem"] for c in report["conflicts"]))


if __name__ == "__main__":
    unittest.main()
