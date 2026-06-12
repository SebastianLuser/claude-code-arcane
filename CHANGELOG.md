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
