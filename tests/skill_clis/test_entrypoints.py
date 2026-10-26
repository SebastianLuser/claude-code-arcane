"""
Eleven scripts were documented as commands (`python scripts/x.py ...`) but had
no __main__, so running them printed nothing and exited 0. These specs run each
one as its SKILL.md does, on the sample input the skill ships.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SKILLS = Path(__file__).resolve().parents[2] / "skills"
TECH = SKILLS / "tech-stack-evaluator"
AWS = SKILLS / "aws-solution-architect"
TDD = SKILLS / "tdd-guide"


def run(script, *args):
    result = subprocess.run(
        [sys.executable, "-I", str(script), *map(str, args)],
        capture_output=True, text=True, encoding="utf-8", timeout=60,
    )
    if result.returncode != 0:
        raise AssertionError(f"{script.name} exited {result.returncode}: {result.stderr}")
    return result.stdout


def write_json(directory, name, data):
    path = Path(directory) / name
    path.write_text(json.dumps(data), encoding="utf-8")
    return path


class TechStackEvaluatorTest(unittest.TestCase):
    def test_comparator_picks_a_winner(self):
        out = json.loads(run(TECH / "scripts" / "stack_comparator.py", TECH / "assets" / "sample_input_structured.json"))
        self.assertIn(out["recommendation"], out["technologies"])

    def test_tco_totals_the_sample(self):
        out = json.loads(run(TECH / "scripts" / "tco_calculator.py", TECH / "assets" / "sample_input_tco.json"))
        self.assertTrue(out["total_tco"].startswith("$"))

    def test_analyzers_read_their_data_file(self):
        cases = {
            "ecosystem_analyzer.py": {"technology": "react", "github": {"stars": 200000}},
            "migration_analyzer.py": {"source_technology": "angular-1.x", "target_technology": "react"},
            # An unknown standard used to crash the report with KeyError: 'readiness_level'.
            "security_assessor.py": {"technology": "express", "compliance_requirements": ["SOC2", "ISO-9001"]},
        }
        with tempfile.TemporaryDirectory() as tmp:
            for script, data in cases.items():
                with self.subTest(script=script):
                    out = json.loads(run(TECH / "scripts" / script, write_json(tmp, "in.json", data)))
                    self.assertTrue(out)


class AwsSolutionArchitectTest(unittest.TestCase):
    def test_designer_writes_the_design(self):
        with tempfile.TemporaryDirectory() as tmp:
            design = Path(tmp) / "design.json"
            run(AWS / "scripts" / "architecture_designer.py", "--input", AWS / "assets" / "sample_input.json", "--output", design)
            self.assertIn("pattern_name", json.loads(design.read_text(encoding="utf-8"))["architecture"])

    def test_cost_optimizer_reports_the_spend(self):
        with tempfile.TemporaryDirectory() as tmp:
            resources = write_json(tmp, "resources.json", {"ec2_instances": []})
            out = json.loads(run(AWS / "scripts" / "cost_optimizer.py", "--resources", resources, "--monthly-spend", 2000))
            self.assertEqual(out["analysis"]["current_monthly_spend"], 2000)


class TddGuideTest(unittest.TestCase):
    def test_coverage_of_the_sample_report(self):
        out = json.loads(run(TDD / "scripts" / "coverage_analyzer.py", "--report", TDD / "assets" / "sample_coverage_report.lcov"))
        self.assertIn("line_coverage", out["summary"])

    def test_generates_stubs_from_the_sample_requirements(self):
        for sample, framework, marker in [("python", "pytest", "def test_"), ("typescript", "jest", "it(")]:
            with self.subTest(sample=sample):
                out = run(TDD / "scripts" / "test_generator.py", "--input", TDD / "assets" / f"sample_input_{sample}.json",
                          "--framework", framework)
                self.assertIn(marker, out)

    def test_fixtures_follow_the_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            schema = write_json(tmp, "schema.json", {"email": {"type": "email"}})
            out = json.loads(run(TDD / "scripts" / "fixture_generator.py", "--schema", schema, "--count", 3, "--seed", 1))
            self.assertEqual(len(out), 3)

    def test_red_phase_needs_a_failing_test(self):
        with tempfile.TemporaryDirectory() as tmp:
            test = Path(tmp) / "test_add.py"
            test.write_text("def test_add():\n    assert add(1, 2) == 3\n", encoding="utf-8")
            out = json.loads(run(TDD / "scripts" / "tdd_workflow.py", "--phase", "red", "--test", test, "--status", "failed"))
            self.assertEqual(out["next_phase"], "GREEN")


if __name__ == "__main__":
    unittest.main()
