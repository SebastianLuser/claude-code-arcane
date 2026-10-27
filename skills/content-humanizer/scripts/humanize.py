#!/usr/bin/env python3
"""
humanize.py - strip the machine fingerprint out of a draft.

Three passes, in this order:

  1. INVISIBLE   delete or normalise the characters a human keyboard never
                 produces: zero-width joiners, word joiners, soft hyphens,
                 BOMs, Unicode tag characters, non-breaking and narrow spaces.
                 These survive copy-paste and are the most mechanical tell in
                 any generated text.
  2. TYPOGRAPHIC em dash -> comma, en dash -> hyphen, curly quotes -> straight,
                 ellipsis -> three dots, bullet -> hyphen.
  3. LEXICAL     replace the slop lexicon (slop.<lang>.json) with plain words,
                 preserving capitalisation and leaving URLs untouched. Entries
                 with "replace": null are flagged, not replaced (a swap that
                 would break gender agreement or the sentence).

Structural tells (rule-of-three, "not just X, it's Y", hashtag walls) are
REPORTED, never auto-rewritten - rewriting a sentence's shape needs judgement,
so that is the model's job, not a regex's.

The language is detected from the text unless --lang is given. Each
slop.<lang>.json is one language pack (lexicon, structures, stopwords); a new
pack file is a new language, with no code change. When no pack's stopwords
make up enough of the text, the language is "unknown" and no lexicon is
applied: only the passes that need no language run (invisible characters,
typography, the structures every pack shares, sentence-length uniformity).
A wrong lexicon is worse than none: it rewrites words that are correct in the
text's own language.

Adapted from Jake Schincariol's linkedin-agent-skill (MIT).

Usage
  python3 humanize.py draft.txt
  python3 humanize.py draft.txt --report
  pbpaste | python3 humanize.py - --report
  python3 humanize.py draft.txt --json
  python3 humanize.py draft.txt -o clean.txt --lang es
"""

import argparse
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = tuple(sorted(f[len("slop."):-len(".json")] for f in os.listdir(HERE)
                     if re.fullmatch(r"slop\.[a-z]{2}\.json", f)))
UNKNOWN = "unknown"
# Share of the text's words that must be the best pack's stopwords. Text in
# the pack's language scores 0.25-0.5; a neighbouring language without a pack
# (Portuguese, Italian, Catalan against the Spanish one) stays under 0.1.
MIN_STOPWORD_SHARE = 0.12

URL_RE = re.compile(r"https?://\S+|www\.\S+|\S+@\S+\.\S+")
SENT_RE = re.compile(r"[^.!?\n]+[.!?]*")


def detect_lang(text):
    """The pack whose stopwords make up the largest share of the text, or UNKNOWN below the threshold."""
    tokens = re.findall(r"[^\W\d_]+", URL_RE.sub(" ", text).lower())
    if not tokens:
        return UNKNOWN
    shares = {}
    for lang in LANGS:
        stopwords = set(load_lexicon(lang)["stopwords"])
        shares[lang] = sum(t in stopwords for t in tokens) / len(tokens)
    best = max(shares, key=shares.get, default=UNKNOWN)
    return best if shares.get(best, 0) >= MIN_STOPWORD_SHARE else UNKNOWN


def load_lexicon(lang="en", path=None):
    if path is None and lang == UNKNOWN:
        return neutral_lexicon()
    with open(path or os.path.join(HERE, f"slop.{lang}.json"), encoding="utf-8") as fh:
        return json.load(fh)


def neutral_lexicon():
    """What every pack agrees on: invisible characters, typography and the
    structures with no words in them (emoji, hashtag walls). No vocabulary,
    no voice."""
    packs = [load_lexicon(lang) for lang in LANGS]

    def shared(key):
        return [e for e in packs[0][key] if all(e in p[key] for p in packs[1:])]

    return {"language": UNKNOWN, "invisible": shared("invisible"), "typographic": shared("typographic"),
            "structures": shared("structures"), "words": [], "phrases": [], "voice": None}


def unknown_note():
    return (f"Language not recognised (packs: {', '.join(LANGS)}): no lexicon applied, only the "
            "language-neutral checks. Force a pack with --lang.")


