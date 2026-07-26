// Data source: GetOnBoard public API v0 (https://www.getonbrd.com/api/v0).
// No authentication required for public endpoints. Search returns JSON:API
// records that already include the full job description, so there is no need
// for a per-job API call (the individual job endpoint is private/401).
// Detail falls back to the SSR public page's JSON-LD (schema.org JobPosting).

export const API_BASE = "https://www.getonbrd.com/api/v0"
export const SEARCH_URL = `${API_BASE}/search/jobs`
export const PUBLIC_JOB_URL = "https://www.getonbrd.com/jobs"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/** Fetch with exponential backoff on 429/5xx. Returns null on a 404. */
async function backoffFetch(url: string, accept: string): Promise<Response | null> {
  const maxRetries = 5
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: accept },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response
  }
  throw new Error("Request failed after max retries")
}

export async function jsonFetch(url: string): Promise<any | null> {
  const response = await backoffFetch(url, "application/json")
  return response === null ? null : response.json()
}

export async function htmlFetch(url: string): Promise<string> {
  const response = await backoffFetch(
    url,
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  )
  return response === null ? "" : response.text()
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

/** HTML -> plain text, preserving paragraph/list breaks as newlines. */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || null
}

export interface GobJob {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  seniority: string | null
  remote: boolean | null
  remote_modality: string | null
  remote_zone: string | null
  countries: string[]
  salary_min_usd_month: number | null
  salary_max_usd_month: number | null
  applications_count: number | null
  description: string | null
}

function unixToIsoDate(unix: number | null | undefined): string | null {
  if (!unix) return null
  return new Date(unix * 1000).toISOString().slice(0, 10)
}

/** Normalize one JSON:API job record from /search/jobs into a flat GobJob. */
export function normalizeJob(record: any): GobJob {
  const a = record.attributes ?? {}
  const seniority = a.seniority?.data?.attributes?.name ?? null
  const company = a.company?.data?.attributes?.name ?? null
  const countries: string[] = Array.isArray(a.countries) ? a.countries : []
  const modality = a.remote_modality ?? null
  const locationParts = [...countries]
  if (modality && !countries.includes("Remote")) locationParts.push(`(${modality})`)

  return {
    id: String(record.id),
    title: a.title ?? "(untitled)",
    company,
    location: locationParts.length ? locationParts.join(", ") : null,
    date: unixToIsoDate(a.published_at),
    url: record.links?.public_url ?? `${PUBLIC_JOB_URL}/${record.id}`,
    seniority,
    remote: typeof a.remote === "boolean" ? a.remote : null,
    remote_modality: modality,
    remote_zone: a.remote_zone ?? null,
    countries,
    salary_min_usd_month: a.min_salary ?? null,
    salary_max_usd_month: a.max_salary ?? null,
    applications_count: a.applications_count ?? null,
    description:
      htmlToText(
        [a.description, a.functions ? `\nFunciones:\n${a.functions}` : "", a.desirable ? `\nDeseable:\n${a.desirable}` : ""]
          .filter(Boolean)
          .join("\n"),
      ),
  }
}

/** Extract the job slug from a GetOnBoard URL (jobs/empleos, with or without category). */
export function slugFromInput(input: string): string | null {
  const url = input.match(/getonbrd\.[a-z.]+\/(?:jobs|empleos)\/(?:[^/]+\/)?([a-z0-9-]+)/i)
  if (url) return url[1].toLowerCase()
  if (/^[a-z0-9-]+$/i.test(input)) return input.toLowerCase()
  return null
}

/** Slug -> tokens, dropping the trailing short hash if present. */
export function slugTokens(slug: string): string[] {
  const parts = slug.split("-")
  if (parts.length > 1 && /^[0-9a-f]{3,5}$/.test(parts[parts.length - 1])) parts.pop()
  return parts
}
