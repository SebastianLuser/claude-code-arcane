# Freelance platforms: what can and cannot be consumed

Status verified in August 2026, by running the requests, not by reading the documentation. Before adding a source, verify again: platforms change without notice.

## The criterion, and why it is strict

This repo is public and anyone installs it. A source joins the automatic run only if it meets **all three**:

1. **No API key or sign-up.** If every user has to request credentials, the skill works for one and is broken for the rest.
2. **Terms that allow consuming it from a local tool.** Responding technically is not enough.
3. **It has real freelance work**, not just full-time remote employment.

An API returning 200 does not qualify it. Two of the candidates most recommended online fail point 2 and were left out.

## Included

### GetOnBrd (LatAm and remote)

`https://www.getonbrd.com/api/v0` · no key · shares the API with `/job-scrape`

- `/modalities` returns `1 Full time`, `2 Part time`, **`3 Freelance`**, `4 Internship`.
- **The work-mode filter does not exist server-side.** `modality`, `modality_id`, `modalities`, `modality[]`, `filter[modality]`, `modality=freelance` and `job_modality` were tried: all seven return 200 and the same unfiltered result (48 of 50 full-time). It has to be filtered client-side.
- **Use `expand[]=company&expand[]=tags&expand[]=modality`.** Without it those fields come back as `{"data":{"id":...}}` and there is no name to show. We learned it from `job-scrape/scripts/getonbrd_search.py`, which already did it.
- **Trap:** with `expand[]` the modality id arrives as the string `"3"`; without expand, as the int `3`. Comparing the id breaks silently when the parameters change. Filter by `attributes.locale_key == "freelance"`.
- Measured yield: ~10 freelance per 200 scanned with `query=developer`.

### Himalayas (global remote)

`https://himalayas.app/jobs/api` · no key

- `employmentType` takes the values `Full Time` and **`Contractor`**.
- **It does not filter server-side either:** `employmentType=Contractor`, lowercase, `employment_type` and `type` were tried. All four return the same mixed set and an unchanged `totalCount` (97,323).
- **`limit` caps at 20** even if you ask for more. Paginate with `offset`.
- Measured yield: ~28 contractor per 120 scanned. Bias to keep in mind: the head of the feed is dominated by a single BPO company with non-technical positions (transcription, documents, expert appraisal). A query filter sorts it out, but that pool is not homogeneous and the user has to know it.

## Only for market intelligence, not for finding work

### Hacker News: "Ask HN: Freelancer? Seeking freelancer?"

`https://hn.algolia.com/api/v1` · no key · 10,000 requests per hour

The name is misleading. 6 monthly threads were measured (March to August 2026):

| Category | Comments |
|---|---|
| Freelancers offering themselves (`SEEKING WORK`) | 113 |
| Clients looking (`SEEKING FREELANCER`) | **2** |
| Not following the convention | 6 |

Reproducible: `freelance_search.py market --months 6` returns that count in `composition`.

As a work queue it is useless. As a sample of **how people with your profile position themselves and how much they charge**, it is the best there is for free. That is why it lives in the `market` subcommand and not in `search`.

Rate extraction yield: **3 rates out of 119 profiles** (~3%), median 100 USD/hour. Little, but it is real data with the verbatim quote next to it.

Implementation details: comments come with escaped HTML (`github&#x2F;user`), and those that do not follow the convention are classified as `unknown` on purpose - guessing which side they are on puts fake postings in the queue, which is worse than leaving them out.

## Excluded, with the reason

### RemoteOK

Its terms, which come **in the API payload itself**, require a do-follow backlink from your site naming RemoteOK as the source, or they suspend access.

A local CLI has no website. We cannot comply, and using it anyway would get the user's IP suspended. Also, out of 100 postings reviewed **none** had a `contract`, `freelance` or `part-time` tag. Fails point 2 and point 3.

### Remotive

Same problem and more restrictions: mandatory do-follow backlink, **at most 4 requests per day**, data with a deliberate **24-hour delay**, and an explicit ban on using the data to harvest emails. They offer a paid private API from 5,000 USD a month.

