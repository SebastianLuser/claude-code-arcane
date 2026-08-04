# [2.1.0](https://github.com/SebastianLuser/claude-code-arcane/compare/v2.0.0...v2.1.0) (2026-08-04)


### Bug Fixes

* **ci:** group concurrency by branch name so a push really runs once ([54a83b7](https://github.com/SebastianLuser/claude-code-arcane/commit/54a83b729c9a82213880cf02de0bf44098040d38))
* **ci:** scope the concurrency group per event, not per branch ([1ce5273](https://github.com/SebastianLuser/claude-code-arcane/commit/1ce52739a7182f29b51af68b00b6164fc6911b72)), closes [#7](https://github.com/SebastianLuser/claude-code-arcane/issues/7)


### Features

* related notes, doc-count and python-floor guards, .base dashboard ([f4fe5c6](https://github.com/SebastianLuser/claude-code-arcane/commit/f4fe5c65deedf0ad247aaa31edfb2498183092e1))
* **second-brain:** add a hot context cache, note maturity, and cross-project reads ([9b1669f](https://github.com/SebastianLuser/claude-code-arcane/commit/9b1669f2b9808d2815a653fa34acd62531274bd0))
* **second-brain:** add Obsidian second brain profile ([882c836](https://github.com/SebastianLuser/claude-code-arcane/commit/882c83680efcb3d345888486423fad3d73f2d176))
* **second-brain:** resolve paths by role, add ranked recall, cache the inventory ([f4c9c7c](https://github.com/SebastianLuser/claude-code-arcane/commit/f4c9c7c8bbf27a4388598cdec50ed9a1141bdf7a))
* **second-brain:** who-writes-what classes, a code bridge, and sync rules ([03236d2](https://github.com/SebastianLuser/claude-code-arcane/commit/03236d20fdcee3aa55e1b26056021a0334c5497d))

# [2.0.0](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.4.0...v2.0.0) (2026-07-27)


* refactor(job-scrape)!: port both search CLIs from TypeScript to Python ([4a30a3e](https://github.com/SebastianLuser/claude-code-arcane/commit/4a30a3e7b30cbf616d01b860620172c602e5c6cf))


### Bug Fixes

* **cv-ats-export:** tell a missing verify_pdf.py apart from a missing pypdf ([f2b907e](https://github.com/SebastianLuser/claude-code-arcane/commit/f2b907e4f844725abe2b967941cef78d5fb98a0d))
* **installer:** skip Python bytecode when copying skill assets ([525967d](https://github.com/SebastianLuser/claude-code-arcane/commit/525967d0270058b9cb5967c932a4969b23e4ea27))
* **job-scrape:** accept share-button LinkedIn URLs in detail ([7f874e7](https://github.com/SebastianLuser/claude-code-arcane/commit/7f874e71007214540c5814561f8c5e9d46848cea))
* **job-scrape:** read published dates as UTC in the jobage filter ([fa8e4d7](https://github.com/SebastianLuser/claude-code-arcane/commit/fa8e4d73e68fb1b3f8071cbdd15b1da53882d6e2))


### Features

* **cv-ats-export:** add ATS text-layer verification to PDF export ([dd79cc9](https://github.com/SebastianLuser/claude-code-arcane/commit/dd79cc966f88fc3e2ab38a8ebfcc1b51f4f1ad5f))
* **job-hunt:** adopt extended application-state vocabulary and route to new skills ([4a39add](https://github.com/SebastianLuser/claude-code-arcane/commit/4a39add45301841625581ad4a42bb54442c51a8f))
* **job-scrape:** confirm the LinkedIn ToS warning before running the CLIs ([294d905](https://github.com/SebastianLuser/claude-code-arcane/commit/294d9054b8c1014bde5babdce928da6d61570102))
* **profiles:** add job-search tooling suite to job-hunt profile ([b4b061a](https://github.com/SebastianLuser/claude-code-arcane/commit/b4b061a8d724a2f9b4e94c40e83890d564ee9fd8))
* **rules:** add drafter-reviewer rule for CV and cover review ([8467c38](https://github.com/SebastianLuser/claude-code-arcane/commit/8467c38b2b0e7af98838c3a4d91c3bb0dd36b8c4))
* **skills:** add job-aplicar, job-outcome and job-upskill skills ([0401ca7](https://github.com/SebastianLuser/claude-code-arcane/commit/0401ca7e0c79b9e619ad064bb726a31d646b3fd3))
* **skills:** add job-scrape skill with bundled linkedin/getonbrd CLIs ([562bd7b](https://github.com/SebastianLuser/claude-code-arcane/commit/562bd7bd261567efcfaaa17c871f80e47a3f0824))


### Performance Improvements

* **job-scrape:** add --brief to trim JD text from GetOnBoard search ([f2309e5](https://github.com/SebastianLuser/claude-code-arcane/commit/f2309e59ffd670894829a0730763d71733e2bffd))


### BREAKING CHANGES

* the CLI paths changed from
scripts/<portal>-search/cli.ts to scripts/<portal>_search.py, and the profile's
Bash permissions moved from node to python. Reinstall the job-hunt profile.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>

# [1.4.0](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.3.0...v1.4.0) (2026-06-22)


### Features

* **ecommerce:** add language-agnostic +ecommerce addon profile ([4ccfc38](https://github.com/SebastianLuser/claude-code-arcane/commit/4ccfc387e7ae48672a3ce5ddbc18bf778f68c883))

# [1.3.0](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.2.0...v1.3.0) (2026-06-21)


### Features

* **skills:** add .NET/C# backend skill set ([3775260](https://github.com/SebastianLuser/claude-code-arcane/commit/377526032a05c2a97790a3a4396cbeada6071c1e))
* **skills:** add install-mcp skill for Unity MCP setup ([5290038](https://github.com/SebastianLuser/claude-code-arcane/commit/52900386844a18d91a3c4f9135e27c2be0be396f))
* **skills:** add job-hunt skillset (12 skills + profile) ([d5329e2](https://github.com/SebastianLuser/claude-code-arcane/commit/d5329e211a273719ded43639aa582b98c5dfc7ac))

# [1.2.0](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.1.1...v1.2.0) (2026-06-19)


### Features

* **update:** make 'arcane update' a machine-wide general update ([0ec4bdb](https://github.com/SebastianLuser/claude-code-arcane/commit/0ec4bdb3c0582ba2b60a384d05d27153ce7930a7))

## [1.1.1](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.1.0...v1.1.1) (2026-06-16)


### Bug Fixes

* **statusline:** derive context % from real session window, not hardcoded limit ([e9b835f](https://github.com/SebastianLuser/claude-code-arcane/commit/e9b835f457a69a9bbc371da382d7673abce10113))

# [1.1.0](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.0.1...v1.1.0) (2026-06-12)


### Features

* add backend-nestjs and backend-nextjs profiles with skills, rules and agents ([39e11f2](https://github.com/SebastianLuser/claude-code-arcane/commit/39e11f29825645afa64d686a5da7da853ba939b8))

## [1.0.1](https://github.com/SebastianLuser/claude-code-arcane/compare/v1.0.0...v1.0.1) (2026-06-05)


### Bug Fixes

* add/remove commands now handle full profile assets (rules, agents, statusline, permissions) ([2425ea9](https://github.com/SebastianLuser/claude-code-arcane/commit/2425ea93e3b41cc28d4b7622e6cf1a58dfaa814e))

# 1.0.0 (2026-06-03)


* feat!: migrate from Python CLI to npx arcane (TypeScript) ([9d35646](https://github.com/SebastianLuser/claude-code-arcane/commit/9d35646c1ccceac95de8e50ab70f89fc8942065c))


### Bug Fixes

* add frontmatter to arcane-* skills for lazy loading ([20ba1a6](https://github.com/SebastianLuser/claude-code-arcane/commit/20ba1a65f6f73a2ba2ce6d4357b93964335d1808))
* add type annotations to test files for strict typecheck ([a971bbd](https://github.com/SebastianLuser/claude-code-arcane/commit/a971bbda8ba7c0cc63ccd4b21bfb029a343bcc8d))
* correct directory-structure.md to show agents at repo root, not .claude/ ([0b9abfe](https://github.com/SebastianLuser/claude-code-arcane/commit/0b9abfe7128e292f3849b8e006b43e6159d62b6f))
* drop Node 18 from CI matrix — Vitest 4.x requires Node >=20 ([f87b655](https://github.com/SebastianLuser/claude-code-arcane/commit/f87b655b4aaed06fde31c5580147f20d5cbacfd2))
* relax currentBranch assertion and add timeout for git tests ([cfb2342](https://github.com/SebastianLuser/claude-code-arcane/commit/cfb23420d350ae6b9c4b7994d605da25e216e9e9))
* resolve Windows test flakiness and stderr warnings ([72d42c0](https://github.com/SebastianLuser/claude-code-arcane/commit/72d42c0adadbf5913599f411cf6ba3e93db927cc))
* retry npm publish with bypass-2FA token ([62a78d5](https://github.com/SebastianLuser/claude-code-arcane/commit/62a78d5cd6124db2f3cf2aa186fac3fca392001c))
* **statusline:** convert MSYS paths to Windows paths for python resolution ([23493d9](https://github.com/SebastianLuser/claude-code-arcane/commit/23493d9121c5138b850202cabbd7023a53eea391))
* **statusline:** count accessible skills/agents (global + project), not source catalog ([e635bd7](https://github.com/SebastianLuser/claude-code-arcane/commit/e635bd7bf51162f0feec602d6df6161c8fbf4190))
* **statusline:** show ctx as tokens / limit (pct), keep pct consistent ([a3ea541](https://github.com/SebastianLuser/claude-code-arcane/commit/a3ea54147661302624e47179db710708ff88bffb))
* trigger first npm publish with NPM_TOKEN configured ([18e2b58](https://github.com/SebastianLuser/claude-code-arcane/commit/18e2b58c510a347ebf50095fbb1c66746255b1b9))
* UTF-8 encoding on Windows CLI, rewrite README in English ([41ebb47](https://github.com/SebastianLuser/claude-code-arcane/commit/41ebb47a5453245b483006449983bdc190e92cf5))


### Features

* add 156 audited skills across 16 categories with MiniMax lazy loading ([02848c9](https://github.com/SebastianLuser/claude-code-arcane/commit/02848c993e2317ac4e87d36d5bf07fb4720902ad))
* add 21 agents across 5 new divisions and wire into profile system ([d55a5dd](https://github.com/SebastianLuser/claude-code-arcane/commit/d55a5ddcbfc74c66fe062b279903104e7654c3fa))
* add agent count to statusline, change model icon ([4b03940](https://github.com/SebastianLuser/claude-code-arcane/commit/4b03940345271300f1384f521d0535c30857a2d3))
* add auto-release, smart update, and hybrid content distribution ([bd0b3bb](https://github.com/SebastianLuser/claude-code-arcane/commit/bd0b3bb70dca9936aaad4b117a92aacc7c5f3ec8))
* add global hooks command and harden all hook scripts ([0b754ed](https://github.com/SebastianLuser/claude-code-arcane/commit/0b754edfee120292d43148a92bf89d7756ad9929))
* add interactive kickoff skill and implementation-workflow rule ([9d1e28d](https://github.com/SebastianLuser/claude-code-arcane/commit/9d1e28de90746e52dd5acc7185cad914351476de))
* add Plan + Goal combined work mode to kickoff ([b880ae7](https://github.com/SebastianLuser/claude-code-arcane/commit/b880ae736ae9bc46be8b2db6e58b7aa4005eece5))
* add proactive update notifications on session start and CLI usage ([b5484cb](https://github.com/SebastianLuser/claude-code-arcane/commit/b5484cb63bd715ee2b34ace63c7bf149876666f9))
* add profile and agent removal support ([597bd1c](https://github.com/SebastianLuser/claude-code-arcane/commit/597bd1c8e13af171073240d717f8d58b368559af))
* add Python CLI for profile deployment (arcane install) ([a9d3580](https://github.com/SebastianLuser/claude-code-arcane/commit/a9d3580bc15be5e7880eec2c0914be6c8a814cdd))
* add test suite, CI pipeline, and regenerate skills catalog ([bbd5ab9](https://github.com/SebastianLuser/claude-code-arcane/commit/bbd5ab961812758c838adac80cb0cc2730852063))
* add vn-code rule to gamedev and remove duplicate visualnovel rules dir ([92b6e3a](https://github.com/SebastianLuser/claude-code-arcane/commit/92b6e3a5e81685cfc09e334b6cd45053f14dbf8b))
* add worktree support — shared installations and one-command creation ([267c5af](https://github.com/SebastianLuser/claude-code-arcane/commit/267c5afdc50dc5f89bba70e8f099a35a8d81d7af))
* **agents:** add 6 engineering specialists (go, node, react, rn, sql, postgres) ([cff2d5f](https://github.com/SebastianLuser/claude-code-arcane/commit/cff2d5ffa0b9076b4998ce7aec15b3b9ebd5fcf8))
* dual-stack adaptation — software + gamedev split ([ca5d253](https://github.com/SebastianLuser/claude-code-arcane/commit/ca5d2534be41893ec5997fbb98000440b1e77ee5))
* initial commit — 147 skills organized in 5 stacks ([2a19a40](https://github.com/SebastianLuser/claude-code-arcane/commit/2a19a406b5c1efc828869c02e79389bff3b3427c))
* profile-based selective deploy system ([4844d6a](https://github.com/SebastianLuser/claude-code-arcane/commit/4844d6a0adb0391b46612324f8ff3fb1dcbf69b3))
* **skills:** import create-ticket + run-migrations from global config ([f653ec3](https://github.com/SebastianLuser/claude-code-arcane/commit/f653ec3989f7118d75f83cb441725f4f3b1a92e8))
* wire 156 new skills into Arcane profile system and catalog ([8f72fdf](https://github.com/SebastianLuser/claude-code-arcane/commit/8f72fdf60850531575db2c53c18e4e044da903fe))


### BREAKING CHANGES

* Distribution changes from pip install to npx arcane.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

# 1.0.0 (2026-06-03)


* feat!: migrate from Python CLI to npx arcane (TypeScript) ([9d35646](https://github.com/SebastianLuser/claude-code-arcane/commit/9d35646c1ccceac95de8e50ab70f89fc8942065c))


### Bug Fixes

* add frontmatter to arcane-* skills for lazy loading ([20ba1a6](https://github.com/SebastianLuser/claude-code-arcane/commit/20ba1a65f6f73a2ba2ce6d4357b93964335d1808))
* add type annotations to test files for strict typecheck ([a971bbd](https://github.com/SebastianLuser/claude-code-arcane/commit/a971bbda8ba7c0cc63ccd4b21bfb029a343bcc8d))
* correct directory-structure.md to show agents at repo root, not .claude/ ([0b9abfe](https://github.com/SebastianLuser/claude-code-arcane/commit/0b9abfe7128e292f3849b8e006b43e6159d62b6f))
* drop Node 18 from CI matrix — Vitest 4.x requires Node >=20 ([f87b655](https://github.com/SebastianLuser/claude-code-arcane/commit/f87b655b4aaed06fde31c5580147f20d5cbacfd2))
* relax currentBranch assertion and add timeout for git tests ([cfb2342](https://github.com/SebastianLuser/claude-code-arcane/commit/cfb23420d350ae6b9c4b7994d605da25e216e9e9))
* resolve Windows test flakiness and stderr warnings ([72d42c0](https://github.com/SebastianLuser/claude-code-arcane/commit/72d42c0adadbf5913599f411cf6ba3e93db927cc))
* **statusline:** convert MSYS paths to Windows paths for python resolution ([23493d9](https://github.com/SebastianLuser/claude-code-arcane/commit/23493d9121c5138b850202cabbd7023a53eea391))
* **statusline:** count accessible skills/agents (global + project), not source catalog ([e635bd7](https://github.com/SebastianLuser/claude-code-arcane/commit/e635bd7bf51162f0feec602d6df6161c8fbf4190))
* **statusline:** show ctx as tokens / limit (pct), keep pct consistent ([a3ea541](https://github.com/SebastianLuser/claude-code-arcane/commit/a3ea54147661302624e47179db710708ff88bffb))
* trigger first npm publish with NPM_TOKEN configured ([18e2b58](https://github.com/SebastianLuser/claude-code-arcane/commit/18e2b58c510a347ebf50095fbb1c66746255b1b9))
* UTF-8 encoding on Windows CLI, rewrite README in English ([41ebb47](https://github.com/SebastianLuser/claude-code-arcane/commit/41ebb47a5453245b483006449983bdc190e92cf5))


### Features

* add 156 audited skills across 16 categories with MiniMax lazy loading ([02848c9](https://github.com/SebastianLuser/claude-code-arcane/commit/02848c993e2317ac4e87d36d5bf07fb4720902ad))
* add 21 agents across 5 new divisions and wire into profile system ([d55a5dd](https://github.com/SebastianLuser/claude-code-arcane/commit/d55a5ddcbfc74c66fe062b279903104e7654c3fa))
* add agent count to statusline, change model icon ([4b03940](https://github.com/SebastianLuser/claude-code-arcane/commit/4b03940345271300f1384f521d0535c30857a2d3))
* add auto-release, smart update, and hybrid content distribution ([bd0b3bb](https://github.com/SebastianLuser/claude-code-arcane/commit/bd0b3bb70dca9936aaad4b117a92aacc7c5f3ec8))
* add global hooks command and harden all hook scripts ([0b754ed](https://github.com/SebastianLuser/claude-code-arcane/commit/0b754edfee120292d43148a92bf89d7756ad9929))
* add interactive kickoff skill and implementation-workflow rule ([9d1e28d](https://github.com/SebastianLuser/claude-code-arcane/commit/9d1e28de90746e52dd5acc7185cad914351476de))
* add Plan + Goal combined work mode to kickoff ([b880ae7](https://github.com/SebastianLuser/claude-code-arcane/commit/b880ae736ae9bc46be8b2db6e58b7aa4005eece5))
* add proactive update notifications on session start and CLI usage ([b5484cb](https://github.com/SebastianLuser/claude-code-arcane/commit/b5484cb63bd715ee2b34ace63c7bf149876666f9))
* add profile and agent removal support ([597bd1c](https://github.com/SebastianLuser/claude-code-arcane/commit/597bd1c8e13af171073240d717f8d58b368559af))
* add Python CLI for profile deployment (arcane install) ([a9d3580](https://github.com/SebastianLuser/claude-code-arcane/commit/a9d3580bc15be5e7880eec2c0914be6c8a814cdd))
* add test suite, CI pipeline, and regenerate skills catalog ([bbd5ab9](https://github.com/SebastianLuser/claude-code-arcane/commit/bbd5ab961812758c838adac80cb0cc2730852063))
* add vn-code rule to gamedev and remove duplicate visualnovel rules dir ([92b6e3a](https://github.com/SebastianLuser/claude-code-arcane/commit/92b6e3a5e81685cfc09e334b6cd45053f14dbf8b))
* add worktree support — shared installations and one-command creation ([267c5af](https://github.com/SebastianLuser/claude-code-arcane/commit/267c5afdc50dc5f89bba70e8f099a35a8d81d7af))
* **agents:** add 6 engineering specialists (go, node, react, rn, sql, postgres) ([cff2d5f](https://github.com/SebastianLuser/claude-code-arcane/commit/cff2d5ffa0b9076b4998ce7aec15b3b9ebd5fcf8))
* dual-stack adaptation — software + gamedev split ([ca5d253](https://github.com/SebastianLuser/claude-code-arcane/commit/ca5d2534be41893ec5997fbb98000440b1e77ee5))
* initial commit — 147 skills organized in 5 stacks ([2a19a40](https://github.com/SebastianLuser/claude-code-arcane/commit/2a19a406b5c1efc828869c02e79389bff3b3427c))
* profile-based selective deploy system ([4844d6a](https://github.com/SebastianLuser/claude-code-arcane/commit/4844d6a0adb0391b46612324f8ff3fb1dcbf69b3))
* **skills:** import create-ticket + run-migrations from global config ([f653ec3](https://github.com/SebastianLuser/claude-code-arcane/commit/f653ec3989f7118d75f83cb441725f4f3b1a92e8))
* wire 156 new skills into Arcane profile system and catalog ([8f72fdf](https://github.com/SebastianLuser/claude-code-arcane/commit/8f72fdf60850531575db2c53c18e4e044da903fe))


### BREAKING CHANGES

* Distribution changes from pip install to npx arcane.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
