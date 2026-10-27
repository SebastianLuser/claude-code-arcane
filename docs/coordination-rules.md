# Coordination Rules

How agents coordinate with each other and with the main session. Applies to software and gamedev.

---

## Rule #1 — Main Session Owns All Writes

Agents NEVER write files directly. They return analyses/proposals to the main session, which presents them to the user and performs the writes after approval.

**Exceptions:** Only the GSD system orchestrators (gsd-executor, gsd-planner) may write, after an explicit workflow approved by the user.

## Rule #2 — Agents Ask Before Writing

If an agent has Write permission, it must ask:
> "May I write this to `src/auth/middleware.ts`?"

Wait for the answer before executing. See `collaborative-design.md` for the full protocol.

## Rule #3 — Delegation Chain

The typical chain:
```
User → Main Session → Lead Agent → Specialist Agent(s)
                                 → (returns analysis)
      ← (returns analysis)
```

Do NOT delegate laterally between specialists. If a specialist needs input from another, escalate to the lead.

## Rule #4 — Vertical Delegation Only

Leaders delegate **downward** in the tier (director → lead → specialist). Never skip tiers for complex decisions.

**Horizontal Consultation:** Agents in the same tier may consult each other but may not make binding decisions outside their domain.

**Conflict Resolution:** If two agents disagree, escalate to their shared parent. If there is no shared parent, escalate to the domain's director (software → CTO, gamedev → creative-director or technical-director).

**Change Propagation:** When a change affects multiple domains, a coordinating agent (producer/program-director/technical-director) propagates it.

**No Cross-Domain File Modifications:** An agent never modifies files outside its assigned paths without explicit delegation.

## Rule #5 — Gate Verdicts

When an agent is invoked as a "gate" (approval gate), it must start its response with:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```

Then the rationale. The token on the first line lets the orchestrating skill parse it.

**Escalation:** When multiple gates run in parallel, the strictest verdict applies — a REJECT overrides any APPROVE.

## Rule #6 — Cross-Division Collaboration

For tasks that span divisions:
1. The lead of the requesting division invokes the lead of the other
2. If there is a conflict → escalate to the directors
3. If the directors do not agree → escalate to the user

## Rule #7 — No Autonomous Commits

No agent commits without an explicit instruction from the user. Not even the gsd-executor.

## Rule #8 — Document Decisions

- Architecture decisions → ADR in `docs/architecture/adr-XXXX.md`
- Product decisions → PRD in `design/product/`
- Game design decisions → "Decisions" section in the relevant GDD
- UI/UX decisions → spec in `design/ux/`

## Rule #9 — Session State

Update `.arcane/session-state/active.md` when:
- A section/phase is completed
- A significant decision is made
- The division/agent changes
- A checkpoint is reached

## Rule #10 — Confidential First

If an agent detects sensitive data (secrets, PII, credentials) in files it must read/modify:
1. Flag it to the user immediately
2. Do not process the sensitive content
3. Suggest remediation (.gitignore, secret manager, etc.)

## Rule #11 — Context Budget

Each agent has a context budget. If it is approaching the limit:
1. Summarize and return to the main session
2. Suggest spawning a new agent with a clean context
3. Never make rushed decisions because of the budget

---

## Model Tier Assignment

Skills and agents are assigned to model tiers by complexity:

| Tier | Model | When to use |
|------|-------|-------------|
| **Haiku** | `claude-haiku-4-5-20251001` | Read-only status checks, formatting, simple lookups — no creative judgment |
| **Sonnet** | `claude-sonnet-4-6` | Implementation, design authoring, analysis of individual systems — default |
| **Opus** | `claude-opus-4-6` | Multi-doc synthesis, critical phase-gates, holistic cross-system review |

**Assignment guide:**
- **Haiku** if the skill only reads and formats (status reports, changelog, onboard, scope-check)
- **Opus** if it must synthesize 5+ documents with high-impact output (architecture-review, gate-check, multi-system audit)
- **Sonnet** — default for the rest

Current examples:
- Haiku: `/changelog`, `/patch-notes`, `/onboard`, `/what-next`
- Opus: `/architecture-review`, `/gate-check`, `/audit-game`, `/audit-dev`
- Sonnet: everything else

---

## Subagents vs Agent Teams

Two distinct multi-agent patterns:

### Subagents (current, always on)

Spawned via `Task` inside a single Claude Code session. The `team-*` skills and orchestrators use this. Subagents share the session's permission context, run sequentially or in parallel within the session, and return results to the parent.

**When to spawn in parallel:** if two subagents have independent inputs (neither needs the other's output to start), spawn both `Task` calls at once instead of waiting. Example: reviewing two GDDs that do not depend on each other.

### Agent Teams (experimental — opt-in)

Multiple independent Claude Code sessions running at the same time, coordinated by a shared task list. Each session has its own context window and token budget. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

**Use agent teams when:**
- The work spans multiple subsystems that do not touch the same files
- Each workstream would take >30 min and benefits from real parallelism
- A senior agent (technical-director, program-director) coordinates 3+ specialists working on different epics at the same time

**Do NOT use agent teams when:**
- One session's output is another's input (use sequential subagents)
- The task fits in a single session (use subagents)
- Cost is a concern — each team member burns tokens independently

---

## Parallel Task Protocol

When an orchestrator skill spawns multiple independent agents:

1. Issue **all** the Task calls before waiting for any result
2. Collect all the results before moving on to dependent phases
3. If any agent is BLOCKED, surface it immediately — do not skip it silently
4. Always produce a partial report if some complete and others block

**Parallel spawn example:**
```
Phase 2 — parallel review:
  Spawn at once:
    - backend-architect → API design review
    - security-architect → threat model review
    - qa-lead → testability review
  
  Wait for all 3 verdicts.
  If any REJECT → resolve before continuing.
  If all APPROVE → move on to Phase 3.
```