def term_pattern(find):
    """Whole-term match; lookarounds instead of \\b so a term that starts or ends in punctuation matches too."""
    return re.compile(r"(?<!\w)" + re.escape(find).replace(r"\ ", r"\s+") + r"(?!\w)",
                      re.IGNORECASE)


def _cp(spec):
    """'U+200B' -> '\\u200b';  'U+E0000-U+E007F' -> (start, end)."""
    if "-" in spec:
        a, b = spec.split("-")
        return (int(a[2:], 16), int(b[2:], 16))
    return int(spec[2:], 16)


def protect_urls(text):
    """Swap URLs for placeholders so no pass rewrites inside a link."""
    found = []

    def stash(m):
        found.append(m.group(0))
        return f"\x00URL{len(found) - 1}\x00"

    return URL_RE.sub(stash, text), found


def restore_urls(text, found):
    for i, url in enumerate(found):
        text = text.replace(f"\x00URL{i}\x00", url)
    return text


def pass_invisible(text, lex):
    """Delete or space-normalise invisible characters. Returns (text, hits)."""
    hits = []
    for entry in lex["invisible"]:
        cp = _cp(entry["cp"])
        if isinstance(cp, tuple):
            pattern = "[" + re.escape(chr(cp[0])) + "-" + re.escape(chr(cp[1])) + "]"
        else:
            pattern = re.escape(chr(cp))
        n = len(re.findall(pattern, text))
        if n:
            hits.append({"name": entry["cp"] + " " + entry["name"], "count": n,
                         "action": entry["action"]})
            text = re.sub(pattern, "" if entry["action"] == "delete" else " ", text)
    # Any remaining Cf (format) character is invisible by definition.
    stray = [c for c in text if unicodedata.category(c) == "Cf"]
    if stray:
        hits.append({"name": "other invisible format chars", "count": len(stray),
                     "action": "delete"})
        text = "".join(c for c in text if unicodedata.category(c) != "Cf")
    return text, hits


def pass_typographic(text, lex):
    hits = []
    for entry in lex["typographic"]:
        ch = entry["from"]
        n = text.count(ch)
        if not n:
            continue
        hits.append({"name": f"{ch} {entry['name']}", "count": n, "to": entry["to"].strip() or "(space)"})
        if ch == "—":
            # " word — word " and "word—word" both collapse to a comma + space.
            text = re.sub(r"\s*—\s*", ", ", text)
        elif ch == "–":
            text = re.sub(r"\s*–\s*(?=\d)", "-", text)      # 5–10  -> 5-10
            text = re.sub(r"\s+–\s+", ", ", text)            # used as em dash
            text = text.replace("–", "-")
        else:
            text = text.replace(ch, entry["to"])
    # A comma inserted before existing punctuation reads wrong.
    text = re.sub(r",\s*([,.;:!?])", r"\1", text)
    text = re.sub(r",\s*\n", "\n", text)
    return text, hits


def _match_case(src, repl):
    if not repl:
        return repl
    if src.isupper() and len(src) > 1:
        return repl.upper()
    if src[0].isupper():
        return repl[0].upper() + repl[1:]
    return repl


def pass_lexical(text, lex):
    """Replace slop words and phrases. Longest first so phrases win."""
    hits = []
    entries = sorted(lex["phrases"] + lex["words"],
                     key=lambda e: len(e["find"]), reverse=True)
    for entry in entries:
        find = entry["find"]
        pattern = term_pattern(find)
        found = pattern.findall(text)
        if not found:
            continue
        repl = entry["replace"]
        hits.append({"find": find, "count": len(found), "family": entry["family"],
                     "replace": "(rewrite by hand)" if repl is None else repl or "(deleted)"})
        if repl is not None:
            text = pattern.sub(lambda m: _match_case(m.group(0), repl), text)
    # Clean up after deletions.
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"(?m)^[ \t]*([,.;:])\s*", "", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"(?m)^[ \t]+$", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # An em dash that became a comma, followed by one of the pack's sentence
    # connectives, leaves a splice ("is important, also, it's proof"). Promote
    # it to a full stop.
    connectives = "|".join(re.escape(c) for c in lex.get("connectives", []))
    if connectives:
        text = re.sub(r",\s*(" + connectives + r")\s*,\s*",
                      lambda m: ". " + m.group(1)[0].upper() + m.group(1)[1:] + ", ", text)
    return text, hits


