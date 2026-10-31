---
name: cv-ats-export
description: "Export a Markdown CV to an ATS-compliant PDF (single column, selectable text, A4) using headless Chrome/Edge - no Obsidian or design tool needed. Triggers: export CV to PDF, generate the CV PDF, CV ATS PDF, convert markdown CV to PDF, print CV."
argument-hint: "[cv-name | all] [--workspace <path>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---

# CV ATS Export - Markdown → ATS-compliant PDF

You convert a Markdown CV into a **PDF that passes ATS filters**: a single column, selectable text (not an image), A4, clean typography. It uses Chrome or Edge in headless mode - no Obsidian, LaTeX or design tool required.

The engine is `scripts/cv_export.py` + `scripts/verify_pdf.py` (post-export ATS verification). The first time, install both in the workspace (`tools/`) so they are versioned with the CVs; or run them straight from the skill (they go together: `cv_export` imports `verify_pdf` from its own directory).

## Requirements

- **Python 3** on the PATH.
- **Google Chrome or Microsoft Edge** installed (the script autodetects standard paths on Windows/macOS/Linux).
- **`pypdf` (optional)** for the automatic ATS verification: `pip install pypdf`. Without pypdf the export works the same and reports `[ATS SKIP]`.
- CVs in Markdown inside the career workspace's `02-CVs/`, with headers (`# Name`, `## Section`), bullets and `---` as separators.

## Usage

```bash
# Every base CV (CV - *.md) in the workspace
python scripts/cv_export.py

# A single one (with or without .md)
python scripts/cv_export.py "CV - Acme - Backend"

# Explicit workspace
python scripts/cv_export.py --workspace ./career-workspace "CV - Acme - Backend"

# Skip the ATS verification
python scripts/cv_export.py --no-verify "CV - Acme - Backend"
```

The script:
1. Locates the workspace (`--workspace` flag, env `CAREER_WORKSPACE`, or walks up directories looking for a `02-CVs` folder, or uses the cwd).
2. Reads the `.md`, splits off the frontmatter, converts the body to HTML with the embedded ATS CSS.
3. Prints to PDF with headless Chrome/Edge (`--headless=new --print-to-pdf`).
4. Saves to `02-CVs/exports/`. The name comes from the `pdf_file` frontmatter if present (`.pdf` is appended when missing; a value with a folder, such as `sent/Ana`, is relative to `02-CVs/`); otherwise from the `.md` name (without the `CV - ` prefix).
5. **Verifies the ATS text layer** with `verify_pdf.py` (pypdf): extractable text (at least 200 chars), that the H1 name and the email survive the export (comparing with quotes, dashes and spaces normalized), that no date range uses a Unicode dash (`2019–2024` → `2019-2024`: an ATS like Workday loses it) and warns if it goes over 2 pages. Reports `[ATS OK]` / `[ATS WARN]` / `[ATS SKIP]`; it never breaks the export. Skipped with `--no-verify`.

The two `[ATS SKIP]` cases are different: `verify_pdf.py not found next to cv_export.py` means you copied only one file to the workspace (installing pypdf changes nothing); `pypdf not installed` is the one solved with `pip install pypdf`.

`verify_pdf.py` also works standalone to check any PDF:

```bash
python scripts/verify_pdf.py "02-CVs/exports/Backend.pdf" --min-chars 200 --max-pages 2 --contains "Jane Doe" --ascii-dates
```

## Supported Markdown

`# ## ### headings` · `**bold**` · `*italic*` · `[text](url)` · `- bullets` · `---` (horizontal rule). A single line break inside a paragraph renders as `<br>` (Obsidian-style behavior).

## Why this pipeline (and not Word/Canva)

- **Guaranteed selectable text** → the ATS can parse it (unlike a PDF exported as an image).
- **One column, no tables** → parsing does not break.
- **Reproducible and versionable** → the CV lives in Markdown (diffable, in git), the PDF is a generated artifact.
- **Always the same style** → the ATS CSS is embedded in the script.

## Customizing the style

The ATS CSS is in the `CSS` constant inside `scripts/cv_export.py` (font size, A4 margins, h1/h2 styles). Edit it there if you want to adjust typography or spacing - keep a single column and real text.

## Rules

- Do not put tables, columns or images in the CV: they break ATS parsing.
- Act on the `[ATS WARN]`s: an image PDF, or one without an extractable name/email, does not pass ATS filters. Use `--no-verify` only to iterate quickly on the layout.
- Do not commit PDFs with sensitive data to a remote without confirmation.

## Handoff

Confirm (approval) before installing `cv_export.py` in the workspace or overwriting PDFs. When the PDF is READY and verified, the next step is usually `/cover-letter` for the application message.
