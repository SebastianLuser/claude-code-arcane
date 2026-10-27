# Director Gates — Shared Infrastructure

Defines the shared mechanisms for gates (approval checkpoints) in Arcane.
The specific gates live in:

- `.claude/docs/gates/software-gates.md` — gates for software development (CTO, VPE, PM, SEC, QA)
- `.claude/docs/gates/gamedev-gates.md` — gates for game development (CD, TD, PR, AD, LP, QL, ND)

Skills reference gates by ID instead of embedding the full prompt. That way, when we update a prompt, there is no drift between skills.

---

## How to use this system

In any skill, replace an inline director prompt with a reference:

```
Spawn `cto` via Task using the gate **CTO-ARCHITECTURE** from
`.claude/docs/gates/software-gates.md`.
```

Pass the context listed under the gate's **Context to pass** field, and handle the verdict according to the **Verdict Handling** rules below.

---

## Review Modes

Review intensity controls whether gates run. It can be set globally (persists across sessions) or overridden per invocation.

### Global config

`production/review-mode.txt` — one word: `full`, `lean`, or `solo`.
Set it once during `/start`. Edit the file directly to change it.

### Per-invocation override

Any skill with gates accepts `--review [full|lean|solo]` as an argument. The override applies only to that run.

Examples:
```
/gate-check concept                       → uses the global mode
/gate-check concept --review full         → forces full for this run
/design-system combat --review solo       → skips every gate
```

### Modes

| Mode | What runs | For whom |
|------|-----------|-----------|
| `full` | Every gate — each step is reviewed | Teams, learning users, or when you want exhaustive feedback |
| `lean` | Only PHASE-GATEs (via `/gate-check`) — per-skill gates skipped | **Default** — solo devs and small teams; directors review at milestones |
| `solo` | No gates | Prototypes, game jams, maximum speed |

### Check pattern (apply before every spawn)

```
Before spawning gate [GATE-ID]:
1. If the skill was invoked with --review [mode], use that
2. Otherwise read production/review-mode.txt
3. Otherwise default to lean

Apply the resolved mode:
- solo → skip every gate. Note: "[GATE-ID] skipped — Solo mode"
- lean → skip unless it is a PHASE-GATE. Note: "[GATE-ID] skipped — Lean mode"
- full → spawn normally
```

---

## Invocation Pattern (copy into any skill)

**MANDATORY:** Resolve the review mode before every spawn. Never spawn without the check.

```
# Apply mode check, then:
Spawn `[agent-name]` via Task:
- Gate: [GATE-ID] (see .claude/docs/gates/[software|gamedev]-gates.md)
- Context: [fields listed under the gate]
- Await the verdict before proceeding.
```

### Parallel spawn (multiple directors at the same checkpoint)

```
# Apply the mode check for each gate first, then spawn the ones that survive:
Spawn the [N] agents simultaneously via Task — issue every Task call
before waiting on any result. Collect every verdict before proceeding.
```

---

## Standard Verdict Format

Every gate returns one of three verdicts. Skills must handle all three:

| Verdict | Meaning | Default action |
|---------|---------|----------------|
| **APPROVE / READY** | No issues. Proceed. | Continue the workflow |
| **CONCERNS [list]** | Issues present but not blocking. | Surface to the user via `AskUserQuestion` — options: `Revise flagged items` / `Accept and proceed` / `Discuss further` |
| **REJECT / NOT READY [blockers]** | Blocking issues. Do not proceed. | Surface the blockers to the user. Do not write files or advance the stage until resolved. |

### Escalation rule

When multiple directors are spawned in parallel, apply the strictest verdict — one NOT READY overrides any READY.

### Mandatory first line

Every agent invoked as a gate must start its response with:
```
[GATE-ID]: APPROVE | CONCERNS | REJECT
```

Then the rationale. The token on the first line lets the orchestrating skill parse it automatically.

---

## Recording Gate Outcomes

After a gate resolves, record the verdict in the status header of the relevant document:

```markdown
> **[Director] Review ([GATE-ID])**: APPROVED [date] / CONCERNS (accepted) [date] / REVISED [date]
```

For phase gates, record it in:
- Software: `docs/architecture/architecture.md` or `.arcane/session-state/active.md`
- Gamedev: `docs/architecture/architecture.md` or `.arcane/session-state/active.md`

---

## Parallel Gate Protocol

When a workflow needs multiple directors at the same checkpoint (very common in `/gate-check`), spawn every agent simultaneously:

```
Spawn in parallel (issue every Task call before waiting on any result):

SOFTWARE:
1. cto                → gate CTO-PHASE-GATE
2. vpe                → gate VPE-PHASE-GATE
3. pm                 → gate PM-PHASE-GATE
4. security-architect → gate SEC-PHASE-GATE
5. qa-lead            → gate QA-PHASE-GATE

GAMEDEV:
1. creative-director  → gate CD-PHASE-GATE
2. technical-director → gate TD-PHASE-GATE
3. producer           → gate PR-PHASE-GATE
4. art-director       → gate AD-PHASE-GATE

Collect every verdict, apply the escalation rules:
- Any NOT READY / REJECT → overall minimum FAIL
- Any CONCERNS → overall minimum CONCERNS
- All READY / APPROVE → eligible for PASS (subject to artifact checks)
```

---

## Adding New Gates

When a new gate is needed for a skill or workflow:

1. Assign a gate ID: `[DIRECTOR-PREFIX]-[DESCRIPTIVE-SLUG]`
   - Software prefixes: `CTO-`, `VPE-`, `PM-`, `SEC-`, `QA-`, `DESIGN-` (UX lead)
   - Gamedev prefixes: `CD-`, `TD-`, `PR-`, `AD-`, `LP-`, `QL-`, `ND-`
   - New prefixes for new agents (e.g. `DATA-` for data-lead)
2. Add the gate in the appropriate director's section with the 5 fields:
   Trigger, Context to pass, Prompt, Verdicts, and special handling notes
3. Reference the gate in skills by ID only — never copy the full prompt
