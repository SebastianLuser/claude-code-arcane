import { describe, it, expect, vi, afterEach } from "vitest";
import { normalizeId } from "../../skills/job-scrape/scripts/linkedin-search/commands/detail.ts";
import {
  parseJobCards,
  parseJobDetail,
  jobageToTPR,
  workTypeFlag,
} from "../../skills/job-scrape/scripts/linkedin-search/helpers.ts";

const SEARCH_HTML = `
<ul>
  <li>
    <div class="base-card" data-entity-urn="urn:li:jobPosting:4434569000">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000?refId=abc">
        <span class="sr-only">Backend Engineer</span>
      </a>
      <h3 class="base-search-card__title">Backend Engineer</h3>
      <h4 class="base-search-card__subtitle">
        <a href="https://www.linkedin.com/company/acme?trk=guest">Acme &amp; Co</a>
      </h4>
      <span class="job-search-card__location">Madrid, Spain</span>
      <time class="job-search-card__listdate--new" datetime="2026-07-20">3 days ago</time>
    </div>
  </li>
  <li>
    <div class="base-card" data-entity-urn="urn:li:jobPosting:4434569001">
      <span class="job-search-card__location">Nowhere</span>
    </div>
  </li>
</ul>`;

const DETAIL_HTML = `
<section class="top-card-layout">
  <h1 class="top-card-layout__title">Senior Backend Engineer</h1>
  <a class="topcard__org-name-link" href="https://www.linkedin.com/company/acme?trk=guest">Acme &amp; Co</a>
  <span class="topcard__flavor topcard__flavor--bullet">Madrid, Spain</span>
  <a class="topcard__link" href="https://acme.example/apply?src=li">Apply</a>
  <div class="show-more-less-html__markup">
    <p>We need someone to own the API.</p><ul><li>Node</li><li>Postgres</li></ul>
  </div>
  <ul class="description__job-criteria-list">
    <li><h3 class="description__job-criteria-subheader">Seniority level</h3>
        <span class="description__job-criteria-text">Mid-Senior level</span></li>
    <li><h3 class="description__job-criteria-subheader">Employment type</h3>
        <span class="description__job-criteria-text">Full-time</span></li>
    <li><h3 class="description__job-criteria-subheader">Industries</h3>
        <span class="description__job-criteria-text">Software Development</span></li>
  </ul>
</section>`;

describe("normalizeId", () => {
  it("accepts a bare ID, a URN and the plain job-view URL", () => {
    expect(normalizeId("4434569000")).toBe("4434569000");
    expect(normalizeId("urn:li:jobPosting:4434569000")).toBe("4434569000");
    expect(normalizeId("https://www.linkedin.com/jobs/view/4434569000")).toBe("4434569000");
  });

  // The share button yields a trailing slash before the query string; anchoring
  // the ID on `?` alone rejected the most common paste.
  it("accepts the share-button URL shapes with a trailing slash", () => {
    expect(normalizeId("https://www.linkedin.com/jobs/view/4434569000/")).toBe("4434569000");
    expect(
      normalizeId("https://www.linkedin.com/jobs/view/4434569000/?refId=abc&trackingId=x"),
    ).toBe("4434569000");
    expect(
      normalizeId("https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000/"),
    ).toBe("4434569000");
  });

  it("accepts the slugged URL with a query string", () => {
    expect(
      normalizeId("https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000?position=1"),
    ).toBe("4434569000");
  });

  it("returns null when there is no ID to find", () => {
    expect(normalizeId("https://www.linkedin.com/jobs/")).toBeNull();
    expect(normalizeId("12345")).toBeNull(); // too short to be a job ID
  });
});

describe("parseJobCards", () => {
  it("extracts one card per posting and decodes entities", () => {
    const cards = parseJobCards(SEARCH_HTML);

    expect(cards).toHaveLength(1); // the titleless second card is skipped
    expect(cards[0]).toMatchObject({
      id: "4434569000",
      title: "Backend Engineer",
      company: "Acme & Co",
      companyUrl: "https://www.linkedin.com/company/acme",
      location: "Madrid, Spain",
      date: "2026-07-20",
      url: "https://www.linkedin.com/jobs/view/backend-engineer-at-acme-4434569000",
    });
  });

  it("stays quiet when a small response yields no cards", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    expect(parseJobCards("<html><body>No results</body></html>")).toEqual([]);
    expect(stderr).not.toHaveBeenCalled();
  });

  it("warns when a large response yields no cards (markup changed)", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    expect(parseJobCards("<div>x</div>".repeat(600))).toEqual([]);
    expect(stderr).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(String(stderr.mock.calls[0][0]));
    expect(payload.code).toBe("NO_CARDS_PARSED");
    expect(payload.error).toBeUndefined(); // a warning, not a failure
  });
});

describe("parseJobDetail", () => {
  it("pulls title, company, description and criteria", () => {
    const job = parseJobDetail(DETAIL_HTML, "4434569000");

    expect(job.title).toBe("Senior Backend Engineer");
    expect(job.company).toBe("Acme & Co");
    expect(job.location).toBe("Madrid, Spain");
    expect(job.applyUrl).toBe("https://acme.example/apply");
    expect(job.seniority).toBe("Mid-Senior level");
    expect(job.employmentType).toBe("Full-time");
    expect(job.industries).toBe("Software Development");
    expect(job.description).toContain("own the API");
    expect(job.description).not.toContain("<");
    expect(job.url).toBe("https://www.linkedin.com/jobs/view/4434569000");
  });

  it("falls back to a placeholder title instead of throwing", () => {
    expect(parseJobDetail("<html></html>", "1").title).toBe("(untitled)");
  });
});

describe("query flags", () => {
  it("maps job age to LinkedIn's f_TPR seconds", () => {
    expect(jobageToTPR(7)).toBe("r604800");
    expect(jobageToTPR(30)).toBe("r2592000");
    expect(jobageToTPR(9999)).toBeNull(); // the "all" sentinel
    expect(jobageToTPR(0)).toBeNull();
  });

  it("maps workplace type to f_WT", () => {
    expect(workTypeFlag("remote")).toBe("2");
    expect(workTypeFlag("hybrid")).toBe("3");
    expect(workTypeFlag("onsite")).toBe("1");
    expect(workTypeFlag("on-site")).toBe("1");
    expect(workTypeFlag(undefined)).toBeNull();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
