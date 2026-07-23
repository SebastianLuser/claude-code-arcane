"""
verify_pdf.py — Verify that an exported PDF is ATS-compliant.

Checks that the PDF has an extractable text layer (not an image), the
expected page count, and that given strings (name, email) survived the
export. Adapted from tools/verify_pdf.py of MadsLorentzen/ai-job-search,
replacing poppler (pdftotext/pdfinfo) with pypdf so it runs on Windows
without external binaries.

Usage:
    python verify_pdf.py <pdf> [--pages N] [--min-chars N] [--contains TEXT ...]

Example:
    python verify_pdf.py "career-workspace/02-CVs/exports/Backend.pdf" \
        --min-chars 200 --contains "Jane Doe"

Exit code 0 if all checks pass, 1 if any check fails, 2 if pypdf is missing.
"""

import argparse
import sys
from pathlib import Path


def extract_text(pdf_path):
    """Return (page_count, normalized_text) of the PDF."""
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    return len(reader.pages), " ".join(text.split())


def verify(pdf_path, pages=None, min_chars=1, contains=()):
    """Return a list of problems (empty = PDF OK). Raises ImportError without pypdf."""
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        return [f"does not exist: {pdf_path}"]

    n_pages, text = extract_text(pdf_path)
    problems = []

    if pages is not None and n_pages != pages:
        problems.append(f"has {n_pages} pages (expected {pages})")
    if len(text) < min_chars:
        problems.append(
            f"text layer has {len(text)} extractable chars (minimum {min_chars}); "
            "likely an image-only PDF that an ATS cannot read"
        )
    for needle in contains:
        if " ".join(needle.split()).lower() not in text.lower():
            problems.append(f'missing required text: "{needle}"')

    return problems


def main():
    ap = argparse.ArgumentParser(description="Verify the ATS text layer of a PDF.")
    ap.add_argument("pdf", help="path to the PDF")
    ap.add_argument("--pages", type=int, default=None, help="expected page count")
    ap.add_argument("--min-chars", type=int, default=1, help="minimum extractable chars")
    ap.add_argument(
        "--contains", action="append", default=[], metavar="TEXT",
        help="string that must appear in the text (repeatable)",
    )
    args = ap.parse_args()

    try:
        problems = verify(args.pdf, args.pages, args.min_chars, args.contains)
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
