"""Specs for hooks/session_watch.py: edit tracking, loop/scope/context warnings and the Stop check."""
from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

HOOK = Path(__file__).resolve().parents[2] / "hooks" / "session_watch.py"
spec = importlib.util.spec_from_file_location("session_watch", HOOK)
watch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watch)


class WatchTestCase(unittest.TestCase):
    def setUp(self):
        self.project = tempfile.mkdtemp(prefix="arcane watch ")

    def tool(self, name: str, tool_input: dict, session: str = "s1") -> list[str]:
        return watch.post_tool({"session_id": session, "tool_name": name, "tool_input": tool_input}, self.project)

    def edit(self, rel: str, session: str = "s1") -> list[str]:
        path = Path(self.project, rel)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("x\n")
        return self.tool("Edit", {"file_path": str(path)}, session)


class PostTool(WatchTestCase):
    def test_records_edited_files_once(self):
        self.edit("src/a.ts")
        self.edit("src/a.ts")
        state = watch.load_state(self.project, "s1")
        self.assertEqual(len(state["pending"]), 1)

    def test_warns_on_the_fifth_identical_call_and_only_once(self):
        warnings = [self.tool("Bash", {"command": "npm test"}) for _ in range(6)]
        self.assertEqual([bool(w) for w in warnings], [False, False, False, False, True, False])
        self.assertIn("5 times in a row", warnings[4][0])

    def test_a_different_description_does_not_hide_a_loop(self):
        warnings = [self.tool("Bash", {"command": "npm test", "description": f"call {i}"}) for i in range(5)]
        self.assertTrue(warnings[4])

    def test_varied_calls_are_not_a_loop(self):
        for i in range(8):
            self.assertEqual(self.tool("Bash", {"command": f"echo {i % 2}"}), [])

    def test_warns_once_when_the_session_edits_many_files(self):
        warnings = [self.edit(f"src/f{i}.ts") for i in range(watch.SCOPE_FILES + 2)]
        hits = [w for w in warnings if any("files" in x for x in w)]
        self.assertEqual(len(hits), 1)

    def test_context_warning_uses_the_status_line_cache(self):
        state = Path(self.project, ".claude", "session-state")
        state.mkdir(parents=True, exist_ok=True)
        cache = state / "context.json"
        cache.write_text(json.dumps({"session_id": "s1", "used_percentage": 50}))
        self.assertEqual(self.tool("Read", {"file_path": "a"}), [])
        cache.write_text(json.dumps({"session_id": "s1", "used_percentage": 72}))
        self.assertIn("72%", self.tool("Read", {"file_path": "b"})[0])
        self.assertEqual(self.tool("Read", {"file_path": "c"}), [])
        cache.write_text(json.dumps({"session_id": "s1", "used_percentage": 88}))
        self.assertIn("88%", self.tool("Read", {"file_path": "d"})[0])

    def test_no_context_warning_without_a_known_window(self):
        self.assertEqual(self.tool("Read", {"file_path": "a"}), [])

    def test_another_sessions_cache_is_ignored(self):
        state = Path(self.project, ".claude", "session-state")
        state.mkdir(parents=True, exist_ok=True)
        (state / "context.json").write_text(json.dumps({"session_id": "other", "used_percentage": 95}))
        self.assertEqual(self.tool("Read", {"file_path": "a"}), [])

    def test_state_folder_ignores_itself(self):
        self.tool("Read", {"file_path": "a"})
        self.assertEqual(Path(self.project, ".claude", "session-state", ".gitignore").read_text().strip(), "*")


class StopCheck(WatchTestCase):
    def node_project(self, with_tsc: bool = True) -> Path:
        root = Path(self.project)
        (root / "package.json").write_text("{}")
        (root / "tsconfig.json").write_text("{}")
        bin_dir = root / "node_modules" / ".bin"
        bin_dir.mkdir(parents=True)
        names = ["prettier"] + (["tsc"] if with_tsc else [])
        for name in names:
            for suffix in ("", ".cmd"):
                (bin_dir / f"{name}{suffix}").write_text("")
        return root

    def test_plans_prettier_and_tsc_for_a_typescript_file(self):
        root = self.node_project()
        (root / "src").mkdir()
        file = root / "src" / "a.ts"
        file.write_text("x")
        [plan] = watch.plan_checks([str(file)], self.project)
        self.assertIn("prettier", os.path.basename(plan["format"][0]))
        self.assertIn("tsc", os.path.basename(plan["check"][0]))

    def test_never_plans_a_tool_the_project_does_not_have(self):
        root = Path(self.project)
        (root / "package.json").write_text("{}")
        file = root / "a.ts"
        file.write_text("x")
        [plan] = watch.plan_checks([str(file)], self.project)
        self.assertIsNone(plan["format"])
        self.assertIsNone(plan["check"])

    def test_only_errors_in_edited_files_count(self):
        output = "src/a.ts(3,5): error TS2322: bad\nsrc/old.ts(9,1): error TS1: older problem\n"
        found = watch.errors_in(output, [os.path.join(self.project, "src", "a.ts")], self.project)
        self.assertEqual(len(found), 1)
        self.assertIn("a.ts", found[0])

    def test_go_vet_lines_are_matched_too(self):
        output = "pkg/x.go:10:2: printf call has arguments but no formatting directives\n"
        found = watch.errors_in(output, [os.path.join(self.project, "pkg", "x.go")], self.project)
        self.assertEqual(len(found), 1)

    def test_blocks_with_the_errors_once_and_clears_the_pending_list(self):
        root = self.node_project()
        self.edit("src/a.ts")
        calls = []

        def fake_run(command, cwd):
            calls.append(command)
            if "--noEmit" in command:
                return 2, "src/a.ts(1,1): error TS2322: Type 'x' is not assignable\n"
            return 0, ""

        original = watch.run
        watch.run = fake_run
        try:
            decision = watch.stop({"session_id": "s1", "stop_hook_active": False}, str(root))
            again = watch.stop({"session_id": "s1", "stop_hook_active": False}, str(root))
        finally:
            watch.run = original
        self.assertEqual(decision["decision"], "block")
        self.assertIn("TS2322", decision["reason"])
        self.assertIsNone(again)
        self.assertEqual(len(calls), 2)

    def test_second_stop_of_a_turn_never_blocks(self):
        self.node_project()
        self.edit("src/a.ts")
        self.assertIsNone(watch.stop({"session_id": "s1", "stop_hook_active": True}, self.project))


if __name__ == "__main__":
    unittest.main()
