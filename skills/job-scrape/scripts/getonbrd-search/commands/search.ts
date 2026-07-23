import {
  SEARCH_URL,
  jsonFetch,
  normalizeJob,
  writeError,
  type GobJob,
} from "../helpers.ts"

export interface SearchOpts {
  query: string
  jobage: number
  remote?: string // "remote" | "hybrid" | "onsite"
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  params.set("query", opts.query)
  params.set("per_page", "20")
  params.set("page", String(opts.page))
  params.append("expand[]", "seniority")
  params.append("expand[]", "company")
  return `${SEARCH_URL}?${params.toString()}`
}

function matchesRemote(job: GobJob, mode: string | undefined): boolean {
  switch ((mode || "").toLowerCase()) {
    case "remote":
      return job.remote === true
    case "hybrid":
      return job.remote_modality === "hybrid"
    case "onsite":
    case "on-site":
      return job.remote_modality === "no_remote"
    default:
      return true
  }
}

function withinJobage(job: GobJob, days: number): boolean {
  if (!days || days <= 0 || days >= 9999 || !job.date) return true
  const ageMs = Date.now() - new Date(job.date + "T00:00:00Z").getTime()
  return ageMs <= days * 86400_000
}

function salaryCol(job: GobJob): string {
  if (job.salary_min_usd_month === null && job.salary_max_usd_month === null) return "-"
  return `${job.salary_min_usd_month ?? "?"}-${job.salary_max_usd_month ?? "?"}`
}

function renderTable(jobs: GobJob[]): string {
  if (jobs.length === 0) return "No results."
  const header =
    "TITLE".padEnd(36) +
    " " +
    "COMPANY".padEnd(20) +
    " " +
    "USD/MO".padEnd(10) +
    " " +
    "SENIORITY".padEnd(11) +
    " " +
    "DATE".padEnd(10) +
    " ID"
  const rows = jobs.map((j) => {
    const title = (j.title || "").slice(0, 36).padEnd(36)
    const company = (j.company || "-").slice(0, 20).padEnd(20)
    const salary = salaryCol(j).padEnd(10)
    const seniority = (j.seniority || "-").slice(0, 11).padEnd(11)
    const date = (j.date || "-").padEnd(10)
    return `${title} ${company} ${salary} ${seniority} ${date} ${j.id}`
  })
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const data = await jsonFetch(buildUrl(opts))
    if (data === null || !Array.isArray(data.data)) {
      writeError("Unexpected API response (no data array)", "BAD_RESPONSE")
      return 1
    }
    let jobs: GobJob[] = data.data.map(normalizeJob)
    jobs = jobs.filter((j) => withinJobage(j, opts.jobage) && matchesRemote(j, opts.remote))
    if (opts.limit !== undefined && opts.limit >= 0) jobs = jobs.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(jobs) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        jobs
          .map(
            (j) =>
              `${j.title}\n  ${j.company || "-"} · ${j.location || "-"} · ${salaryCol(j)} USD/mes · ${j.seniority || "-"} · ${j.date || "-"}\n  id: ${j.id}\n  ${j.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      // In JSON output, omit the long description per result unless it is the
      // only copy of the data a consumer needs; /scrape reads it from here.
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: jobs.length,
              page: opts.page,
              total_pages: data.meta?.total_pages ?? null,
            },
            results: jobs,
          },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
