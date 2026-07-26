#!/usr/bin/env node
// Self-contained CLI for searching jobs on GetOnBoard's public API v0
// (LATAM tech job board). No auth, no API key, zero dependencies; mirrors the
// contract of linkedin-search so both CLIs are interchangeable for /job-scrape.
//
// Personal use, low volume. Public API is in beta and may change.

import { runSearch, type SearchOpts } from "./commands/search.ts"
import { runDetail, type DetailOpts } from "./commands/detail.ts"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `getonbrd-cli - search jobs on GetOnBoard (LATAM tech job board)

USAGE
  node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q "<keywords>" [flags]
  node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts detail <slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (min 3 chars). REQUIRED.
  --jobage <days>         Posted within N days (client-side filter). Default: all.
  --remote <mode>         remote | hybrid | onsite (client-side filter).
  --page <n>              1-indexed page (20 results/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side; 0 emits none).
  --brief                 json only: truncate each description to 300 chars.
  --format <fmt>          json (default) | table | plain.

NOTES
  No --location flag: GetOnBoard is LATAM/remote by nature; filter with --remote
  and read the countries field. Salary fields are USD/month when published.
  detail accepts the slug from search results or any getonbrd.com job URL.
  Full JDs are ~80% of a json payload: use --brief to triage, then detail the
  shortlist.

EXAMPLES
  node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q "fullstack developer" --jobage 14 --format table
  node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q ".NET" --remote remote --brief
  node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts detail net-backend-developer-2brains-remote --format plain
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    const query = typeof flags.query === "string" ? flags.query : undefined
    if (!query || query.length < 3) {
      process.stderr.write(
        JSON.stringify({
          error: 'the --query/-q flag is required and must be at least 3 chars (e.g. -q "fullstack developer")',
          code: "NO_QUERY",
        }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
        return null
      }
      return val
    }

    if (flags.jobage !== undefined) {
      const v = parseIntFlag("jobage", flags.jobage)
      if (v === null) return 1
      flags.jobage = String(v)
    }
    if (flags.page !== undefined) {
      const v = parseIntFlag("page", flags.page)
      if (v === null) return 1
      flags.page = String(v)
    }
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      flags.limit = String(v)
    }

    const opts: SearchOpts = {
      query,
      // parseIntFlag already validated these; a string here is always numeric.
      jobage: typeof flags.jobage === "string" ? parseInt(flags.jobage, 10) : 9999,
      remote: typeof flags.remote === "string" ? flags.remote : undefined,
      page: typeof flags.page === "string" ? Math.max(1, parseInt(flags.page, 10)) : 1,
      limit: typeof flags.limit === "string" ? parseInt(flags.limit, 10) : undefined,
      brief: flags.brief === true,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires a <slug|url>", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

// process.exit() while stdout is still flushing crashes libuv on Windows;
// setting exitCode lets Node drain the buffers and exit on its own.
main().then((code) => {
  process.exitCode = code
})
