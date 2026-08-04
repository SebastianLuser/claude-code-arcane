"""
vault_index.py - Ranked retrieval and a cached inventory for an Obsidian vault.

No dependencies beyond the Python 3 standard library. Builds an inverted index
in <vault>/.vault-index.json (a dotfile, so Obsidian ignores it) and refreshes
only the notes whose mtime or size changed.

Two problems this solves, both of which show up around a thousand notes:

  search     Grep finds the notes containing your exact words. This ranks by
             BM25, folds accents, and expands the query with the aliases any note
             declares, so searching "postgres" also reaches the notes that only
             ever said "PG". It is lexical retrieval with vault-derived synonyms,
             NOT embeddings: it will not connect "indices parciales" to
             "performance de queries" unless some note ties those words together.
             Teaching it a synonym is one frontmatter line.

  related    Notes closest to one note by tf-idf cosine over shared vocabulary.
             Answers "what else talks about this", which is what a review session
             needs to propose connections. Same limit as search: no shared words,
             no match.

  inventory  A review session needs to know what hubs, projects and areas exist
             before it can propose where an item goes. Globbing the vault on
             every run costs context that grows with the vault; this emits a
             compact listing from the cache.

Folder roles are resolved from flags, not assumed: --role hubs=People lets an
adopted vault keep its own structure (see the ## Rutas contract in its CLAUDE.md).

Usage:
    python vault_index.py <vault> refresh [--role name=path ...]
    python vault_index.py <vault> search "<query>" [-n 10] [--no-expand]
    python vault_index.py <vault> related "<note>" [-n 10]
    python vault_index.py <vault> inventory [--format json|text]

Errors go to stderr as {"error": "...", "code": "..."} with exit code 1.
"""

import argparse
import json
import math
import os
import re
import sys
import time
import unicodedata

INDEX_FILENAME = ".vault-index.json"
INDEX_VERSION = 1

SKIP_DIRS = {
    ".obsidian", ".git", ".trash", ".stfolder", ".stversions",
    "node_modules", "__pycache__", ".smart-env",
}

DEFAULT_ROLES = {
    "inbox": "_inbox",
    "daily": "Reflect/Daily",
    "weekly": "Reflect/Weekly",
    "monthly": "Reflect/Monthly",
    "atomic": "03_Resources",
    "hubs": "Hubs",
    "projects": "01_Projects",
    "areas": "02_Areas",
    "archive": "04_Archive",
    "templates": "Templates",
}

# BM25 defaults. k1 controls how fast term frequency saturates, b how much a
# long note gets penalized. These are the standard values and there is no reason
# to tune them for a personal vault.
K1 = 1.5
B = 0.75

# A term in the title is worth this many occurrences in the body: a note called
# "Indices parciales" is about that, a note mentioning it once is not.
TITLE_BOOST = 3

MIN_TERM_LEN = 2

STOPWORDS = {
    "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "y", "o", "que",
    "en", "con", "por", "para", "del", "al", "se", "su", "sus", "lo", "es", "son",
    "como", "mas", "pero", "sin", "sobre", "este", "esta", "esto", "estos", "estas",
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is",
    "are", "was", "were", "be", "it", "this", "that", "as", "at", "by", "from",
}

FENCED_CODE = re.compile(r"^```.*?^```", re.DOTALL | re.MULTILINE)
WIKILINK = re.compile(r"!?\[\[([^\[\]\n]+?)\]\]")
DATE_IN_NAME = re.compile(r"\d{4}-\d{2}-\d{2}")
TOKEN = re.compile(r"[^\W_]+", re.UNICODE)


def write_error(error, code):
    sys.stderr.write(json.dumps({"error": error, "code": code}) + "\n")


def fold(text):
    """Strip accents so 'indices' matches 'indices' written with the accent."""
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c))


