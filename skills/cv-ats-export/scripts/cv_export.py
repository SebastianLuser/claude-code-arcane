"""
cv_export.py — Export Markdown CVs to ATS-compliant PDF.

Converts a Markdown CV to styled HTML and prints it with headless Chrome/Edge
(selectable text, single column, A4). No Obsidian, LaTeX or design tool needed.

Usage (from anywhere; the script locates the career workspace):
    python cv_export.py                          # all base CVs (CV - *.md)
    python cv_export.py "CV - Acme - Backend"    # a single CV (with/without .md)
    python cv_export.py --workspace ./career-workspace "CV - Acme"

Workspace resolution order:
    1. --workspace <path> flag
    2. CAREER_WORKSPACE env var
    3. walk up from the cwd looking for a folder containing "02-CVs" (or "02 - CVs")
    4. the current working directory

Output: <workspace>/02-CVs/exports/<name>.pdf
The PDF name comes from the frontmatter field `archivo_pdf` if present,
otherwise from the .md filename with the "CV - " prefix stripped.

Supported Markdown (what CVs use):
  # ## ### headings · **bold** · *italic* · [text](url) · - bullets · ---
  A single line break inside a paragraph becomes <br> (Obsidian-like).
"""

import html
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# Possible names for the CVs folder (portable + Obsidian-style with spaces).
CV_DIR_NAMES = ["02-CVs", "02 - CVs"]

BROWSERS = [
    # Windows
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    # macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    # Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
]

