---
type: answer_bank
updated: 
---

# Application Answers - answer bank for application forms

> Standard answers for company application forms (Ashby, Lever, Greenhouse, Workable, SmartRecruiters). `/job-apply` reads this file before filling a form and saves every new answer back here, so each question is asked once.
> Rule: only facts the user confirmed. A missing answer stays as `{{pending}}` and is asked once, then written here with the date.
> Source of facts: [[Master Profile]].
> Keep this file out of any public repo: it holds contact data and salary.

## Contact
- **Name:** {{pending}}
- **Email:** {{pending}}
- **Phone:** {{pending}}
- **LinkedIn:** {{pending}}
- **GitHub / portfolio:** {{pending}}
- **Location (city, country, time zone):** {{pending}}

## Eligibility and logistics
- **Legally authorized to work in <country>:** {{pending}}
- **Requires visa sponsorship (now or future):** {{pending}}
- **Requires relocation:** {{pending}}
- **Available onsite / hybrid in <city> (days per week):** {{pending}}
- **Work mode preference:** {{pending}}
- **English level (form with fixed options):** {{pending}} - copy the exact option text that applies.
- **English level (CV / free text):** {{pending}}
- **Notice period:** {{pending}}
- **Earliest start date:** {{pending}}

## Salary expectation
- **Foreign company, or a form that asks in USD:** {{pending}} USD per month (gross or net, say which). USD only.
- **Local company that pays in local currency and asks in it:** {{pending}} <local currency> per month (gross or net, say which). Local currency only.
- **Rule:** never mix the two currencies in one answer. If the form names no currency: foreign company = USD; local company = ask the user.

## Consents
- **SMS / WhatsApp updates from the recruiter:** {{pending}}
- **Candidate privacy notice / data processing for the application:** {{pending}} - usually required to submit.
- **Demographic / EEO questions (optional):** {{pending}} - "prefer not to say" is a valid answer.

## History with companies
- **Previously worked at:** {{pending}}
- **Hiring processes with this company in the last 6 months:** check `03-Applications/` before answering.
- **Do not apply again:** {{pending}}

## How did you hear about us?
- Default: "Company careers page" (or "Job board" / "Other: careers page", depending on the options). If it came from LinkedIn: "Social media (LinkedIn)".

## Frequent open questions

### Why <Company>, and why now?
Built per company from the reviewed cover letter in the application note in `03-Applications/`. Structure: what the company builds + the parallel with the user's real work + why it is the next step now.

### Most impactful thing you built / your specific contribution
{{pending}} - 1-2 projects, each with what was built and what the user's own part was.

### How did you know it worked? What did success look like?
{{pending}} - only confirmed evidence (in production, users, feedback, metrics). No invented numbers.

### Tell us about a production incident / a hard bug
{{pending}}

### Have you used our product?
Per company. Record the answer used in the usage log below.

## Usage log
- <YYYY-MM-DD>: <Company> (<ATS>) - answers used: <contact, eligibility, salary in USD, ...>.