def normalize_term(raw):
    """
    Fold accents, lowercase, and collapse plurals so 'indices' and 'indice' land
    on the same term. Crude next to a real stemmer, but the highest-recall trick
    available without a dependency.

    The two plural forms need different handling and getting it wrong costs
    recall in both directions. Spanish adds '-es' to a consonant ('ciudad' ->
    'ciudades'), everything else just adds '-s'. Stripping '-es' unconditionally
    turns 'indices' into 'indic' while 'indice' stays whole, so the plural stops
    finding the singular. Only strip '-es' when what remains ends in one of the
    consonants that actually take it.

    Known cost: 'l'-final and 's'-final Spanish plurals still miss their
    singular ('papeles'/'papel', 'meses'/'mes'). Adding those letters would
    break the far more common 'base'/'bases' and 'table'/'tables'.
    """
    term = fold(raw.lower())
    if len(term) >= 5 and term.endswith("es") and term[-3] in "dnrz":
        return term[:-2]
    if len(term) > 4 and term.endswith("s"):
        return term[:-1]
    return term


def tokenize(text):
    terms = []
    for match in TOKEN.findall(text):
        if len(match) < MIN_TERM_LEN:
            continue
        term = normalize_term(match)
        if term in STOPWORDS or len(term) < MIN_TERM_LEN:
            continue
        terms.append(term)
    return terms


def parse_frontmatter(text):
    """Minimal YAML subset: scalars, inline lists and block lists."""
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, 0
    fields = {}
    key = None
    for index in range(1, len(lines)):
        raw = lines[index]
        if raw.strip() == "---":
            return fields, index + 1
        if raw.startswith(("  - ", "- ", "\t- ")) and key:
            if not isinstance(fields.get(key), list):
                fields[key] = []
            fields[key].append(raw.split("- ", 1)[1].strip().strip("\"'"))
            continue
        if ":" not in raw:
            continue
        key, _, value = raw.partition(":")
        key, value = key.strip(), value.strip()
        if value.startswith("[") and value.endswith("]"):
            fields[key] = [v.strip().strip("\"'") for v in value[1:-1].split(",") if v.strip()]
        else:
            fields[key] = value.strip("\"'")
    return fields, len(lines)


def as_list(value):
    if isinstance(value, list):
        return [v for v in value if v]
    if isinstance(value, str) and value:
        return [v.strip() for v in value.split(",") if v.strip()]
    return []


def relative(path, root):
    return os.path.relpath(path, root).replace(os.sep, "/")


