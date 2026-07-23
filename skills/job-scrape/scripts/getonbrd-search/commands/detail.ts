import {
  SEARCH_URL,
  PUBLIC_JOB_URL,
  jsonFetch,
  htmlFetch,
  htmlToText,
  normalizeJob,
  slugFromInput,
  slugTokens,
  writeError,
  type GobJob,
} from "../helpers.ts"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

const STOPWORDS = new Set([
  "y", "de", "e", "la", "el", "los", "las", "en", "para", "con", "a",
  "and", "the", "of", "at", "in", "remote", "hybrid",
])

/**
 * The search API ANDs every term, so the full slug usually over-constrains.
 * Try progressively more selective queries; the slug tail (stack + company)
 * is the most distinctive part.
 */
function buildQueries(tokens: string[]): string[] {
  const filtered = tokens.filter((t) => !STOPWORDS.has(t))
  const queries = [tokens.join(" ")]
  if (filtered.length !== tokens.length) queries.push(filtered.join(" "))
  if (filtered.length > 4) queries.push(filtered.slice(-4).join(" "))
  if (filtered.length > 3) queries.push(filtered.slice(-3).join(" "))
  return [...new Set(queries)].filter((q) => q.length >= 3)
}

/** Layer 1: find the record through the search endpoint (full data, no auth). */
async function detailViaSearch(slug: string): Promise<GobJob | null> {
  for (const query of buildQueries(slugTokens(slug))) {
    const params = new URLSearchParams()
    params.set("query", query)
    params.set("per_page", "20")
    params.append("expand[]", "seniority")
    params.append("expand[]", "company")
    const data = await jsonFetch(`${SEARCH_URL}?${params.toString()}`)
    if (data === null || !Array.isArray(data.data)) continue
    const record = data.data.find((r: any) => String(r.id).toLowerCase() === slug)
    if (record) return normalizeJob(record)
  }
  return null
}

/** First text content of an itemprop, searching from a start offset. */
function microProp(html: string, prop: string, from = 0): string | null {
  const re = new RegExp(`itemprop="${prop}"[^>]*>\\s*([^<]+)`, "i")
  const m = re.exec(html.slice(from))
  return m ? m[1].trim() : null
}

function microNumber(html: string, prop: string): number | null {
  const raw = microProp(html, prop)
  if (!raw) return null
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10)
  return isNaN(n) ? null : n
}

/**
 * Layer 2 fallback: the SSR job page carries schema.org JobPosting microdata
 * (itemprop attributes), which is more stable than the page markup itself.
 */
async function detailViaMicrodata(slug: string): Promise<(GobJob & { closed?: boolean }) | null> {
  const html = await htmlFetch(`${PUBLIC_JOB_URL}/${slug}`)
  // Closed jobs drop the JobPosting itemtype but keep the itemprops,
  // so key off itemprop="title" instead of the itemtype wrapper.
  if (!html) return null

  const title = microProp(html, "title")
  if (!title) return null

  const closed = /Closed job|No longer accepting/i.test(html)

  const orgIdx = html.search(/itemprop="hiringOrganization"/i)
  const company = orgIdx >= 0 ? microProp(html, "name", orgIdx) : null

  let description: string | null = null
  const descAttr = html.search(/itemprop="description"/i)
  if (descAttr >= 0) {
    // Slice from after the closing ">" of the tag that carries the itemprop,
    // so the attribute text itself never leaks into the extracted description.
    const descIdx = html.indexOf(">", descAttr) + 1
    const endMarkers = [/itemprop="skills"/i, /id="job-apply/i, /<\/main/i, /<\/body/i]
    let end = html.length
    for (const marker of endMarkers) {
      const m = html.slice(descIdx).search(marker)
      if (m > 0) end = Math.min(end, descIdx + m)
    }
    description = htmlToText(html.slice(descIdx, end))
  }

  const datePosted = microProp(html, "datePosted")

  return {
    closed,
    id: slug,
    title,
    company,
    location: microProp(html, "address"),
    date: datePosted ? datePosted.slice(0, 10) : null,
    url: `${PUBLIC_JOB_URL}/${slug}`,
    seniority: microProp(html, "qualifications"),
    remote: null,
    remote_modality: null,
    remote_zone: null,
    countries: [],
    salary_min_usd_month: microNumber(html, "minValue"),
    salary_max_usd_month: microNumber(html, "maxValue"),
    applications_count: null,
    description,
  }
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = slugFromInput(opts.id)
  if (!slug) {
    writeError(`Could not parse a job slug from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    let job = await detailViaSearch(slug)
    let via = "search-api"
    if (!job) {
      job = await detailViaMicrodata(slug)
      via = "microdata"
    }
    if (!job) {
      writeError("Job not found (search API and microdata fallback both missed)", "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const salary =
        job.salary_min_usd_month !== null || job.salary_max_usd_month !== null
          ? `${job.salary_min_usd_month ?? "?"}-${job.salary_max_usd_month ?? "?"} USD/mes`
          : null
      const lines = [
        job.title,
        `${job.company || "-"} · ${job.location || "-"}`,
        (job as { closed?: boolean }).closed ? "⚠ CERRADA - ya no acepta postulaciones" : "",
        "",
        job.seniority ? `Seniority: ${job.seniority}` : "",
        salary ? `Salario: ${salary}` : "",
        job.applications_count !== null ? `Aplicantes: ${job.applications_count}` : "",
        job.date ? `Publicada: ${job.date}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify({ via, ...job }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
