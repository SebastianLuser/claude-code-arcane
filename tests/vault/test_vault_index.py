"""
Specs for skills/vault-recall/scripts/vault_index.py - tokenizer, incremental
refresh, BM25 search with alias expansion, and the inventory, over fixture
vaults in a tmpdir. No network.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import os
import shutil
import sys
import tempfile
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "skills" / "vault-recall" / "scripts"))

import vault_index as vi  # noqa: E402


class TestNormalizeTerm(unittest.TestCase):
    def test_folds_accents_so_the_query_does_not_have_to_match_them(self):
        self.assertEqual(vi.normalize_term("Résumé"), vi.normalize_term("resume"))
        self.assertEqual(vi.normalize_term("CAFÉ"), "cafe")

    def test_plural_and_singular_collapse_to_the_same_term(self):
        # Spanish pairs on purpose: the -es rule exists for Spanish plurals.
        for plural, singular in [
            ("indices", "indice"),    # -s on a vowel
            ("tablas", "tabla"),
            ("ciudades", "ciudad"),   # -es on a consonant that takes it
            ("razones", "razon"),
            ("errores", "error"),
            ("bases", "base"),        # not the Spanish -es rule despite ending in -es
            ("tables", "table"),
            ("notes", "note"),
        ]:
            with self.subTest(plural=plural):
                self.assertEqual(vi.normalize_term(plural), vi.normalize_term(singular))

    def test_leaves_short_words_alone(self):
        self.assertEqual(vi.normalize_term("bus"), "bus")
        self.assertEqual(vi.normalize_term("gas"), "gas")


class TestTokenize(unittest.TestCase):
    def test_drops_stopwords_and_punctuation(self):
        self.assertEqual(vi.tokenize("the index of the table."), ["index", "table"])

    def test_every_language_pack_applies_at_once(self):
        # One vault mixes languages, so the stopwords of every pack are dropped.
        self.assertEqual(vi.tokenize("la tabla and the table"), ["tabla", "table"])

    def test_keeps_numbers_and_folds_case(self):
        self.assertEqual(vi.tokenize("Postgres 16"), ["postgr", "16"])


class TestReadNote(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix="vault-index-test-")

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def write(self, rel, body):
        full = os.path.join(self.root, rel.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as handle:
            handle.write(body)
        return full

    def test_title_and_aliases_weigh_more_than_a_body_mention(self):
        full = self.write("Hubs/Postgres.md",
                          "---\ntype: hub\naliases:\n  - PG\n---\nmentions postgres once\n")

        _, record = vi.read_note(full, self.root)

        self.assertEqual(record["title"], "Postgres")
        self.assertEqual(record["aliases"], ["PG"])
        self.assertEqual(record["terms"]["pg"], vi.TITLE_BOOST)
        # once in the body plus the title boost
        self.assertEqual(record["terms"]["postgr"], 1 + vi.TITLE_BOOST)

    def test_ignores_fenced_code_and_collects_links(self):
        full = self.write("A.md", "---\ntype: atomic\n---\n[[Real]]\n```\n[[Example]] fakeword\n```\n")

        _, record = vi.read_note(full, self.root)

        self.assertEqual(record["links"], ["Real"])
        self.assertNotIn("fakeword", record["terms"])


class IndexFixture(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix="vault-index-test-")
        os.mkdir(os.path.join(self.root, ".obsidian"))

    def tearDown(self):
        shutil.rmtree(self.root, ignore_errors=True)

    def note(self, rel, body):
        full = os.path.join(self.root, rel.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as handle:
            handle.write(body)
        return full

    def refresh(self, **roles):
        merged = dict(vi.DEFAULT_ROLES)
        merged.update(roles)
        return vi.refresh(self.root, merged)


class TestRefresh(IndexFixture):
    def test_writes_a_dotfile_index_obsidian_ignores(self):
        self.note("A.md", "---\ntype: atomic\n---\nbody\n")

        self.refresh()

        self.assertTrue(os.path.isfile(os.path.join(self.root, vi.INDEX_FILENAME)))
        self.assertTrue(vi.INDEX_FILENAME.startswith("."))

    def test_second_run_without_changes_reindexes_nothing(self):
        self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        self.refresh()

        _, stats = self.refresh()

        self.assertEqual(stats, {"added": 0, "updated": 0, "removed": 0, "total": 1})

    def test_reindexes_only_the_note_that_changed(self):
        path = self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        self.note("B.md", "---\ntype: atomic\n---\nother\n")
        self.refresh()
        with open(path, "a", encoding="utf-8") as handle:
            handle.write("more text\n")
        os.utime(path, (time.time() + 1, time.time() + 1))

        _, stats = self.refresh()

        self.assertEqual((stats["added"], stats["updated"], stats["total"]), (0, 1, 2))

    def test_drops_a_deleted_note_from_the_index(self):
        path = self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        self.refresh()
        os.remove(path)

        cache, stats = self.refresh()

        self.assertEqual(stats["removed"], 1)
        self.assertEqual(cache["docs"], {})

    def test_a_stale_index_version_is_rebuilt_instead_of_trusted(self):
        self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        self.refresh()
        with open(os.path.join(self.root, vi.INDEX_FILENAME), "r+", encoding="utf-8") as handle:
            cache = json.load(handle)
            cache["version"] = vi.INDEX_VERSION + 1
            handle.seek(0)
            handle.truncate()
            json.dump(cache, handle)

        self.assertIsNone(vi.load_index(self.root))

    def test_a_corrupt_index_does_not_crash_the_next_run(self):
        with open(os.path.join(self.root, vi.INDEX_FILENAME), "w", encoding="utf-8") as handle:
            handle.write("{not json")

        self.assertIsNone(vi.load_index(self.root))

        self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        _, stats = self.refresh()
        self.assertEqual(stats["added"], 1)


class TestSearch(IndexFixture):
    def test_ranks_the_note_about_the_term_over_one_that_mentions_it(self):
        self.note("03_Resources/Partial indexes.md",
                  "---\ntype: atomic\n---\na partial index covers only some rows\n")
        self.note("_inbox/2026-07-20.md",
                  "---\ntype: dump\n---\ntalk about the index at the meeting, and about a thousand other things "
                  + "word " * 80)
        cache, _ = self.refresh()

        results, _ = vi.search(cache, "partial index", 10)

        self.assertEqual(results[0]["path"], "03_Resources/Partial indexes.md")

    def test_expands_the_query_with_the_aliases_of_a_hub(self):
        self.note("Hubs/Postgres.md", "---\ntype: hub\naliases:\n  - PG\n---\ndatabase\n")
        self.note("03_Resources/Vacuum.md", "---\ntype: atomic\n---\nin postgres the autovacuum\n")
        cache, _ = self.refresh()

        results, expanded = vi.search(cache, "PG", 10)
        paths = [r["path"] for r in results]

        self.assertIn("postgr", expanded)
        self.assertIn("03_Resources/Vacuum.md", paths)

    def test_any_note_can_teach_a_synonym_not_only_a_hub(self):
        # Aliases are the synonym mechanism, so restricting them to hub notes
        # would mean the vault can only learn vocabulary in one folder.
        self.note("03_Resources/OKR.md",
                  "---\ntype: atomic\naliases:\n  - objectives and key results\n---\ngoal framework\n")
        self.note("03_Resources/Quarter.md",
                  "---\ntype: atomic\n---\nwe reviewed the objectives and key results for the quarter\n")
        cache, _ = self.refresh()

        results, expanded = vi.search(cache, "OKR", 10)

        self.assertIn("objective", expanded)
        self.assertIn("03_Resources/Quarter.md", [r["path"] for r in results])

    def test_no_expand_keeps_the_query_literal(self):
        self.note("Hubs/Postgres.md", "---\ntype: hub\naliases:\n  - PG\n---\ndatabase\n")
        self.note("03_Resources/Vacuum.md", "---\ntype: atomic\n---\nin postgres the autovacuum\n")
        cache, _ = self.refresh()

        results, expanded = vi.search(cache, "PG", 10, expand=False)

        self.assertEqual(expanded, ["pg"])
        self.assertNotIn("03_Resources/Vacuum.md", [r["path"] for r in results])

    def test_a_literal_hit_outranks_one_found_only_through_a_synonym(self):
        self.note("Hubs/Postgres.md", "---\ntype: hub\naliases:\n  - PG\n---\nengine\n")
        self.note("03_Resources/Literal.md", "---\ntype: atomic\n---\npg pg pg\n")
        self.note("03_Resources/Synonym.md", "---\ntype: atomic\n---\npostgres postgres postgres\n")
        cache, _ = self.refresh()

        results, _ = vi.search(cache, "pg", 10)
        ranking = [r["path"] for r in results]

        self.assertLess(ranking.index("03_Resources/Literal.md"),
                        ranking.index("03_Resources/Synonym.md"))

    def test_a_query_of_only_stopwords_returns_nothing_rather_than_everything(self):
        self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        cache, _ = self.refresh()

        results, expanded = vi.search(cache, "of the and", 10)

        self.assertEqual(results, [])
        self.assertEqual(expanded, [])

    def test_limit_zero_returns_every_match(self):
        for i in range(5):
            self.note("N{0}.md".format(i), "---\ntype: atomic\n---\nindex\n")
        cache, _ = self.refresh()

        self.assertEqual(len(vi.search(cache, "index", 0)[0]), 5)


class TestRelated(IndexFixture):
    def test_ranks_the_note_sharing_the_most_distinctive_vocabulary(self):
        self.note("03_Resources/Partial indexes.md",
                  "---\ntype: atomic\n---\na partial index covers only the rows queried\n")
        self.note("03_Resources/Vacuum.md",
                  "---\ntype: atomic\n---\nthe autovacuum cleans the dead rows of the index\n")
        self.note("03_Resources/Cooking.md", "---\ntype: atomic\n---\npancake recipe\n")
        cache, _ = self.refresh()

        found, _ = vi.related(cache, "03_Resources/Partial indexes.md", 10)
        paths = [r["path"] for r in found["results"]]

        self.assertEqual(paths[0], "03_Resources/Vacuum.md")
        self.assertNotIn("03_Resources/Cooking.md", paths)

    def test_resolves_a_note_by_title_and_never_returns_itself(self):
        self.note("03_Resources/One.md", "---\ntype: atomic\n---\npartial index\n")
        self.note("03_Resources/Other.md", "---\ntype: atomic\n---\npartial index\n")
        cache, _ = self.refresh()

        found, _ = vi.related(cache, "One", 10)

        self.assertEqual(found["target"], "03_Resources/One.md")
        self.assertNotIn("03_Resources/One.md", [r["path"] for r in found["results"]])

    def test_reports_an_unknown_note_instead_of_returning_nothing(self):
        self.note("A.md", "---\ntype: atomic\n---\nbody\n")
        cache, _ = self.refresh()

        found, ambiguous = vi.related(cache, "Ghost", 10)

        self.assertIsNone(found)
        self.assertEqual(ambiguous, [])

    def test_flags_an_ambiguous_title_rather_than_picking_one(self):
        self.note("a/Dup.md", "---\ntype: atomic\n---\none\n")
        self.note("b/Dup.md", "---\ntype: atomic\n---\ntwo\n")
        cache, _ = self.refresh()

        found, ambiguous = vi.related(cache, "Dup", 10)

        self.assertIsNone(found)
        self.assertEqual(sorted(ambiguous), ["a/Dup.md", "b/Dup.md"])


class TestInventory(IndexFixture):
    def test_lists_hubs_with_aliases_projects_and_areas(self):
        self.note("Hubs/Postgres.md", "---\ntype: hub\naliases:\n  - PG\n---\nx\n")
        self.note("01_Projects/Migration.md", "---\ntype: project\n---\nx\n")
        self.note("02_Areas/Health.md", "---\ntype: area\n---\nx\n")
        cache, _ = self.refresh()

        inv = vi.inventory(cache, cache["roles"])

        self.assertEqual(inv["hubs"], [{"path": "Hubs/Postgres.md", "title": "Postgres",
                                        "aliases": ["PG"]}])
        self.assertEqual([p["title"] for p in inv["projects"]], ["Migration"])
        self.assertEqual([a["title"] for a in inv["areas"]], ["Health"])

    def test_reports_the_dumps_that_never_got_a_daily(self):
        # Dumps carry a "dump" suffix so their filename does not collide with the
        # daily of the same date; the date still has to be picked up from it.
        self.note("_inbox/2026-07-20 dump.md", "---\ntype: dump\n---\nx\n")
        self.note("_inbox/2026-07-21 dump.md", "---\ntype: dump\n---\nx\n")
        self.note("Reflect/Daily/2026-07-21.md", "---\ntype: daily\n---\nx\n")
        cache, _ = self.refresh()

        inv = vi.inventory(cache, cache["roles"])

        self.assertEqual(inv["unprocessed_dumps"], ["2026-07-20"])
        self.assertEqual(inv["latest"]["daily"], "2026-07-21")

    def test_follows_a_role_override_instead_of_the_default_layout(self):
        self.note("People/Nacho.md", "---\ntype: hub\n---\nx\n")
        cache, _ = self.refresh(hubs="People")

        inv = vi.inventory(cache, cache["roles"])

        self.assertEqual([h["title"] for h in inv["hubs"]], ["Nacho"])

    def test_an_empty_vault_reports_no_latest_instead_of_crashing(self):
        cache, _ = self.refresh()

        inv = vi.inventory(cache, cache["roles"])

        self.assertEqual(inv["counts"]["notes"], 0)
        self.assertIsNone(inv["latest"]["daily"])
        self.assertEqual(inv["unprocessed_dumps"], [])


class TestParseRoles(unittest.TestCase):
    def test_overrides_one_role_and_keeps_the_rest(self):
        roles = vi.parse_roles(["hubs=People"])

        self.assertEqual(roles["hubs"], "People")
        self.assertEqual(roles["daily"], vi.DEFAULT_ROLES["daily"])

    def test_normalizes_separators_and_trailing_slashes(self):
        self.assertEqual(vi.parse_roles(["daily=notes\\days/"])["daily"], "notes/days")

    def test_rejects_an_unknown_role_and_a_malformed_pair(self):
        for bad in (["nope=x"], ["hubs"]):
            with self.subTest(bad=bad):
                with self.assertRaises(SystemExit):
                    vi.parse_roles(bad)


if __name__ == "__main__":
    unittest.main()
