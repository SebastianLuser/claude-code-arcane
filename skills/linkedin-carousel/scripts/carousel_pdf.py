#!/usr/bin/env python3
"""
carousel_pdf.py - print a carousel's slides.html to the PDF LinkedIn takes.

Prints with headless Chrome/Edge, then checks the PDF against LinkedIn's limits
(100 MB, 300 pages) and that it has one page per <section>: a slide whose text
overflows spills onto a second page, and that page shows up in the feed.

Python standard library only.

Usage
  python carousel_pdf.py slides.html carousel.pdf
"""

import re
import subprocess
import sys
from pathlib import Path

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

MAX_BYTES = 100 * 1024 * 1024
MAX_PAGES = 300


def find_browser():
    return next((p for p in BROWSERS if Path(p).exists()), None)


def count_slides(html):
    return len(re.findall(r"<section\b", html, re.IGNORECASE))


def count_pages(pdf):
    # Chrome writes each page as a plain-text "/Type /Page" dictionary.
    return len(re.findall(rb"/Type\s*/Page(?![a-zA-Z])", pdf))


def check(slides, pdf):
    problems = []
    pages = count_pages(pdf)
    if len(pdf) > MAX_BYTES:
        problems.append(f"{len(pdf) // (1024 * 1024)} MB, LinkedIn takes up to 100 MB")
    if pages > MAX_PAGES:
        problems.append(f"{pages} pages, LinkedIn takes up to 300")
    if slides and pages != slides:
        problems.append(f"{pages} pages for {slides} slides: a slide overflows its page, shorten it")
    return pages, problems


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    browser = find_browser()
    if not browser:
        sys.exit("[ERROR] Chrome/Edge not found in standard paths. Install one or edit BROWSERS.")
    out.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        [browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={out}", src.as_uri()],
        capture_output=True, text=True, timeout=120)
    if r.returncode != 0 or not out.exists():
        sys.exit(f"[ERROR] browser exit {r.returncode}\n{(r.stderr or '')[-500:]}")
    pages, problems = check(count_slides(src.read_text(encoding="utf-8")), out.read_bytes())
    print(f"[OK] {out} ({pages} pages, {out.stat().st_size // 1024} KB)")
    for p in problems:
        print(f"[WARN] {p}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
