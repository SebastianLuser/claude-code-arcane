"""
Specs for skill scripts that crashed, wrote invalid code or reported the wrong thing:
network_map, hipaa_risk_assessment, prompt_tester, vulnerability_scanner and
openapi_to_mcp. Each runs as its SKILL.md runs it.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import ast
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILLS = Path(__file__).resolve().parents[2] / "skills"


def run(script, *args, check=True):
    result = subprocess.run(
        [sys.executable, "-I", "-X", "utf8", str(script), *map(str, args)],
        capture_output=True, text=True, encoding="utf-8", timeout=60, stdin=subprocess.DEVNULL,
    )
    if check and result.returncode != 0:
        raise AssertionError(f"{Path(script).name} exited {result.returncode}: {result.stderr}")
    return result


class NetworkMapTest(unittest.TestCase):
    def test_company_contacts_are_newest_first_by_date_not_by_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            csv = Path(tmp) / "Connections.csv"
            csv.write_text(
                "Notes:\n\nFirst Name,Last Name,URL,Email Address,Company,Position,Connected On\n"
                "Old,One,,,Acme,Dev,30 Dec 2019\n"
                "New,Two,,,Acme,Dev,02 Jan 2024\n",
                encoding="utf-8",
            )
            out = run(SKILLS / "network-map" / "scripts" / "network_map.py", "--csv", csv, "--company", "acme").stdout
        self.assertLess(out.index("New Two"), out.index("Old One"))


class HipaaRiskAssessmentTest(unittest.TestCase):
    SCRIPT = SKILLS / "fda-consultant-specialist" / "scripts" / "hipaa_risk_assessment.py"

    def test_default_run_lists_gaps_and_recommendations(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = run(self.SCRIPT, tmp).stdout
            data = json.loads(run(self.SCRIPT, tmp, "--json").stdout)
        self.assertIn("Security Management Process", out)
        self.assertTrue(data["recommendations"])
        self.assertNotIn("documentation", data["categories"][0]["controls"][0])


class PromptTesterTest(unittest.TestCase):
    def test_a_prompt_with_quotes_and_spaces_reaches_the_runner_as_one_argument(self):
        with tempfile.TemporaryDirectory() as tmp:
            # The runner answers with its first argument only.
            echo = Path(tmp) / "echo_first.py"
            echo.write_text("import sys\nprint(sys.argv[1])\n", encoding="utf-8")
            payload = {
                "prompt_a": "Don't stop: reply to the user",
                "prompt_b": "plain",
                "cases": [{"id": "c1", "input": "hi", "expected_contains": ["Don't stop: reply to the user"]}],
                "runner_cmd": f"{Path(sys.executable).as_posix()} {echo.as_posix()} {{prompt}} {{input}}",
            }
            spec = Path(tmp) / "payload.json"
            spec.write_text(json.dumps(payload), encoding="utf-8")
            result = run(SKILLS / "prompt-engineer-toolkit" / "scripts" / "prompt_tester.py", "--input", spec, "--format", "json")
        report = json.loads(result.stdout)
        self.assertEqual(report["case_scores"]["prompt_a"][0]["matched_expected"], 1)


class VulnerabilityScannerTest(unittest.TestCase):
    SCRIPT = SKILLS / "security-pen-testing" / "scripts" / "vulnerability_scanner.py"

    def scan(self, files):
        with tempfile.TemporaryDirectory() as tmp:
            for name, text in files.items():
                (Path(tmp) / name).write_text(text, encoding="utf-8")
            out = run(self.SCRIPT, "--source", tmp, "--json", check=False).stdout
        return json.loads(out)["source_findings"]

    def test_finds_secrets_in_config_files_and_masks_them(self):
        secret = "sk9f8a7b6c5d4e3f2a1b0c"
        findings = self.scan({".env": f"API_KEY={secret}\n", "config.yaml": f"password: {secret}\n"})
        files = {Path(f["file_path"]).name for f in findings if f["rule_id"] == "SEC-001"}
        self.assertEqual(files, {".env", "config.yaml"})
        self.assertNotIn(secret, json.dumps(findings))

    def test_yaml_load_with_safe_loader_is_not_flagged(self):
        findings = self.scan({"a.py": "yaml.load(f, Loader=yaml.SafeLoader)\nyaml.load(f)\npickle.loads(b)\n"})
        lines = sorted(f["line_number"] for f in findings if f["rule_id"] == "DESER-001")
        self.assertEqual(lines, [2, 3])


class OpenApiToMcpTest(unittest.TestCase):
    SCRIPT = SKILLS / "mcp-server-builder" / "scripts" / "openapi_to_mcp.py"
    SPEC = {
        "paths": {
            "/import": {"post": {"operationId": "import", "summary": 'Load """data""" and it\'s \\ fine'}},
            "/2fa": {"get": {"operationId": "2fa_check", "summary": "Check it's on"}},
        }
    }

    def generate(self, out_dir, *extra):
        spec = Path(out_dir) / "spec.json"
        spec.write_text(json.dumps(self.SPEC), encoding="utf-8")
        return run(self.SCRIPT, "--input", spec, "--server-name", "demo", "--output-dir", out_dir, *extra, check=False)

    def test_python_scaffold_parses_with_hostile_names_and_summaries(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(self.generate(tmp).returncode, 0)
            tree = ast.parse((Path(tmp) / "server.py").read_text(encoding="utf-8"))
        functions = {n.name: ast.get_docstring(n) for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}
        self.assertEqual(functions["op_import"], 'Load """data""" and it\'s \\ fine')
        self.assertIn("op_2fa_check", functions)

    def test_typescript_strings_survive_quotes(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.generate(tmp, "--language", "typescript")
            text = (Path(tmp) / "server.ts").read_text(encoding="utf-8")
        self.assertIn(json.dumps("Check it's on"), text)

    def test_refuses_to_overwrite_without_force(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "server.py").write_text("# my edits\n", encoding="utf-8")
            result = self.generate(tmp)
            self.assertEqual(result.returncode, 2)
            self.assertEqual((Path(tmp) / "server.py").read_text(encoding="utf-8"), "# my edits\n")
            self.assertEqual(self.generate(tmp, "--force").returncode, 0)


if __name__ == "__main__":
    unittest.main()