It has `job_type` with real `freelance` and `contract` values, so it meets point 3. Not the other two.

### Upwork

- **GraphQL API** at `api.upwork.com/graphql` with OAuth 2.0. The key is requested from the account's API Center (any freelancer or client, any plan - a company account is **not** needed) and according to Upwork's own support **they reply by email in about a week**. The most common rejection is incomplete account data.
- **It does have posting search** (`marketplaceJobPostingsSearch`) among its read operations, along with profiles and contracts. What it does not have is writing proposals.
- Limits if they approve you: 40,000 requests per day, 10 per second per IP.
- **There is no mutation to send a proposal or spend Connects.** It is closed on purpose to stop auto-bidding.
- **The RSS feeds died on August 20, 2024**, for the same reason. Any tutorial that mentions them is outdated.
- Scraping violates the ToS and is exactly what the platform shut down.

Because of the manual per-user approval **it does not join the automatic run**: it would break the skill for everyone except whoever has a key. If a user gets one, they can write their own adapter following the script's pattern; the supported path is pasting the posting by hand.

### Freelancer.com

API with OAuth 2.0 and per-user credentials (`Freelancer-Developer-OAuth-Client-Id`). There is no public project search endpoint. Same structural problem as Upwork.

There are third-party wrappers on RapidAPI that claim to expose the search without credentials. We do not use them: they are unofficial middlemen, they go down without notice and the way they obtain the data is not auditable.

### The rest of the Upwork-style marketplaces

A distinction that matters: GetOnBrd and Himalayas are **job boards** with a freelance work mode. Upwork is a **marketplace**: the client posts, you bid, there are Connects and escrow. None of the included sources is a marketplace, and not for lack of trying.

Tested in August 2026, real status codes:

| Platform | Endpoint tested | Result |
|---|---|---|
| Workana (LatAm) | `/jobs.rss`, `/jobs.rss?language=es`, `/api/v1/projects` | 404 on all three. There is no public feed |
| Guru | `/rss/jobs/`, `api.guru.com` | 404 and nonexistent DNS. Its `robots.txt` has an explicit `Disallow: /api/` |
| PeoplePerHour | `/freelance-jobs.rss` | 404. Its `robots.txt` has `Disallow: /*?`, meaning search URLs with filters are forbidden |
| Truelancer | `/api/projects` | 429 from the first request |
| Freelancermap (DACH) | `/project-rss.xml`, `/api/v1/projects` | 404 and **401**: the API exists but asks for credentials |
| Malt (Europe) | `/api/missions` | **401**: same story |
| Codeable, Twine | `/api/projects`, `/api/jobs` | 404 |

The two 401s are the same structural problem as Upwork: real API, per-user credential. They do not get in because of point 1.

The rest expose nothing, and where `robots.txt` speaks, it speaks against it: PeoplePerHour forbids exactly the URLs with filters and Guru forbids `/api/`. Pulling projects from there would be scraping against the site's declared policy.

**Conclusion for the profile design:** marketplaces are used by hand, in the browser. The skill does not search there; it helps with what happens after finding the posting, which is where the money is lost. Pasting the posting by hand is the supported path, not a patch.

Useful side note: Lemon.io and Proxify (marketplaces with screening) publish their searches on Working Nomads, 21 of 50 listings between the two. You cannot filter by work mode there, but it says something about strategy: passing the screening of one of those once pays off more than bidding one posting at a time.

### Fiverr

Inverted model: you do not apply to jobs, you publish gigs and the buyer finds you. "Buyer Requests" no longer exist as people knew them. There is no queue to score.

It is left out of the scanner for that reason, not because it is not worth it: the supply side is covered by `/fiverr-gig` (title, packages, gallery, FAQ and price derived from the floor).

### Toptal, Gun.io, Braintrust, Arc, Lemon.io

Verticals with prior screening. There is no consumable public board; access is earned by passing their admission process. Outside the reach of a scanner.

### We Work Remotely

