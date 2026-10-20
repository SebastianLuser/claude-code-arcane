---
name: click-path-audit
description: "Trace every button, toggle and form submit through the state changes it triggers, to find controls that work in isolation but do nothing or the wrong thing together: a later call undoing an earlier one, async races, stale closures, effects that reset state, dead paths. Audit a page, a store or a whole app."
category: "frontend"
argument-hint: "[page <path> | store <name> | app]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Click-Path Audit

Static review checks that a handler exists and does not crash. It does not check that **the final state matches what the button promises**. A "New email" button that calls `setComposeMode(true)` and then `selectThread(null)` looks correct, until you notice that `selectThread` resets `composeMode` to `false`: the button does nothing.

## Phase 1: Scope

| Mode | Use when |
|---|---|
| `page <path>` | After building a page, or when a user reports a button that does nothing |
| `store <name>` | After changing a store or context: audit every caller of the changed actions |
| `app` | Before a launch or after a big refactor of shared state |

An `app` audit is expensive: map the stores first (Phase 2), then audit page by page.

## Phase 2: Map the state

For every store, context or reducer in scope (Zustand, Redux, React context, Pinia, signals), list each action:

```text
STORE emailStore
  setComposeMode(bool)  → sets {composeMode}
  selectThread(t|null)  → sets {selectedThread, messages}  RESETS {composeMode, composeData}
DANGEROUS RESETS: selectThread resets composeMode, which it does not own
```

Include the effects (`useEffect`, `watch`, subscriptions) that react to state and write state: they are hidden calls in every handler that touches their dependencies.

## Phase 3: Trace each touchpoint

For each button, toggle, link with a handler and form submit:

1. Find the handler and list its calls **in order**, following calls into the store actions and API helpers.
2. For each call: what state it reads, what it writes, what it resets as a side effect, and what effect it triggers.
3. Compare the **final state** with what the label promises ("Save" saves and shows it saved; "Delete" removes the item from the list and the server).

```text
TOUCHPOINT "New email"  ComposeButton.tsx:42
  1. setComposeMode(true)   → composeMode = true
  2. selectThread(null)     → RESETS composeMode = false   ← conflict
  EXPECTED: compose panel opens
  ACTUAL:   nothing changes
```

## Phase 4: Patterns to check

| Pattern | Looks like |
|---|---|
| **Sequential undo** | A later call (or its side effect) resets what an earlier call set |
| **Async race** | Two requests whose `.then` write the same state; the slower one wins, not the newer one. Also: a response arriving after the user navigated away or changed the filter |
| **Stale closure** | `setCount(count + 1)` twice in one handler, or a callback memoized with old dependencies; use functional updates |
| **Effect interference** | The handler sets a value, an effect watching it resets or overwrites it |
| **Missing transition** | "Save" validates but never calls the API; "Delete" sets a flag nothing reads; the endpoint it calls was removed |
| **Dead path** | The real work sits behind a condition that is always false at that moment |
| **Optimistic without rollback** | The UI updates before the request, and a failure leaves it showing a state the server does not have |
| **Double submit** | The control stays enabled during the request, so two clicks create two records |

## Phase 5: Report

For each finding:

```text
CLICK-PATH-001  [HIGH]  "New email" in ComposeButton.tsx:42
  Pattern: sequential undo
  Trace:   setComposeMode(true) → selectThread(null) resets composeMode
  Expected: compose panel opens   Actual: nothing happens
  Fix: call selectThread(null) first, or stop selectThread from resetting state it does not own
```

Severity: **CRITICAL** loses or corrupts data, **HIGH** the control does not do what it says, **MEDIUM** it works with a wrong intermediate state or a race that is rare, **LOW** cosmetic. Where a test runner exists, propose a component or end-to-end test per finding that clicks the control and asserts the final state (`/playwright-pro` for web).

| Verdict | When |
|---|---|
| **PASS** | No HIGH or CRITICAL findings |
| **CONCERNS** | MEDIUM findings only |
| **FAIL** | Any HIGH or CRITICAL finding |

## Protocol

- Read-only: this skill reports; fixes go through the normal workflow after the user picks them.
- Confirm a suspected bug by running the flow (dev server plus Playwright, or a component test) before reporting it as HIGH or CRITICAL; mark unconfirmed ones as such.

## Next steps

- `/playwright-pro` to turn findings into regression tests.
- `/ui-polish` once the controls work.
