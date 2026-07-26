import { describe, it, expect } from "vitest";
import {
  htmlToText,
  normalizeJob,
  slugFromInput,
  slugTokens,
} from "../../skills/job-scrape/scripts/getonbrd-search/helpers.ts";
import { briefJob } from "../../skills/job-scrape/scripts/getonbrd-search/commands/search.ts";

const RECORD = {
  id: "backend-developer-acme-remote-a1b2",
  links: {
    public_url: "https://www.getonbrd.com/jobs/programming/backend-developer-acme-remote-a1b2",
  },
  attributes: {
    title: "Backend Developer",
    description: "<p>Own the API.</p><ul><li>Node</li><li>Postgres</li></ul>",
    functions: "<p>Ship features</p>",
    desirable: "<p>Go</p>",
    remote: true,
    remote_modality: "remote_local",
    remote_zone: "latam",
    countries: ["Chile", "Argentina"],
    min_salary: 2000,
    max_salary: 2500,
    published_at: 1767225600, // 2026-01-01T00:00:00Z
    applications_count: 12,
    seniority: { data: { attributes: { name: "Senior" } } },
    company: { data: { attributes: { name: "Acme" } } },
  },
};

describe("slugFromInput", () => {
  it("accepts every getonbrd job URL shape and the bare slug", () => {
    const slug = "full-stack-developer-buildwithin-remote-b1ef";
    expect(slugFromInput(`https://www.getonbrd.com/jobs/programming/${slug}`)).toBe(slug);
    expect(slugFromInput(`https://www.getonbrd.com/jobs/${slug}`)).toBe(slug);
    expect(slugFromInput(`https://www.getonbrd.com/jobs/${slug}/`)).toBe(slug);
    expect(slugFromInput(`https://www.getonbrd.com/empleos/programacion/${slug}?utm_source=x`)).toBe(slug);
    expect(slugFromInput(slug)).toBe(slug);
  });

  it("returns null for anything that is not a job reference", () => {
    expect(slugFromInput("https://example.com/jobs/whatever")).toBeNull();
    expect(slugFromInput("not a slug!")).toBeNull();
  });
});

describe("slugTokens", () => {
  it("drops the trailing short hash but keeps real words", () => {
    expect(slugTokens("backend-developer-acme-remote-a1b2")).toEqual([
      "backend",
      "developer",
      "acme",
      "remote",
    ]);
    expect(slugTokens("net-backend-developer-2brains-remote")).toEqual([
      "net",
      "backend",
      "developer",
      "2brains",
      "remote",
    ]);
  });
});

describe("htmlToText", () => {
  it("keeps list and paragraph breaks and decodes entities", () => {
    const text = htmlToText("<p>Hola &amp; chau</p><ul><li>uno</li><li>dos</li></ul>");
    expect(text).toContain("Hola & chau");
    expect(text).toContain("- uno");
    expect(text).not.toContain("<");
  });

  it("decodes supplementary-plane numeric entities", () => {
    expect(htmlToText("<p>&#128512;</p>")).toBe("\u{1F600}");
    expect(htmlToText("<p>caf&#xE9;</p>")).toBe("café");
  });

  it("returns null for empty input", () => {
    expect(htmlToText("")).toBeNull();
    expect(htmlToText(null)).toBeNull();
    expect(htmlToText("<p></p>")).toBeNull();
  });
});

describe("normalizeJob", () => {
  it("flattens a JSON:API record into the CLI's shape", () => {
    const job = normalizeJob(RECORD);

    expect(job).toMatchObject({
      id: "backend-developer-acme-remote-a1b2",
      title: "Backend Developer",
      company: "Acme",
      seniority: "Senior",
      remote: true,
      remote_modality: "remote_local",
      remote_zone: "latam",
      countries: ["Chile", "Argentina"],
      salary_min_usd_month: 2000,
      salary_max_usd_month: 2500,
      applications_count: 12,
      date: "2026-01-01",
      url: "https://www.getonbrd.com/jobs/programming/backend-developer-acme-remote-a1b2",
    });
    expect(job.description).toContain("Own the API");
    expect(job.description).toContain("Funciones:");
    expect(job.description).toContain("Deseable:");
  });

  it("survives a record with nothing but an id", () => {
    const job = normalizeJob({ id: "x" });

    expect(job.title).toBe("(untitled)");
    expect(job.company).toBeNull();
    expect(job.date).toBeNull();
    expect(job.countries).toEqual([]);
    expect(job.salary_min_usd_month).toBeNull();
    expect(job.url).toBe("https://www.getonbrd.com/jobs/x");
  });
});

describe("briefJob", () => {
  it("truncates a long description and flags it", () => {
    const job = briefJob({ ...normalizeJob(RECORD), description: "x".repeat(900) });

    expect(job.description).toHaveLength(303); // 300 + "..."
    expect(job.description_truncated).toBe(true);
  });

  it("leaves a short description untouched", () => {
    const job = briefJob({ ...normalizeJob(RECORD), description: "short one" });

    expect(job.description).toBe("short one");
    expect(job.description_truncated).toBe(false);
  });

  it("keeps the structured fields, which are what triage scores on", () => {
    const job = briefJob(normalizeJob(RECORD));

    expect(job.salary_max_usd_month).toBe(2500);
    expect(job.countries).toEqual(["Chile", "Argentina"]);
    expect(job.seniority).toBe("Senior");
  });
});
