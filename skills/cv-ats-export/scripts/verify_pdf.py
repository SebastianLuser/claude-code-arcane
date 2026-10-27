"""
verify_pdf.py — Verify that an exported PDF is ATS-compliant.

Checks that the PDF has an extractable text layer (not an image), the
expected page count, that given strings (name, email) survived the export,
and with --ascii-dates that no date range is joined by a Unicode dash.
Adapted from tools/verify_pdf.py of ai-job-search (MIT, see ATTRIBUTION.md),
replacing poppler (pdftotext/pdfinfo) with pypdf so it runs on Windows
without external binaries.

--contains compares folded text: NFC, curly quotes to straight, en/em dash to
"-", no-break space to space. A PDF that renders "O’Brien" or "2019–2024"
still contains "O'Brien" and "2019-2024"; without the fold those failed.

--ascii-dates reads the raw text, never the folded one: it fails when a year
touches an en dash, em dash or minus sign ("2019–2024", "Mar 2016 — Present").
An ATS that splits ranges only on the ASCII hyphen (Workday's import is the
documented case) drops those dates. Quantities ("EUR 1500–2000") are left alone.

Usage:
    python verify_pdf.py <pdf> [--pages N] [--max-pages N] [--min-chars N]
                               [--contains TEXT ...] [--ascii-dates]

Example:
    python verify_pdf.py "career-workspace/02-CVs/exports/Backend.pdf" \
        --min-chars 200 --contains "Jane Doe" --ascii-dates

Exit code 0 if all checks pass, 1 if any check fails, 2 if pypdf is missing.
"""

import argparse
import re
import sys
import unicodedata
from pathlib import Path

TYPOGRAPHIC_FOLDS = str.maketrans({
    "‘": "'", "’": "'", "“": '"', "”": '"',
    "–": "-", "—": "-", " ": " ",
})
# Dash-like code points a year must never touch in a date range.
NON_ASCII_DASHES = "‐‑‒–—―−"
# A year is four digits standing alone, so 2000 inside 120000 is not one; only
# horizontal whitespace between year and dash, so a dash opening the next line
# (a bullet) does not join a year ending this one.
_YEAR = r"(?<!\d)(?:19|20)\d{2}(?!\d)"
NON_ASCII_DATE_RANGE = re.compile(rf"{_YEAR}[^\S\n]*[{NON_ASCII_DASHES}]|[{NON_ASCII_DASHES}][^\S\n]*{_YEAR}")
_TOKEN_BEFORE = re.compile(r"(\S+)[^\S\n]*$")
_TOKEN_AFTER = re.compile(r"^[^\S\n]*(\S+)")
_BARE_NUMBER = re.compile(r"\d+(?:[.,]\d+)*[kKmM%]?")
_BARE_YEAR = re.compile(r"(?:19|20)\d{2}")
_TWO_DIGIT_YEAR = re.compile(r"\d{2}")


def normalize_text(text):
    """Fold for comparison: NFC, typographic punctuation, collapsed whitespace."""
    return " ".join(unicodedata.normalize("NFC", text).translate(TYPOGRAPHIC_FOLDS).split())


def _bare_number(token):
    """The token without outer punctuation if it is a plain number, else None.

    A dotted token with a year group ("01.2016") is a date written in numbers,
    not a quantity, so it is left to the year rule.
    """
    core = token.strip(".,;:!?()[]{}\"'")
    if not _BARE_NUMBER.fullmatch(core):
        return None
    groups = re.split(r"[.,]", core.rstrip("kKmM%"))
    if len(groups) > 1 and any(_BARE_YEAR.fullmatch(g) for g in groups):
        return None
    return core


def _quantity_range(line, dash_index):
    """True when both sides are plain numbers and not a year pair (2016-2024, 2019-20)."""
    before = _TOKEN_BEFORE.search(line[:dash_index])
    after = _TOKEN_AFTER.search(line[dash_index + 1:])
    if not before or not after:
        return False
    left, right = _bare_number(before.group(1)), _bare_number(after.group(1))
    if left is None or right is None:
        return False
    return not (_BARE_YEAR.fullmatch(left) and (_BARE_YEAR.fullmatch(right) or _TWO_DIGIT_YEAR.fullmatch(right)))


def find_non_ascii_date_ranges(text):
    """(line, dash) for every year joined to a non-ASCII dash in the raw text."""
    hits = []
    for match in NON_ASCII_DATE_RANGE.finditer(text):
        dash = next(c for c in match.group(0) if c in NON_ASCII_DASHES)
        line_start = text.rfind("\n", 0, match.start()) + 1
        line_end = text.find("\n", match.end())
        line = text[line_start:line_end if line_end != -1 else len(text)]
        if not _quantity_range(line, match.start() + match.group(0).index(dash) - line_start):
            hits.append((" ".join(line.split()), dash))
    return hits


def extract_text(pdf_path):
    """Return (page_count, raw_text) of the PDF."""
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    return len(reader.pages), "\n".join(page.extract_text() or "" for page in reader.pages)


def verify(pdf_path, pages=None, min_chars=1, contains=(), max_pages=None, ascii_dates=False):
    """Return a list of problems (empty = PDF OK). Raises ImportError without pypdf."""
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        return [f"does not exist: {pdf_path}"]

    n_pages, raw = extract_text(pdf_path)
    text = normalize_text(raw)
    problems = []

    if pages is not None and n_pages != pages:
        problems.append(f"has {n_pages} pages (expected {pages})")
    if max_pages is not None and n_pages > max_pages:
        problems.append(f"has {n_pages} pages (ideally 1-{max_pages} for a CV)")
    if len(text) < min_chars:
        problems.append(
            f"text layer has {len(text)} extractable chars (minimum {min_chars}); "
            "likely an image-only PDF that an ATS cannot read"
        )
    for needle in contains:
        if normalize_text(needle).lower() not in text.lower():
            problems.append(f'missing required text: "{needle}"')
    if ascii_dates:
        for line, dash in find_non_ascii_date_ranges(raw):
            problems.append(
                f"date range joined by U+{ord(dash):04X} in {line[:80]!r}: an ATS that splits "
                "ranges on the ASCII hyphen drops it; write the dates with '-'"
            )

    return problems


def main():
    ap = argparse.ArgumentParser(description="Verify the ATS text layer of a PDF.")
    ap.add_argument("pdf", help="path to the PDF")
    ap.add_argument("--pages", type=int, default=None, help="expected page count")
    ap.add_argument("--min-chars", type=int, default=1, help="minimum extractable chars")
    ap.add_argument("--max-pages", type=int, default=None, help="warn above N pages")
    ap.add_argument(
        "--contains", action="append", default=[], metavar="TEXT",
        help="string that must appear in the text (repeatable)",
    )
    ap.add_argument("--ascii-dates", action="store_true", help="fail on date ranges joined by a Unicode dash")
    args = ap.parse_args()

    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    try:
        problems = verify(
            args.pdf, args.pages, args.min_chars, args.contains, args.max_pages, args.ascii_dates
        )
    except ImportError:
        print("[ERROR] pypdf is missing. Install with: pip install pypdf")
        sys.exit(2)

    name = Path(args.pdf).name
    if problems:
        for p in problems:
            print(f"[FAIL] {name}: {p}")
        sys.exit(1)
    print(f"[OK] {name}: ATS text layer verified")
    sys.exit(0)


if __name__ == "__main__":
    main()
