"""
Specs for skills/xlsx-generator/scripts/xlsx_shift_rows.py and xlsx_insert_row.py on an
unpacked two-sheet workbook shaped like the files Excel writes.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parents[2] / "skills" / "xlsx-generator" / "scripts"
sys.path.insert(0, str(SCRIPTS))

from xlsx_shift_rows import Shift  # noqa: E402

ROOT = ('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" mc:Ignorable="x14ac">')


def sheet(rows, extra=""):
    body = "".join(
        '<row r="{0}"><c r="A{0}"><v>{0}</v></c>{1}</row>'.format(r, f'<c r="B{r}"><f>{rows[r]}</f></c>' if rows[r] else "")
        for r in sorted(rows))
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n{ROOT}<sheetData>{body}</sheetData>{extra}</worksheet>\n'


def workbook(tmp):
    root = Path(tmp) / "work"
    (root / "xl" / "worksheets").mkdir(parents=True)
    (root / "xl" / "_rels").mkdir()
    (root / "xl" / "workbook.xml").write_text(
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
        '<sheet name="Sheet1" sheetId="1" r:id="rId1"/><sheet name="Sheet2" sheetId="2" r:id="rId2"/></sheets>'
        '<definedNames><definedName name="Total">Sheet1!$A$10</definedName></definedNames></workbook>',
        encoding="utf-8")
    (root / "xl" / "_rels" / "workbook.xml.rels").write_text(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="x/worksheet" Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" Type="x/worksheet" Target="worksheets/sheet2.xml"/></Relationships>',
        encoding="utf-8")
    rows = {r: None for r in range(1, 11)}
    (root / "xl" / "worksheets" / "sheet1.xml").write_text(
        sheet({**rows, 9: "LOG10(A9)", 3: "SUM(A1:A10)"}, '<mergeCells count="1"><mergeCell ref="C8:D8"/></mergeCells>'),
        encoding="utf-8")
    (root / "xl" / "worksheets" / "sheet2.xml").write_text(sheet({**rows, 2: "Sheet1!A7+A7"}), encoding="utf-8")
    return root


def run(script, *args):
    result = subprocess.run([sys.executable, "-X", "utf8", str(SCRIPTS / script), *map(str, args)],
                            capture_output=True, text=True, encoding="utf-8", timeout=60)
    if result.returncode != 0:
        raise AssertionError(f"{script} exited {result.returncode}: {result.stdout}{result.stderr}")


def read(root, name):
    return (root / "xl" / "worksheets" / name).read_text(encoding="utf-8")


def formulas(text):
    return re.findall(r"<f>([^<]*)</f>", text)


class FormulaShiftTest(unittest.TestCase):
    def test_function_names_with_digits_are_not_cell_references(self):
        self.assertEqual(Shift("insert", 5, 1, "S").formula("LOG10(A9)+ATAN2(A5,1)", "S"), "LOG10(A10)+ATAN2(A6,1)")

    def test_strings_and_scientific_numbers_are_left_alone(self):
        self.assertEqual(Shift("insert", 5, 1, "S").formula('"A7"&A7+1E5', "S"), '"A7"&A8+1E5')

    def test_a_deleted_row_becomes_ref_error_and_ranges_shrink(self):
        shift = Shift("delete", 8, 1, "S")
        self.assertEqual(shift.formula("A8+A9", "S"), "#REF!+A8")
        self.assertEqual(shift.formula("SUM(A8:A12)+SUM(A1:A10)", "S"), "SUM(A8:A11)+SUM(A1:A9)")


class ShiftRowsTest(unittest.TestCase):
    def test_insert_moves_only_the_edited_sheet(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = workbook(tmp)

            run("xlsx_shift_rows.py", root, "insert", 5, 1)

            self.assertEqual(formulas(read(root, "sheet1.xml")), ["SUM(A1:A11)", "LOG10(A10)"])
            self.assertEqual(formulas(read(root, "sheet2.xml")), ["Sheet1!A8+A7"])
            self.assertIn('<row r="10">', read(root, "sheet2.xml"))
            self.assertNotIn('<row r="11">', read(root, "sheet2.xml"))
            self.assertIn("Sheet1!$A$11", (root / "xl" / "workbook.xml").read_text(encoding="utf-8"))

    def test_delete_removes_the_row_instead_of_duplicating_one(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = workbook(tmp)

            run("xlsx_shift_rows.py", root, "delete", 8, 1)

            text = read(root, "sheet1.xml")
            rows = re.findall(r'<row r="(\d+)"', text)
            self.assertEqual(rows, [str(r) for r in range(1, 10)])
            self.assertNotIn("mergeCell ", text)
            self.assertIn('<mergeCells count="0"', text)

    def test_namespace_prefixes_and_ignorable_declarations_survive(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = workbook(tmp)

            run("xlsx_shift_rows.py", root, "insert", 2, 3)

            text = read(root, "sheet1.xml")
            self.assertIn(ROOT, text)
            self.assertNotIn("ns0:", text)

    def test_insert_row_shifts_the_sheet_it_inserts_into(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = workbook(tmp)

            run("xlsx_insert_row.py", root, "--at", 5, "--sheet", "Sheet2", "--values", "A=99")

            self.assertEqual(formulas(read(root, "sheet1.xml")), ["SUM(A1:A10)", "LOG10(A9)"])
            self.assertEqual(formulas(read(root, "sheet2.xml")), ["Sheet1!A7+A8"])
            self.assertIn('<row r="5"><c r="A5"><v>99</v>', re.sub(r"\s+(?=<)", "", read(root, "sheet2.xml")))


if __name__ == "__main__":
    unittest.main()
