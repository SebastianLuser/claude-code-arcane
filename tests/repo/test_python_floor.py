"""
Guards the Python floor the CI matrix claims for skill scripts.

`X | Y` annotations are 3.10+. They compile fine on 3.9, so `compileall` in CI
says nothing, and then the script raises TypeError at import on the version we
advertise as supported. `from __future__ import annotations` turns annotations
into strings and makes the syntax safe, which is why it counts as the fix.

Uses ast rather than a regex on purpose: the same pipe shows up in docstrings
("provider: aws | azure | gcp") and a check that cries wolf gets ignored.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import ast
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FUTURE_ANNOTATIONS = "annotations"


def skill_scripts():
    return sorted(REPO_ROOT.glob("skills/*/scripts/*.py"))


def has_future_annotations(tree):
    for node in tree.body:
        if isinstance(node, ast.ImportFrom) and node.module == "__future__":
            if any(alias.name == FUTURE_ANNOTATIONS for alias in node.names):
                return True
    return False


def union_annotations(tree):
    """Line numbers of every `X | Y` used as an annotation."""
    annotations = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            arguments = node.args
            every = (list(arguments.args) + list(arguments.kwonlyargs)
                     + list(getattr(arguments, "posonlyargs", [])))
            if arguments.vararg:
                every.append(arguments.vararg)
            if arguments.kwarg:
                every.append(arguments.kwarg)
            annotations.extend(a.annotation for a in every if a.annotation)
            if node.returns:
                annotations.append(node.returns)
        elif isinstance(node, ast.AnnAssign) and node.annotation:
            annotations.append(node.annotation)

    hits = []
    for annotation in annotations:
        for inner in ast.walk(annotation):
            if isinstance(inner, ast.BinOp) and isinstance(inner.op, ast.BitOr):
                hits.append(inner.lineno)
                break
    return sorted(set(hits))


class TestPythonFloor(unittest.TestCase):
    def test_no_pipe_unions_without_the_future_import(self):
        offenders = []
        for path in skill_scripts():
            source = path.read_text(encoding="utf-8", errors="replace")
            try:
                tree = ast.parse(source)
            except SyntaxError as e:
                self.fail("{0} does not parse: {1}".format(path.relative_to(REPO_ROOT), e))
            if has_future_annotations(tree):
                continue
            hits = union_annotations(tree)
            if hits:
                offenders.append("{0}: lines {1}".format(
                    path.relative_to(REPO_ROOT).as_posix(),
                    ", ".join(str(line) for line in hits),
                ))

        self.assertEqual(
            offenders, [],
            "these use 3.10-only `X | Y` annotations and would raise at import on "
            "Python 3.9, which CI tests. Add `from __future__ import annotations` "
            "at the top of each file:\n  " + "\n  ".join(offenders),
        )

    def test_the_audit_actually_scans_something(self):
        # A glob that silently matches nothing would make the guard above vacuous.
        self.assertGreater(len(skill_scripts()), 100)