# ATS-friendly print style: single column, selectable text, A4.
CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
body {
  font-family: "Calibri", "Arial", "Helvetica", sans-serif;
  font-size: 10.5pt; line-height: 1.35; color: #000; background: #fff;
  margin: 0; padding: 0;
}
h1 { font-size: 18pt; font-weight: 700; margin: 0 0 2pt 0; padding: 0; }
h2 {
  font-size: 12pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5pt; border-bottom: 0.5pt solid #000;
  padding: 0 0 1pt 0; margin: 10pt 0 5pt 0;
  page-break-after: avoid;
}
h3 { font-size: 11pt; font-weight: 700; margin: 6pt 0 2pt 0; padding: 0; page-break-after: avoid; }
p  { margin: 2pt 0; page-break-inside: avoid; }
ul, ol { margin: 2pt 0 4pt 0; padding-left: 16pt; }
li { margin: 1pt 0; page-break-inside: avoid; }
strong { font-weight: 700; }
a { color: #000; text-decoration: none; }
hr { border: none; border-top: 0.5pt solid #000; margin: 6pt 0; }
"""


def find_cv_dir(start):
    """Walk up from `start` looking for a directory containing a CVs folder."""
    cur = Path(start).resolve()
    for base in [cur, *cur.parents]:
        for name in CV_DIR_NAMES:
            cand = base / name
            if cand.is_dir():
                return cand
    return None


def resolve_cv_dir(workspace_arg):
    # 1. explicit --workspace
    if workspace_arg:
        ws = Path(workspace_arg).resolve()
        for name in CV_DIR_NAMES:
            if (ws / name).is_dir():
                return ws / name
        # maybe they passed the CVs dir directly
        if ws.name in CV_DIR_NAMES and ws.is_dir():
            return ws
        print(f"[ERROR] No CVs folder ({' / '.join(CV_DIR_NAMES)}) under: {ws}")
        sys.exit(1)
    # 2. env var
    env = os.environ.get("CAREER_WORKSPACE")
    if env:
        for name in CV_DIR_NAMES:
            if (Path(env) / name).is_dir():
                return Path(env).resolve() / name
    # 3. walk up from cwd
    found = find_cv_dir(Path.cwd())
    if found:
        return found
    # 4. cwd fallback
    print("[ERROR] Could not locate a CVs folder. Use --workspace <path>.")
    sys.exit(1)


def strip_frontmatter(text):
    """Return (frontmatter_dict, body). Flat key: value frontmatter."""
    fm = {}
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            for line in text[3:end].strip().splitlines():
                if ":" in line:
                    k, _, v = line.partition(":")
                    fm[k.strip()] = v.strip().strip('"')
            text = text[end + 4:]
    return fm, text.lstrip("\n")


def inline(s):
    """Inline markdown -> HTML (escape first, then links/bold/italic)."""
    s = html.escape(s, quote=False)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", s)
    return s


def md_to_html(md):
    out = []
    paragraph = []
    in_list = False

    def flush_paragraph():
        if paragraph:
            out.append("<p>" + "<br>".join(inline(l) for l in paragraph) + "</p>")
            paragraph.clear()

    def close_list():
        nonlocal in_list
        if in_list:
            out.append("</ul>")
            in_list = False

    for raw in md.splitlines():
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            close_list()
            continue

        m = re.match(r"^(#{1,3})\s+(.*)", stripped)
        if m:
            flush_paragraph()
            close_list()
            level = len(m.group(1))
            out.append(f"<h{level}>{inline(m.group(2))}</h{level}>")
            continue

        if re.match(r"^(-{3,}|\*{3,})$", stripped):
            flush_paragraph()
            close_list()
            out.append("<hr>")
            continue

        m = re.match(r"^[-*]\s+(.*)", stripped)
        if m:
            flush_paragraph()
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append(f"<li>{inline(m.group(1))}</li>")
            continue

        close_list()
        paragraph.append(stripped)

    flush_paragraph()
    close_list()
    return "\n".join(out)


def find_browser():
    for path in BROWSERS:
        if Path(path).exists():
            return path
    return None


def export(md_path, browser, cv_dir, export_dir):
    text = md_path.read_text(encoding="utf-8")
    fm, body = strip_frontmatter(text)

    if fm.get("archivo_pdf"):
        pdf_path = cv_dir / fm["archivo_pdf"]
    else:
        name = fm.get("archivo_final") or md_path.stem.replace("CV - ", "")
        pdf_path = export_dir / f"{name}.pdf"
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    doc = (
        "<!DOCTYPE html><html><head><meta charset='utf-8'>"
        f"<title>{html.escape(md_path.stem)}</title>"
        f"<style>{CSS}</style></head><body>"
        + md_to_html(body)
        + "</body></html>"
    )

    with tempfile.NamedTemporaryFile(
        "w", suffix=".html", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(doc)
        tmp_path = Path(tmp.name)

    try:
        result = subprocess.run(
            [
                browser,
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={pdf_path}",
                tmp_path.as_uri(),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0 or not pdf_path.exists():
            print(f"[ERROR] {md_path.name}: browser exit {result.returncode}")
            print(result.stderr[-500:] if result.stderr else "(no stderr)")
            return False
    finally:
        tmp_path.unlink(missing_ok=True)

    size_kb = pdf_path.stat().st_size // 1024
    print(f"[OK] {md_path.name} -> {pdf_path} ({size_kb} KB)")
    return True


def parse_args(argv):
    workspace = None
    names = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--workspace":
            i += 1
            workspace = argv[i] if i < len(argv) else None
        elif a.startswith("--workspace="):
            workspace = a.split("=", 1)[1]
        else:
            names.append(a)
        i += 1
    return workspace, names


def main():
    workspace, names = parse_args(sys.argv[1:])

    browser = find_browser()
    if not browser:
        print("[ERROR] Chrome/Edge not found in standard paths. Install one or edit BROWSERS.")
        sys.exit(1)

    cv_dir = resolve_cv_dir(workspace)
    export_dir = cv_dir / "exports"

    if names:
        targets = []
        for n in names:
            p = cv_dir / (n if n.endswith(".md") else n + ".md")
            if not p.exists():
                print(f"[ERROR] Not found: {p}")
                sys.exit(1)
            targets.append(p)
    else:
        targets = sorted(cv_dir.glob("CV - *.md"))

    if not targets:
        print(f"[ERROR] No CVs (CV - *.md) found in {cv_dir}.")
        sys.exit(1)

    ok = all([export(t, browser, cv_dir, export_dir) for t in targets])
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
