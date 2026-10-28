#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""
xlsx_shift_rows.py — Shift row references in an unpacked xlsx working directory
after inserting or deleting rows in one sheet.

Usage:
    # Insert 2 rows at row 5 of the first sheet (rows 5+ move down by 2)
    python3 xlsx_shift_rows.py <work_dir> insert 5 2

    # Delete 1 row at row 8 of "Budget" (row 8 is removed, rows 9+ move up by 1)
    python3 xlsx_shift_rows.py <work_dir> delete 8 1 --sheet "Budget"

What it updates:
  In the edited sheet:
  - <row r="N"> and <c r="XN"> in sheetData (deleted rows are removed)
  - <f> formulas (and the ref of shared formulas)
  - <mergeCell>, <conditionalFormatting>, <dataValidation>, <hyperlink> ranges and formulas
  - <dimension ref="A1:D20">
  - its tables (xl/tables/*.xml)
  Everywhere else, only references that name the edited sheet (Sheet1!B7):
  - formulas in other sheets, chart series, pivot cache sources, defined names

A reference to a deleted row becomes #REF!, as in Excel; a range loses the deleted rows.

IMPORTANT: Run this script on the UNPACKED directory before repacking.
After running, repack with xlsx_pack.py and re-validate with formula_check.py.

Limitations:
  - Structured table references (Table[@Column]) are NOT updated.
  - External workbook links in xl/externalLinks/ are NOT updated.
  - 3D references (Sheet1:Sheet3!A1) are NOT updated.
"""

from __future__ import annotations

import argparse
import os
import re
import xml.etree.ElementTree as ET

from _xlsx import find_sheet, load, sheet_tables, sheets, tag, write_tree

SHEET = r"(?:'(?:[^']|'')+'|[A-Za-z_][\w.]*)"
CELL = r"\$?[A-Z]{1,3}\$?\d+"
TOKEN = re.compile(
    r'(?P<str>"(?:[^"]|"")*")'
    rf"|(?<![\w.])(?P<ref>(?:(?P<sheet>{SHEET})!)?(?:(?P<a>{CELL})(?::(?P<b>{CELL}))?|(?P<rows>\$?\d+:\$?\d+)))(?![\w(.])"
    r"|[A-Za-z_][\w.]*"
    r"|.",
    re.S,
)
CELL_PARTS = re.compile(r"(\$?[A-Z]+\$?)(\d+)")


class Shift:
    def __init__(self, op: str, at: int, count: int, target: str):
        self.op, self.at, self.count, self.target = op, at, count, target

    def row(self, r: int, kind: str = "single") -> int | None:
        """New row number; None when a single reference lands on a deleted row."""
        if self.op == "insert":
            return r + self.count if r >= self.at else r
        last = self.at + self.count - 1
        if r < self.at:
            return r
        if r > last:
            return r - self.count
        if kind == "single":
            return None
        return self.at if kind == "start" else self.at - 1

    def _cell(self, cell: str, kind: str) -> str | None:
        head, r = CELL_PARTS.fullmatch(cell).groups()
        new = self.row(int(r), kind)
        return None if new is None else f"{head}{new}"

    def area(self, area: str) -> str | None:
        """A1, A1:B9 or 5:7 in the edited sheet; None when every row of it is deleted."""
        if ":" not in area:
            return self._cell(area, "single")
        a, b = area.split(":", 1)
        if CELL_PARTS.fullmatch(a) and CELL_PARTS.fullmatch(b):
            na, nb = self._cell(a, "start"), self._cell(b, "end")
            ra, rb = int(CELL_PARTS.fullmatch(na).group(2)), int(CELL_PARTS.fullmatch(nb).group(2))
            return None if ra > rb else f"{na}:{nb}"
        da, db = a.lstrip("$"), b.lstrip("$")
        ra, rb = self.row(int(da), "start"), self.row(int(db), "end")
        if ra > rb:
            return None
        return f"{a[:len(a) - len(da)]}{ra}:{b[:len(b) - len(db)]}{rb}"

    def sqref(self, sqref: str) -> str:
        """Space-separated areas; the deleted ones are dropped."""
        return " ".join(a for a in (self.area(p) for p in sqref.split()) if a)

    def formula(self, text: str, host: str | None) -> str:
        """Shift references to the edited sheet; `host` is the sheet unqualified refs point to."""
        def fix(m: re.Match) -> str:
            if not m.group("ref"):
                return m.group(0)
            sheet = m.group("sheet")
            name = sheet.strip("'").replace("''", "'") if sheet else host
            if name != self.target:
                return m.group(0)
            area = m.group("rows") or (f"{m.group('a')}:{m.group('b')}" if m.group("b") else m.group("a"))
            new = self.area(area)
            return f"{sheet}!" * bool(sheet) + (new or "#REF!")
        return TOKEN.sub(fix, text)


def update_formulas(root: ET.Element, shift: Shift, host: str | None) -> int:
    changes = 0
    for el in root.iter():
        local = el.tag.rsplit("}", 1)[-1]
        if local in ("f", "formula", "formula1", "formula2", "definedName") and el.text:
            new = shift.formula(el.text, host)
            if new != el.text:
                el.text = new
                changes += 1
    return changes


def update_ranges(root: ET.Element, shift: Shift, name: str, attr: str, container: str | None) -> int:
    """Shift a range attribute; an element left with no range is removed."""
    changes = 0
    parents = root.iter(tag(container)) if container else [root]
    for parent in list(parents):
        for el in list(parent.iter(tag(name))):
            old = el.get(attr)
            if old is None:
                continue
            new = shift.sqref(old)
            if new == old:
                continue
            changes += 1
            if new:
                el.set(attr, new)
            else:
                for holder in parent.iter():
                    if el in list(holder):
                        holder.remove(el)
                        break
        if container and parent.get("count") is not None:
            parent.set("count", str(len(parent.findall(tag(name)))))
    return changes


def process_target_sheet(path: str, shift: Shift) -> int:
    tree = load(path)
    root = tree.getroot()
    changes = 0

    for dim in root.iter(tag("dimension")):
        new = shift.sqref(dim.get("ref", ""))
        if new and new != dim.get("ref"):
            dim.set("ref", new)
            changes += 1

    sheet_data = root.find(tag("sheetData"))
    if sheet_data is not None:
        for row_el in list(sheet_data):
            if row_el.get("r") is None:
                continue
            new_r = shift.row(int(row_el.get("r")))
            if new_r is None:
                sheet_data.remove(row_el)
                changes += 1
                continue
            if new_r == int(row_el.get("r")):
                continue
            row_el.set("r", str(new_r))
            changes += 1
            for cell in row_el:
                if cell.get("r"):
                    cell.set("r", CELL_PARTS.sub(lambda m: f"{m.group(1)}{new_r}", cell.get("r")))
        for f_el in root.iter(tag("f")):
            if f_el.get("ref"):
                new = shift.sqref(f_el.get("ref"))
                if new and new != f_el.get("ref"):
                    f_el.set("ref", new)
                    changes += 1

    changes += update_formulas(root, shift, shift.target)
    changes += update_ranges(root, shift, "mergeCell", "ref", "mergeCells")
    changes += update_ranges(root, shift, "conditionalFormatting", "sqref", None)
    changes += update_ranges(root, shift, "dataValidation", "sqref", "dataValidations")
    changes += update_ranges(root, shift, "hyperlink", "ref", "hyperlinks")

    if changes:
        write_tree(tree, path)
    return changes


def process_formulas_only(path: str, shift: Shift, host: str | None) -> int:
    tree = load(path)
    changes = update_formulas(tree.getroot(), shift, host)
    if changes:
        write_tree(tree, path)
    return changes


def process_table(path: str, shift: Shift) -> int:
    tree = load(path)
    changes = 0
    for el in tree.getroot().iter():
        if el.get("ref"):
            new = shift.sqref(el.get("ref"))
            if new and new != el.get("ref"):
                el.set("ref", new)
                changes += 1
    if changes:
        write_tree(tree, path)
    return changes


def process_pivot_cache(path: str, shift: Shift) -> int:
    tree = load(path)
    changes = 0
    for el in tree.getroot().iter():
        if el.tag.endswith("}worksheetSource") and el.get("sheet") == shift.target and el.get("ref"):
            new = shift.sqref(el.get("ref"))
            if new and new != el.get("ref"):
                el.set("ref", new)
                changes += 1
    if changes:
        write_tree(tree, path)
    return changes


def xml_files(folder: str):
    if os.path.isdir(folder):
        for fname in sorted(os.listdir(folder)):
            if fname.endswith(".xml"):
                yield os.path.join(folder, fname)


def main() -> None:
    parser = argparse.ArgumentParser(description="Shift row references after inserting or deleting rows.")
    parser.add_argument("work_dir")
    parser.add_argument("operation", choices=("insert", "delete"))
    parser.add_argument("at", type=int, help="first row inserted or deleted (1-based)")
    parser.add_argument("count", type=int)
    parser.add_argument("--sheet", default=None, help="Sheet name (default: first)")
    args = parser.parse_args()

    if args.at < 1 or args.count < 1:
        parser.error("at and count must be 1 or more")
    if not os.path.isdir(args.work_dir):
        parser.error(f"directory not found: {args.work_dir}")

    target, target_path = find_sheet(args.work_dir, args.sheet)
    shift = Shift(args.operation, args.at, args.count, target)
    print(f"Operation : {args.operation} {args.count} row(s) at row {args.at} of '{target}'")
    print(f"Work dir  : {args.work_dir}")
    print()

    total = 0

    def report(n: int, path: str) -> None:
        nonlocal total
        if n:
            print(f"  Updated {n:3d} references in {os.path.relpath(path, args.work_dir)}")
            total += n

    for name, path in sheets(args.work_dir):
        if os.path.normcase(path) == os.path.normcase(target_path):
            report(process_target_sheet(path, shift), path)
        else:
            report(process_formulas_only(path, shift, name), path)
    for path in sheet_tables(target_path):
        report(process_table(path, shift), path)
    for path in xml_files(os.path.join(args.work_dir, "xl", "charts")):
        report(process_formulas_only(path, shift, None), path)
    for path in xml_files(os.path.join(args.work_dir, "xl", "pivotCaches")):
        if "Definition" in os.path.basename(path):
            report(process_pivot_cache(path, shift), path)
    workbook = os.path.join(args.work_dir, "xl", "workbook.xml")
    report(process_formulas_only(workbook, shift, None), workbook)

    print()
    print(f"Total changes: {total}")
    print("Structured table references (Table[@Col]) are NOT updated.")
    print()
    print("Next steps:")
    print(f"  1. python3 xlsx_pack.py {args.work_dir} output.xlsx")
    print("  2. python3 formula_check.py output.xlsx")


if __name__ == "__main__":
    main()
