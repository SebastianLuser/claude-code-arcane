# SPDX-License-Identifier: MIT
"""Helpers shared by the xlsx edit scripts: XML I/O that keeps namespaces, sheet lookup, cell refs."""

from __future__ import annotations

import os
import re
import sys
import xml.etree.ElementTree as ET

NS_SS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"


def tag(local: str) -> str:
    return f"{{{NS_SS}}}{local}"


def load(path: str) -> ET.ElementTree:
    """Parse with the file's own prefixes registered, so writing it back keeps them."""
    for _, (prefix, uri) in ET.iterparse(path, events=("start-ns",)):
        ET.register_namespace(prefix, uri)
    return ET.parse(path)


def write_tree(tree: ET.ElementTree, path: str) -> None:
    """Write back with the original XML declaration and root start tag.

    ElementTree drops namespace declarations no element uses, but mc:Ignorable still
    names them, and Excel then reports the file as corrupt.
    """
    with open(path, encoding="utf-8") as fh:
        original = fh.read()
    decl = re.match(r"\s*<\?xml[^>]*\?>\s*", original)
    root_tag = re.search(r"<(?![?!])[^>]*>", original).group(0)
    body = ET.tostring(tree.getroot(), encoding="unicode")
    body = re.sub(r"<(?![?!])[^>]*>", lambda _: root_tag, body, count=1)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write((decl.group(0) if decl else "") + body + "\n")


def col_number(s: str) -> int:
    n = 0
    for c in s.upper():
        n = n * 26 + (ord(c) - 64)
    return n


def col_letter(n: int) -> str:
    r = ""
    while n > 0:
        n, rem = divmod(n - 1, 26)
        r = chr(65 + rem) + r
    return r


def sheets(work_dir: str) -> list[tuple[str, str]]:
    """(sheet name, worksheet path) in workbook order."""
    wb = ET.parse(os.path.join(work_dir, "xl", "workbook.xml")).getroot()
    rels = ET.parse(os.path.join(work_dir, "xl", "_rels", "workbook.xml.rels")).getroot()
    targets = {rel.get("Id"): rel.get("Target") for rel in rels}
    out = []
    for sheet in wb.iter(tag("sheet")):
        target = targets.get(sheet.get(f"{{{NS_REL}}}id"), "")
        target = target[1:] if target.startswith("/") else os.path.join("xl", target)
        out.append((sheet.get("name"), os.path.normpath(os.path.join(work_dir, target))))
    return out


def find_sheet(work_dir: str, sheet_name: str | None) -> tuple[str, str]:
    """(name, path) of the named sheet, or of the first one when no name is given."""
    for name, path in sheets(work_dir):
        if sheet_name is None or name == sheet_name:
            return name, path
    print(f"ERROR: Sheet not found: {sheet_name}")
    sys.exit(1)


def find_ws_path(work_dir: str, sheet_name: str | None) -> str:
    return find_sheet(work_dir, sheet_name)[1]


def sheet_tables(ws_path: str) -> list[str]:
    """Paths of the tables (xl/tables/*.xml) that belong to a worksheet."""
    rels_path = os.path.join(os.path.dirname(ws_path), "_rels", os.path.basename(ws_path) + ".rels")
    if not os.path.isfile(rels_path):
        return []
    return [os.path.normpath(os.path.join(os.path.dirname(ws_path), rel.get("Target")))
            for rel in ET.parse(rels_path).getroot()
            if rel.get("Type", "").endswith("/table")]


def add_shared_string(work_dir: str, text: str) -> int:
    ss_path = os.path.join(work_dir, "xl", "sharedStrings.xml")
    if not os.path.isfile(ss_path):
        print("ERROR: the workbook has no xl/sharedStrings.xml, so text cells cannot be added; "
              "use --values/--formula, or save the file once in Excel with any text in it")
        sys.exit(1)
    tree = load(ss_path)
    root = tree.getroot()

    for idx, si in enumerate(root.findall(tag("si"))):
        t_el = si.find(tag("t"))
        if t_el is not None and t_el.text == text:
            return idx

    idx = len(root.findall(tag("si")))
    si = ET.SubElement(root, tag("si"))
    t = ET.SubElement(si, tag("t"))
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    root.set("count", str(int(root.get("count", "0")) + 1))
    root.set("uniqueCount", str(int(root.get("uniqueCount", "0")) + 1))
    write_tree(tree, ss_path)
    return idx
