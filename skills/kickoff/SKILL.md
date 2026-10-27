---
name: kickoff
description: "Interactive session/task kickoff: choose work mode (normal, action plan, goal-driven). Guides plan and goal setup before implementation."
category: "workflow"
argument-hint: "[optional: task description]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, EnterPlanMode, TaskCreate
---
# Kickoff — Session & Task Mode Selector

Interactive entry point for new sessions or implementation tasks. Presents work-mode options and guides preparation before coding.

## Automatic trigger

This skill MUST run automatically when:
- The user starts a new session and asks to implement something
- The user describes a non-trivial implementation task (new feature, large refactor, migration)
- The user says "I want to do X" where X implies significant code changes

Do NOT run when:
- The user asks a simple question ("what does this function do?")
- The user asks for a targeted 1-3 line fix
- The user explicitly says "no plan" or "go direct"
- There is already an active plan in the conversation

## Step 1: Present the work modes

Use AskUserQuestion with these options:

**Question:** "How do you want to approach this task?"
**Header:** "Work mode"

| Option | Description |
|--------|-------------|
| **Plan + Goal (Recommended)** | The full combo: a detailed plan of HOW to implement + a clear goal of HOW FAR to get in this session and how to validate it. The most powerful option for features and refactors. |
| **Action Plan** | Step-by-step plan only. No session goal — we implement until it is done or the user stops. |
| **Goal-driven** | Verifiable goal with checkpoints only. No formal plan — we work it out as we go. |
| **Direct** | We start implementing right away. For quick fixes or when you already know exactly what to do. |

## Step 2A: Plan + Goal (if they chose the combo, recommended)

This is the most complete flow. It has 2 phases: first we set the session goal, then the implementation plan.

### Phase 1 — Define the session goal

1. Ask: "What is the verifiable goal of this session?"
2. Rephrase it as a verifiable statement (what has to be true at the end):
   - BAD: "Improve the login"
   - GOOD: "By the end of this session, Google OAuth works end-to-end in dev and has 2 passing tests"
3. Define the validation criterion: how we know the goal was met
4. Present it to the user to confirm

```
## Session Goal
[Verifiable goal]

## Validation
- [ ] How we verify it is done (command, test, observation)
- [ ] How we verify it is done well (quality criterion)
```

### Phase 2 — Build the implementation plan

1. Use EnterPlanMode
2. Inside the plan:
   - Explore the relevant codebase
   - Identify the files to modify
   - Design the approach
   - List concrete steps with a "done" criterion per step
   - Identify risks or pending decisions
3. Present the plan to the user for approval, tied to the goal

```
## Goal (from Phase 1)
[Verifiable goal]

## Implementation Plan
1. [ ] Concrete step — done criterion
2. [ ] Concrete step — done criterion
...

## Stop Conditions
- ✅ Goal met and validated → stop and report
- ⚠️ Unresolved blocker → stop and ask for a decision
- ⚠️ Scope creep detected → stop and reconfirm

## Risks
- [Decisions that could change the approach]
```

### Phase 3 — Execute

1. Create a TaskCreate for each step of the plan
2. Implement step by step, marking each one completed
3. **After each significant step**, check against the goal:
   - "Are we closer to the goal?"
   - "Did something come up that changes the plan?"
4. **When the goal is met**, STOP. Do not keep adding features.
5. Run the validation defined in Phase 1
6. Report to the user:
   - What was done
   - Validation: passes / does not pass
   - What is left outside the goal (if anything)

## Step 2B: Action Plan (if they chose plan only)

1. Ask the user to describe what they want to achieve in 1-2 sentences
2. Use EnterPlanMode
3. Inside the plan:
   - Explore the relevant codebase
   - Identify the files to modify
   - Design the approach
   - List concrete steps with a "done" criterion
   - Identify risks or pending decisions
4. Present the plan to the user for approval
5. Once approved, create a TaskCreate for each step
6. Implement step by step, marking each one completed

**Plan template:**
```
## Goal
[What we want to achieve]

## Context
[Why it is needed, what problem it solves]

## Steps
1. [ ] Concrete step with a done criterion
2. [ ] Concrete step with a done criterion
...

## Risks
- [Decisions that could change the approach]

## Verification
- [ ] How we know it is done right
```

## Step 2C: Goal-driven (if they chose goal only)

1. Ask the user with AskUserQuestion:
   - **"What is the goal of this session?"** (free text)
   
2. Rephrase the goal as a verifiable statement:
   - BAD: "Improve the login"
   - GOOD: "By the end of this session, the login supports Google OAuth and has tests"

3. Present the rephrased goal for confirmation

4. Define intermediate checkpoints (2-4):
   ```
   ## Session Goal
   [Verifiable goal]
   
   ## Checkpoints
   - [ ] Checkpoint 1: [partial milestone]
   - [ ] Checkpoint 2: [partial milestone]
   - [ ] Checkpoint 3: [goal reached]
   ```

5. Create a TaskCreate for each checkpoint

6. Work toward each checkpoint, validating progress

7. When each checkpoint is completed, report status:
   - "Checkpoint 1 completed. Progress: 33%. Next: [checkpoint 2]"

## Step 2D: Direct (if they chose direct)

Proceed with the implementation immediately. No formal plan, no goal tracking.
Just say: "Great, let's start." and get to work.

## Rules

- **Never assume the mode** — always ask unless the user already said which
- **Respect "direct"** — if the user wants to go without a plan, do not insist
- **Plan ≠ bureaucracy** — the plan must be concise and useful, not a long document
- **Verifiable goals** — a goal that cannot be verified is useless
- **Escape hatch** — at any moment the user can say "let's skip the plan" and you proceed directly
- **Do not block urgent fixes** — if the user reports a production bug, do not ask for a plan
