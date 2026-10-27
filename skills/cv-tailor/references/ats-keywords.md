# ATS Keywords - How to extract and map them

Applicant Tracking Systems (Greenhouse, Lever, Workday, Workable, etc.) run a first automated filter before a human sees the CV. Understanding how they "read" changes the result.

## How an ATS works (mental model)

- It parses the CV into plain text and indexes it.
- It matches **strings** and variants against the posting and/or against the recruiter's criteria.
- It ranks or filters candidates by keyword density/relevance and by structured fields (title, dates, location).
- **What breaks parsing:** tables, columns, text boxes, headers/footers with data, charts, icons instead of text, scanned PDFs (images).

## Extracting keywords from the JD

1. **Hard skills / technologies** - languages, frameworks, DBs, cloud, tools. Copy the **literal** form (React.js ≠ React ≠ ReactJS for an exact match; when you can, include the variant the posting uses).
2. **Responsibilities / verbs** - "design REST APIs", "lead a team", "CI/CD pipelines".
3. **Methodologies** - Agile, Scrum, TDD, clean architecture.
4. **Seniority and years** - "5+ years", "senior", "lead".
5. **Explicit soft skills** - communication, ownership, cross-functional.
6. **Culture signals / trigger phrases** - e.g. "code-forward", "startup mentality", "high autonomy". They usually show what they value and give an angle for the summary and the cover letter.

## Mapping against the profile

| JD keyword | Do I have it? | Where I prove it (bullet/project) | Action |
|---|---|---|---|
| React.js | Yes | "Built React + TS frontends @ X" | highlight at the top |
| Kubernetes | Partial | exposure through CI/CD | mention honestly |
| Go | No | - | gap; do not make it up |

- **Must-have you have** → at the top, with space, with the exact word.
- **Partial must-have** → mention it honestly ("exposure to…").
- **Must-have you do not have** → real gap; do not make it up. Decide whether to apply anyway.

## Natural injection (no stuffing)

- Every keyword lives in a **true bullet** with context and result.
- A "Skills" section lists the technologies (good for the ATS), but the important ones must also appear in the experience (good for the human and for the ranking).
- Avoid lists of 40 technologies without context: it reads as filler and dilutes the ranking.

## ATS-safe format checklist

- [ ] A single column, no tables/text boxes.
- [ ] Standard section headers (Experience, Skills, Education…).
- [ ] Consistent MM/YYYY dates.
- [ ] Selectable text (not an image) - the `/cv-ats-export` export already guarantees it.
- [ ] Professional file name (`First_Last_Company.pdf`).
- [ ] Contact details in the body, not in the document's header/footer.