It has RSS and it works (`/remote-jobs.rss`, 100 items), but **the contract category feed redirects to itself**: `/categories/remote-contract-jobs.rss` returns 301 pointing to the same URL. Without a usable contract category, the general feed is full-time employment and adds nothing to this profile.

### Arbeitnow

No key and it works. It has `job_types` with `Contract` (7 of ~100), but it is mostly German and Austrian ATS with permanent positions. Marginal: if the user ever targets the DACH market, it is worth adding.

### Jobicy

`https://jobicy.com/api/v2/remote-jobs` · no key · responds 200 and paginates well.

It passes point 1 and, unlike RemoteOK and Remotive, **it passes point 2**: its `friendlyNotice` asks for credit with a direct link and that the apply button point to the feed's original URL. A CLI meets that, because it already prints source and URL, and there is no threat of suspension.

It fails point 3, which is the one that matters: out of 100 listings, `jobType` gave **99 Full-Time and 1 Part-Time, no contract or freelance**. Asking for `jobType=contract` returns HTTP 400, meaning the value does not exist. Also the pool is dominated by Customer Support (25) and Sales (19), with only 10 from Software Engineering.

### Working Nomads

`https://www.workingnomads.com/api/exposed_jobs/` · no key · 50 listings per call.

**It has no contract type field.** The keys are `category_name`, `company_name`, `location`, `tags`, `title`, `url` and nothing else, so there is no way to filter freelance: you would have to guess from the title, and out of 50 listings only 1 mentioned it.

A detail still worth recording: the head of the feed is dominated by Proxify (15 of 50) and Lemon.io (6), which are freelance dev marketplaces. So a good share of those positions *are* contract in practice, but that is our inference and not data, and those two are already ruled out for prior screening. Guessing the work mode from the company name puts noise in the queue, which is worse than not bringing it.

## The path that does reach the marketplaces: WebSearch

Measured in August 2026. It is the exception to the credentials problem, because the credential is Claude Code itself: everyone who installs the profile already has it.

**What works.** `WebSearch` with `allowed_domains` returns real project URLs on Upwork, Workana, Freelancer.com, PeoplePerHour and Guru. Three parallel searches in one turn bring candidates from five platforms at once, with titles, and sometimes with rate and stack in the summary. Examples it returned: `upwork.com/job/Golang-Developer_~0157b3a527d0809956/`, `workana.com/es/job/crear-tienda-shopify-ecommerce`.

**What does not work, and it is the important half.** `WebFetch` returns **403 on everything**: the Workana listing, the Upwork search and even the individual project pages the search engine already had indexed. Cloudflare blocks the fetcher. So you can discover the posting but **not read it**: budget, number of proposals, the client's country and whether their payment is verified still require opening the link yourself.

**Three limits that have to be stated up front:**

1. **Freshness.** The index does not filter by date. One of the Upwork postings it returned was **posted in July 2021**. For a marketplace where a three-day-old posting is already cold, that is a serious problem.
2. **SEO noise.** About half of the results are not postings: they are "Hire Golang developers" landings, rate tables and Project Catalog gigs. They have to be discarded by URL pattern.
3. **The summary is not data.** What the search returns is a model summarizing several pages: it can mix details from two postings. It is useful as a hint to open, not as a field to save.

**Design conclusion.** It is good enough for discovery and triage, not for screening or for a reliable queue. A skill that does this has to deliver links to open and say explicitly that the date is not verified; saving that data in the registry as if it were true would be worse than not having it.

## If you want to add a source

1. **Run the request and look at the payload**, not the documentation. The two included APIs lie about their own filters.
2. **Read the terms, including whatever comes inside the response.** RemoteOK and Remotive put the conditions that disqualify them there.
3. **Measure the real freelance yield** on a sample and write it down here. A source with 2 useful postings per 500 does not justify the request.
4. **Confirm it does not need per-user credentials.** If it does, it goes in as a documented opt-in, not in `SOURCES`.
5. **Add the specs** in `tests/freelance/test_freelance_search.py` with a fixed payload. No tests against the network.
