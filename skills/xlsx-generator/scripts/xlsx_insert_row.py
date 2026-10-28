#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""
xlsx_insert_row.py — Insert a new data row into a worksheet in an unpacked xlsx.

Usage examples:
    # Insert "Utilities" row at position 6, copying styles from row 5
    python3 xlsx_insert_row.py /tmp/work/ --at 6 \\
        --sheet "Budget FY2025" \\
        --text A=Utilities \\
        --values B=3000 C=3000 D=3500 E=3500 \\
        --formula 'F=SUM(B{row}:E{row})' \\
        --copy-style-from 5

What it does:
  1. Shifts the sheet's rows >= at down by 1 (calls xlsx_shift_rows.py)
  2. Adds text values to sharedStrings.xml
  3. Inserts new row with specified cells (text, numbers, formulas)
  4. Copies cell styles from a reference row
  5. Updates dimension ref

The shift operation automatically expands SUM formulas that span the
insertion point, so total-row formulas are updated without extra work.

IMPORTANT: Run on an UNPACKED directory (from xlsx_unpack.py).
After running, repack with xlsx_pack.py.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

from _xlsx import add_shared_string, col_number, find_sheet, load, tag, write_tree


def get_row_styles(ws_tree: ET.ElementTree, row_num: int) -> dict[str, int]:
    """Get {col_letter: style_index} for all cells in a row."""
    styles = {}
    for row_el in ws_tree.getroot().iter(tag("row")):
        if row_el.get("r") == str(row_num):
            for c in row_el:
                ref = c.get("r", "")
                col_str = re.match(r"([A-Z]+)", ref)
                if col_str:
                    styles[col_str.group(1)] = int(c.get("s", "0"))
            break
    return styles


def parse_kv(specs: list[str] | None) -> dict[str, str]:
    if not specs:
        return {}
    result = {}
    for spec in specs:
        col, _, val = spec.partition("=")
        result[col.upper()] = val
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Insert a new row into a worksheet in an unpacked xlsx")
    parser.add_argument("work_dir", help="Unpacked xlsx working directory")
    parser.add_argument("--at", type=int, required=True,
                        help="Row number to insert at (existing rows shift down)")
    parser.add_argument("--sheet", default=None, help="Sheet name (default: first)")
    parser.add_argument("--text", nargs="+", default=None,
                        help="Text cells: COL=VALUE (e.g., A=Utilities)")
    parser.add_argument("--values", nargs="+", default=None,
                        help="Numeric cells: COL=VALUE (e.g., B=3000 C=3000)")
    parser.add_argument("--formula", nargs="+", default=None,
                        help="Formula cells: COL=FORMULA with {row} (e.g., F=SUM(B{row}:E{row}))")
    parser.add_argument("--copy-style-from", type=int, default=None,
                        help="Copy cell styles from this row number")
    args = parser.parse_args()

    at = args.at
    text_cells = parse_kv(args.text)
    num_cells = parse_kv(args.values)
    formula_cells = parse_kv(args.formula)

    sheet_name, ws_path = find_sheet(args.work_dir, args.sheet)

    # Text cells first: a workbook without sharedStrings fails before anything is shifted.
    text_indices = {}
    for col, text in text_cells.items():
        text_indices[col] = add_shared_string(args.work_dir, text)
        print(f"  Added shared string: \"{text}\" → index {text_indices[col]}")

    # Step 1: Shift rows down using xlsx_shift_rows.py
    script_dir = os.path.dirname(os.path.abspath(__file__))
    shift_script = os.path.join(script_dir, "xlsx_shift_rows.py")

    print(f"Step 1: Shifting rows >= {at} down by 1...")
    result = subprocess.run(
        [sys.executable, shift_script, args.work_dir, "insert", str(at), "1", "--sheet", sheet_name],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"ERROR: shift_rows failed:\n{result.stderr}")
        sys.exit(1)
    print(result.stdout)

    # Step 2: Resolve worksheet path and get reference styles
    ws_tree = load(ws_path)

    ref_styles = {}
    if args.copy_style_from is not None:
        ref_styles = get_row_styles(ws_tree, args.copy_style_from)
        print(f"Step 2: Copied styles from row {args.copy_style_from}: {ref_styles}")

    # Step 4: Re-parse worksheet and build new row
    ws_tree = load(ws_path)
    root = ws_tree.getroot()
    sheet_data = root.find(tag("sheetData"))

    new_row = ET.Element(tag("row"))
    new_row.set("r", str(at))

    all_cols = sorted(
        set(list(text_cells) + list(num_cells) + list(formula_cells)),
        key=col_number,
    )

    for col in all_cols:
        cell = ET.SubElement(new_row, tag("c"))
        cell.set("r", f"{col}{at}")

        if col in ref_styles:
            cell.set("s", str(ref_styles[col]))

        if col in text_cells:
            cell.set("t", "s")
            v = ET.SubElement(cell, tag("v"))
            v.text = str(text_indices[col])
        elif col in num_cells:
            # Omit t attribute for numbers — "n" is the default per OOXML spec
            v = ET.SubElement(cell, tag("v"))
            v.text = str(num_cells[col])
        elif col in formula_cells:
            formula_text = formula_cells[col].replace("{row}", str(at)).lstrip("=")
            f_el = ET.SubElement(cell, tag("f"))
            f_el.text = formula_text
            # Use formula style from reference if available; it may differ
            # from the data style (e.g., black font vs blue font).
            # Look for the formula column's style specifically.
            if col in ref_styles:
                cell.set("s", str(ref_styles[col]))

    # Insert new row at the correct position in sheetData (sorted by row number)
    insert_idx = 0
    for i, row_el in enumerate(list(sheet_data)):
        r = row_el.get("r")
        if r and int(r) > at:
            insert_idx = i
            break
        insert_idx = i + 1

    sheet_data.insert(insert_idx, new_row)

    print(f"\nStep 3: Inserted row {at} with {len(all_cols)} cells:")
    for col in all_cols:
        if col in text_cells:
            print(f"  {col}{at} = \"{text_cells[col]}\" (text)")
        elif col in num_cells:
            print(f"  {col}{at} = {num_cells[col]} (number)")
        elif col in formula_cells:
            ftext = formula_cells[col].replace("{row}", str(at))
            print(f"  {col}{at} = {ftext} (formula)")

    # Step 5: Update dimension
    for dim in root.iter(tag("dimension")):
        old_ref = dim.get("ref", "")
        if ":" in old_ref:
            start_ref, end_ref = old_ref.split(":")
            end_row = int(re.search(r"(\d+)", end_ref).group(1))
            end_col = re.match(r"([A-Z]+)", end_ref).group(1)
            # Dimension was already shifted by shift_rows, just verify
            max_col = max(col_number(end_col), max(col_number(c) for c in all_cols))
            max_col_letter = end_col if col_number(end_col) >= max_col else col
            new_ref = f"{start_ref}:{max_col_letter}{end_row}"
            if new_ref != old_ref:
                dim.set("ref", new_ref)
                print(f"\n  Dimension: {old_ref} → {new_ref}")

    write_tree(ws_tree, ws_path)

    print(f"\nDone. Row {at} inserted successfully.")
    print(f"\nNext: python3 xlsx_pack.py {args.work_dir} output.xlsx")


if __name__ == "__main__":
    main()