def walk_notes(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for filename in sorted(filenames):
            if filename.endswith(".md"):
                yield os.path.join(dirpath, filename)


def read_note(full, root):
    rel = relative(full, root)
    stat = os.stat(full)
    with open(full, "r", encoding="utf-8", errors="replace") as handle:
        text = handle.read()

    fields, body_start = parse_frontmatter(text)
    body = FENCED_CODE.sub("", "\n".join(text.split("\n")[body_start:]))
    title = os.path.splitext(os.path.basename(rel))[0]
    aliases = as_list(fields.get("aliases"))

    counts = {}
    for term in tokenize(body):
        counts[term] = counts.get(term, 0) + 1
    # Title and aliases are indexed as body terms too, weighted: they are the
    # strongest statement a note makes about what it is.
    for name in [title] + aliases:
        for term in tokenize(name):
            counts[term] = counts.get(term, 0) + TITLE_BOOST

    return rel, {
        "mtime": stat.st_mtime,
        "size": stat.st_size,
        "title": title,
        "type": fields.get("type") or "",
        "tags": as_list(fields.get("tags")),
        "aliases": aliases,
        "links": sorted({m.split("|")[0].split("#")[0].strip()
                         for m in WIKILINK.findall(body) if m.strip()}),
        "words": len(body.split()),
        "terms": counts,
        "length": sum(counts.values()),
    }


def index_path(root):
    return os.path.join(root, INDEX_FILENAME)


def load_index(root):
    try:
        with open(index_path(root), "r", encoding="utf-8") as handle:
            cache = json.load(handle)
    except (OSError, ValueError):
        return None
    if cache.get("version") != INDEX_VERSION:
        return None
    return cache


def refresh(root, roles):
    """Incremental: re-read only notes whose mtime or size moved."""
    cache = load_index(root) or {"version": INDEX_VERSION, "docs": {}}
    docs = cache["docs"]
    seen = set()
    added = updated = 0

    for full in walk_notes(root):
        rel = relative(full, root)
        seen.add(rel)
        try:
            stat = os.stat(full)
        except OSError:
            continue
        known = docs.get(rel)
        if known and known["mtime"] == stat.st_mtime and known["size"] == stat.st_size:
            continue
        try:
            _, record = read_note(full, root)
        except OSError as e:
            write_error("cannot read {0}: {1}".format(rel, e), "READ_FAILED")
            continue
        docs[rel] = record
        if known:
            updated += 1
        else:
            added += 1

    removed = [rel for rel in docs if rel not in seen]
    for rel in removed:
        del docs[rel]

    # Document frequency is derived, never incremental: recomputing it over the
    # cached term maps is cheap and keeps the two from drifting apart.
    df = {}
    for record in docs.values():
        for term in record["terms"]:
            df[term] = df.get(term, 0) + 1

    cache.update({
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "roles": roles,
        "df": df,
        "n_docs": len(docs),
        "avg_length": (sum(r["length"] for r in docs.values()) / len(docs)) if docs else 0.0,
    })

    with open(index_path(root), "w", encoding="utf-8") as handle:
        json.dump(cache, handle, ensure_ascii=False)

    return cache, {"added": added, "updated": updated, "removed": len(removed),
                   "total": len(docs)}


def alias_map(cache, roles):
    """
    Entity -> every other name it is known by, taken from the aliases any note
    declares. This is the whole synonym mechanism: it comes from the user's own
    vocabulary rather than from a generic thesaurus, which is why it is worth
    having, and it means teaching the vault a synonym is one frontmatter line.

    Hubs are where this normally lives, but not exclusively: an atomic note that
    declares `aliases: [OKR, objetivos y resultados]` is teaching the same thing.
    """
    groups = []
    for record in cache["docs"].values():
        names = [record["title"]] + record.get("aliases", [])
        if len(names) > 1:
            groups.append(names)

    expansion = {}
    for names in groups:
        for name in names:
            for term in tokenize(name):
                expansion.setdefault(term, set()).update(
                    t for other in names for t in tokenize(other)
                )
    return {term: sorted(terms) for term, terms in expansion.items()}


def search(cache, query, limit, expand=True):
    terms = tokenize(query)
    if not terms:
        return [], []

    expanded = list(terms)
    if expand:
        mapping = alias_map(cache, cache.get("roles") or DEFAULT_ROLES)
        for term in terms:
            for extra in mapping.get(term, []):
                if extra not in expanded:
                    expanded.append(extra)

    n_docs = cache["n_docs"] or 1
    avg_length = cache["avg_length"] or 1.0
    df = cache["df"]
    scored = []

    for rel, record in cache["docs"].items():
        score = 0.0
        matched = []
        for term in expanded:
            freq = record["terms"].get(term)
            if not freq:
                continue
            # Terms brought in by alias expansion count half: a synonym is
            # evidence, not the thing the user typed.
            weight = 1.0 if term in terms else 0.5
            idf = math.log(1 + (n_docs - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5))
            norm = freq * (K1 + 1) / (freq + K1 * (1 - B + B * record["length"] / avg_length))
            score += idf * norm * weight
            matched.append(term)
        if score > 0:
            scored.append({
                "path": rel, "title": record["title"], "type": record["type"],
                "score": round(score, 3), "matched": sorted(set(matched)),
                "words": record["words"],
            })

    scored.sort(key=lambda r: (-r["score"], r["path"]))
    return scored[:limit] if limit > 0 else scored, expanded


def related(cache, target, limit):
    """
    Notes closest to one note by tf-idf cosine over the shared vocabulary.

    This is the honest middle ground between search and embeddings. It answers
    "what else talks about this" without a model, and it is what feeds a review
    session looking for connections. What it cannot do is connect two notes that
    share no words: for that you need embeddings, and this file does not have
    them. It says so rather than pretending.
    """
    docs = cache["docs"]
    if target not in docs:
        matches = [rel for rel in docs
                   if os.path.splitext(os.path.basename(rel))[0].lower() == target.lower()]
        if len(matches) != 1:
            return None, matches
        target = matches[0]

    n_docs = cache["n_docs"] or 1
    df = cache["df"]

    def vector(record):
        out = {}
        for term, freq in record["terms"].items():
            idf = math.log(1 + n_docs / (df.get(term, 0) + 0.5))
            out[term] = freq * idf
        norm = math.sqrt(sum(v * v for v in out.values())) or 1.0
        return {term: value / norm for term, value in out.items()}

    base = vector(docs[target])
    scored = []
    for rel, record in docs.items():
        if rel == target:
            continue
        other = vector(record)
        shared = set(base) & set(other)
        if not shared:
            continue
        score = sum(base[term] * other[term] for term in shared)
        if score <= 0:
            continue
        top = sorted(shared, key=lambda term: -(base[term] * other[term]))[:5]
        scored.append({"path": rel, "title": record["title"], "type": record["type"],
                       "score": round(score, 3), "shared": top})

    scored.sort(key=lambda r: (-r["score"], r["path"]))
    return {"target": target, "results": scored[:limit] if limit > 0 else scored}, None


def inventory(cache, roles):
    docs = cache["docs"]

    def in_role(rel, role):
        prefix = roles.get(role)
        return bool(prefix) and rel.startswith(prefix + "/")

    def names(role):
        out = []
        for rel, record in sorted(docs.items()):
            if in_role(rel, role):
                entry = {"path": rel, "title": record["title"]}
                if record.get("aliases"):
                    entry["aliases"] = record["aliases"]
                out.append(entry)
        return out

    def dates(role):
        return sorted(
            m.group(0)
            for rel in docs if in_role(rel, role)
            for m in [DATE_IN_NAME.search(os.path.basename(rel))] if m
        )

    dumps, dailies = dates("inbox"), set(dates("daily"))
    return {
        "built_at": cache.get("built_at"),
        "roles": roles,
        "counts": {
            "notes": len(docs),
            **{role: len([r for r in docs if in_role(r, role)]) for role in roles},
        },
        "hubs": names("hubs"),
        "projects": names("projects"),
        "areas": names("areas"),
        # The one thing a review session always needs first: which days were
        # captured but never processed.
        "unprocessed_dumps": [d for d in dumps if d not in dailies],
        "latest": {
            "daily": (sorted(dailies) or [None])[-1],
            "weekly": (dates("weekly") or [None])[-1],
            "monthly": (dates("monthly") or [None])[-1],
        },
    }


def format_search_text(results, expanded):
    if not results:
        return "no matches"
    out = ["query terms: {0}".format(" ".join(expanded)), ""]
    for rank, hit in enumerate(results, 1):
        out.append("{0:>2}. {1:<6} {2}".format(rank, hit["score"], hit["path"]))
        out.append("    matched: {0}".format(", ".join(hit["matched"])))
    return "\n".join(out)


def format_related_text(found):
    if not found["results"]:
        return "nothing shares vocabulary with {0}".format(found["target"])
    out = ["related to {0}:".format(found["target"]), ""]
    for rank, hit in enumerate(found["results"], 1):
        out.append("{0:>2}. {1:<6} {2}".format(rank, hit["score"], hit["path"]))
        out.append("    shared: {0}".format(", ".join(hit["shared"])))
    return "\n".join(out)


def format_inventory_text(inv):
    out = [
        "built: {0}".format(inv["built_at"]),
        "{0} notes".format(inv["counts"]["notes"]),
        "hubs: {0} | projects: {1} | areas: {2}".format(
            len(inv["hubs"]), len(inv["projects"]), len(inv["areas"])),
        "latest daily: {0} | weekly: {1} | monthly: {2}".format(
            inv["latest"]["daily"], inv["latest"]["weekly"], inv["latest"]["monthly"]),
    ]
    if inv["unprocessed_dumps"]:
        out.append("unprocessed dumps ({0}): {1}".format(
            len(inv["unprocessed_dumps"]), ", ".join(inv["unprocessed_dumps"])))
    else:
        out.append("unprocessed dumps: none")
    if inv["hubs"]:
        out.append("")
        out.append("hubs:")
        for hub in inv["hubs"]:
            alias = " ({0})".format(", ".join(hub["aliases"])) if hub.get("aliases") else ""
            out.append("  {0}{1}".format(hub["title"], alias))
    return "\n".join(out)


def parse_roles(pairs):
    roles = dict(DEFAULT_ROLES)
    for pair in pairs or []:
        if "=" not in pair:
            write_error("--role expects name=path, got: {0}".format(pair), "BAD_ROLE")
            raise SystemExit(1)
        name, _, path = pair.partition("=")
        name, path = name.strip(), path.strip().strip("/").replace("\\", "/")
        if name not in DEFAULT_ROLES:
            write_error("unknown role '{0}'; known roles: {1}".format(
                name, ", ".join(sorted(DEFAULT_ROLES))), "BAD_ROLE")
            raise SystemExit(1)
        roles[name] = path
    return roles


class JsonErrorParser(argparse.ArgumentParser):
    """Keep the CLI's error contract: a JSON line on stderr and exit code 1."""

    def error(self, message):
        code = "NO_VAULT" if "vault" in message and "required" in message else "BAD_ARG"
        write_error(message, code)
        raise SystemExit(1)


def build_parser():
    parser = JsonErrorParser(
        prog="vault_index.py",
        description="Ranked retrieval and cached inventory for an Obsidian vault. "
        "Writes only its own index dotfile, never a note.",
    )
    parser.add_argument("vault", help="path to the vault")
    parser.add_argument("--role", action="append", metavar="NAME=PATH",
                        help="folder role override (repeatable). Roles: " +
                             ", ".join(sorted(DEFAULT_ROLES)))
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("refresh", help="build or update the index incrementally")

    search_cmd = sub.add_parser("search", help="ranked search over the index")
    search_cmd.add_argument("query")
    search_cmd.add_argument("-n", "--limit", type=int, default=10,
                            help="max results; 0 for all. Default: 10")
    search_cmd.add_argument("--no-expand", action="store_true",
                            help="do not expand the query with hub aliases")
    search_cmd.add_argument("--format", choices=["json", "text"], default="json")

    rel = sub.add_parser("related", help="notes closest to one note by shared vocabulary")
    rel.add_argument("note", help="path relative to the vault, or the note title")
    rel.add_argument("-n", "--limit", type=int, default=10,
                     help="max results; 0 for all. Default: 10")
    rel.add_argument("--format", choices=["json", "text"], default="json")

    inv = sub.add_parser("inventory", help="compact listing of hubs, projects and areas")
    inv.add_argument("--format", choices=["json", "text"], default="json")

    return parser


def force_utf8_streams():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def main():
    force_utf8_streams()
    args = build_parser().parse_args()
    roles = parse_roles(args.role)

    root = os.path.abspath(os.path.expanduser(args.vault))
    if not os.path.isdir(root):
        write_error("no such directory: {0}".format(args.vault), "NO_VAULT")
        sys.exit(1)

    if args.command == "refresh":
        _, stats = refresh(root, roles)
        print(json.dumps(stats, indent=2))
        return 0

    cache = load_index(root)
    if cache is None:
        # Refreshing on demand beats failing: the first search in a vault should
        # just work, and after that it is incremental anyway.
        sys.stderr.write(json.dumps(
            {"warning": "no usable index, building it now", "code": "INDEX_MISSING"}) + "\n")
        cache, _ = refresh(root, roles)
    if args.role:
        cache["roles"] = roles

    if args.command == "search":
        results, expanded = search(cache, args.query, args.limit, not args.no_expand)
        if args.format == "text":
            print(format_search_text(results, expanded))
        else:
            print(json.dumps({"query": args.query, "terms": expanded, "results": results},
                             indent=2, ensure_ascii=False))
        return 0

    if args.command == "related":
        found, ambiguous = related(cache, args.note, args.limit)
        if found is None:
            write_error(
                "no single note matches '{0}'{1}".format(
                    args.note,
                    ": " + ", ".join(ambiguous) if ambiguous else "",
                ),
                "AMBIGUOUS_NOTE" if ambiguous else "NO_NOTE",
            )
            return 1
        if args.format == "text":
            print(format_related_text(found))
        else:
            print(json.dumps(found, indent=2, ensure_ascii=False))
        return 0

    inv = inventory(cache, cache.get("roles") or roles)
    if args.format == "text":
        print(format_inventory_text(inv))
    else:
        print(json.dumps(inv, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    main()
