---
name: portfolio-site
description: "Build or update a personal portfolio website from a single source-of-truth profile. Two modes: sync content into an existing portfolio repo, or scaffold a new portfolio site. Triggers: portfolio website, personal page, update portfolio, sync portfolio, create portfolio, developer personal site, React portfolio."
argument-hint: "[sync | scaffold] [repo-path | --new]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch
---

# Portfolio Site - Web portfolio from the source of truth

You generate or update a **personal web portfolio** from a single source of truth (`portfolio/Portfolio Web Data.md` in the career workspace, derived from the master profile). The rule: **content is edited first in the `.md`** and synced from there to the site.

## The source of truth

`portfolio/Portfolio Web Data.md` contains, in a stable structure, everything that goes on the site: personal info (with the **public** email separate from the personal one), bios (short/medium/long), experience, education, certifications, skills with levels/%, projects (with live links), achievements, languages, references. If it does not exist, derive it from the master profile (`/master-profile`).

Convention: **values in English** (they go straight to the site) and meta-instructions in the user's language.

## Modes

### `sync` - Update an existing portfolio
For when there is already a portfolio repo (e.g. a React SPA with the content in `src/pages/*.js`, `src/data/*`, or similar).

1. Read the source of truth and the target repo.
2. Map each section of the `.md` to where it lives on the site (components/data).
3. Detect **drift**: what is outdated on the site vs the `.md` (new roles, dates, projects, language level). The source of truth wins.
4. Apply the changes to the site respecting its existing architecture and code style.
5. Verify (build/preview) and summarize the diff.

### `scaffold` - Create a new portfolio
For when there is no site yet.

1. Ask for the preferred stack (suggested default: **a simple static site** - HTML/CSS or a lightweight framework like Astro/Vite - easy to host on GitHub Pages/Netlify).
2. Ask for the desired sections (hero, about, experience, projects, skills, contact).
3. Generate the project consuming the source of truth as content.
4. Configure deploy (GitHub Pages / Netlify) if the user wants.
5. Document how to run `sync` going forward.

## Typical sections

- **Hero** - name, headline, short bio, links (GitHub/LinkedIn/public email).
- **About** - medium/long bio.
- **Experience** - roles with highlights.
- **Projects** - the featured ones, with tech, a short description and a live link.
- **Skills** - grouped, with level/%.
- **Contact** - **public** email (never the personal one), a form or links.

## Rules

- **The `.md` is the source.** Never edit the site without reflecting it in the source of truth (otherwise the drift comes back).
- **Public** email on the site, never the personal one/phone.
- Respect the existing repo's architecture and style in `sync` mode - do not rewrite everything.
- In `scaffold`, keep it simple and quick to host unless the user asks for something else.
- Do not upload sensitive data; the portfolio is public.

## Handoff

Ask for approval before writing to the portfolio repo or scaffolding a new site. When the site is READY/synced, go back to `/job-hunt status` to continue with the applications.