def scan_structures(text, lex):
    flags = []
    for s in lex["structures"]:
        try:
            pattern = re.compile(s["regex"], re.MULTILINE)
        except re.error:
            continue
        found = pattern.findall(text)
        if found:
            flags.append({"name": s["name"], "count": len(found), "fix": s["fix"]})
    # Sentence-length uniformity is structural too.
    lens = [len(s.split()) for s in SENT_RE.findall(text) if len(s.split()) > 2]
    if len(lens) >= 4:
        mean = sum(lens) / len(lens)
        var = sum((n - mean) ** 2 for n in lens) / len(lens)
        cv = (var ** 0.5) / mean if mean else 0
        if cv < 0.35:
            flags.append({
                "name": f"Uniform sentence length (variation {cv:.2f})",
                "count": len(lens),
                "fix": "Break one sentence in half. Let another run long. Machines write even.",
            })
    return flags


def humanize(text, lex):
    text, urls = protect_urls(text)
    text, inv = pass_invisible(text, lex)
    text, typo = pass_typographic(text, lex)
    text, lexi = pass_lexical(text, lex)
    text = restore_urls(text, urls)
    return text.strip() + "\n", {
        "invisible": inv,
        "typographic": typo,
        "lexical": lexi,
        "structures": scan_structures(text, lex),
    }


def render_report(report, out=sys.stderr):
    def head(title):
        print(f"\n{title}\n" + "-" * len(title), file=out)

    total = sum(h["count"] for h in report["invisible"]) \
        + sum(h["count"] for h in report["typographic"]) \
        + sum(h["count"] for h in report["lexical"] if h["replace"] != "(rewrite by hand)")
    flagged = len(report["structures"]) \
        + sum(1 for h in report["lexical"] if h["replace"] == "(rewrite by hand)")

    head("HUMANIZE REPORT")
    print(f"{total} machine artefacts removed, "
          f"{flagged} tells flagged for rewrite", file=out)

    if report["invisible"]:
        head("1. INVISIBLE CHARACTERS")
        for h in report["invisible"]:
            print(f"  {h['count']:>3}x  {h['name']}  -> {h['action']}", file=out)
    if report["typographic"]:
        head("2. TYPOGRAPHY")
        for h in report["typographic"]:
            print(f"  {h['count']:>3}x  {h['name']}  -> {h['to']}", file=out)
    if report["lexical"]:
        head("3. SLOP LEXICON")
        for h in report["lexical"]:
            print(f"  {h['count']:>3}x  {h['find']}  -> {h['replace']}   [{h['family']}]", file=out)
    if report["structures"]:
        head("4. STRUCTURAL TELLS  (not auto-fixed - rewrite these yourself)")
        for h in report["structures"]:
            print(f"  {h['count']:>3}x  {h['name']}\n        {h['fix']}", file=out)
    if not any(report.values()):
        head("CLEAN")
        print("  Nothing to strip.", file=out)
    print("", file=out)


def main():
    ap = argparse.ArgumentParser(description="Strip the machine fingerprint out of a draft.")
    ap.add_argument("input", nargs="?", default="-", help="file, or - for stdin")
    ap.add_argument("-o", "--out", help="write cleaned text here instead of stdout")
    ap.add_argument("--report", action="store_true", help="print what changed, to stderr")
    ap.add_argument("--json", action="store_true", help="emit {text, lang, report} as JSON")
    ap.add_argument("--lang", choices=("auto",) + LANGS, default="auto",
                    help="lexicon language (default: detected from the text)")
    ap.add_argument("--lexicon", help="path to a custom lexicon, overrides --lang")
    args = ap.parse_args()
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8")

    raw = sys.stdin.read() if args.input == "-" else open(args.input, encoding="utf-8").read()
    lang = detect_lang(raw) if args.lang == "auto" else args.lang
    lex = load_lexicon(lang, args.lexicon)
    if lex.get("language") == UNKNOWN:
        print(unknown_note(), file=sys.stderr)
    clean, report = humanize(raw, lex)

    if args.json:
        print(json.dumps({"text": clean, "lang": lang, "report": report}, indent=2, ensure_ascii=False))
        return
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(clean)
        print(f"wrote {args.out}", file=sys.stderr)
    else:
        sys.stdout.write(clean)
    if args.report:
        render_report(report)


if __name__ == "__main__":
    main()
