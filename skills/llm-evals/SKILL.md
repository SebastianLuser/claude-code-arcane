---
name: llm-evals
description: "Evals for LLM features, agents and RAG: golden dataset, four eval layers, LLM-as-judge, RAG metrics, CI gate against a baseline. Design, run or review an eval suite."
category: "ai"
argument-hint: "[design | run | review] [feature]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LLM Evals

Unit tests check code with the model faked; evals check behavior with the real model. An LLM feature without evals changes behavior on every prompt or model update and nobody notices. This skill builds the suite the `llm-code` rule asks for.

## Phase 1: Scope

| Mode | Does |
|---|---|
| `design` | Builds the dataset and the eval plan for a feature |
| `run` | Runs the suite and compares it with the baseline |
| `review` | Audits an existing suite and gives a verdict |

Read the feature's prompts, tools and output schema first. Ask what a wrong answer costs: a typo in a summary or a wrong refund. That decides the thresholds.

## Phase 2: Dataset

- **Golden set:** 30–100 real inputs with the expected output or the facts it must contain. Take them from production logs (redacted) or support tickets, not invented by the same model.
- **Edge cases:** empty and very long inputs, other languages, ambiguous requests, inputs that should be refused.
- **Adversarial:** prompt injection in user text and in retrieved documents, requests outside the tool's scope.
- **Regressions:** every bug fixed in production becomes a case.
- Version the dataset with the code (`evals/datasets/*.jsonl`). Never edit a case to make it pass.

## Phase 3: Eval layers

| Layer | Question | Check |
|---|---|---|
| **1. Output** | Is each answer right and well formed? | Schema validation, exact or fuzzy match, contains the required facts |
| **2. Tool choice** (agents) | Did it call the right tool with the right arguments? | Compare the tool call trace with the expected one; argument schema |
| **3. Task** (agents) | Did the whole multi-step task end in the right state? | Check the final state (record created, file written), not the transcript |
| **4. Safety** | Does it refuse or contain what it must? | Injection cases do not change behavior; no secrets or PII in the output; destructive tools ask for confirmation |

Prefer deterministic checks. Use a judge only where a rule cannot decide.

## Phase 4: LLM-as-judge

- One criterion per judge prompt, a 1–5 scale with each score defined, and the reasoning before the score.
- A different model, or at least a different prompt, from the one being judged.
- Calibrate: score 20 cases by hand, compare with the judge, and keep it only if it agrees on most of them.
- Store the judge prompt and model version with the results; a judge change is a baseline change.

## Phase 5: RAG metrics

| Metric | Measures |
|---|---|
| **Retrieval recall@k** | The chunk with the answer is among the top k |
| **Groundedness** | Every claim in the answer is supported by a retrieved chunk |
| **Answer relevance** | The answer addresses the question |
| **Abstention** | With no supporting chunk, it says it does not know instead of guessing |

Low groundedness with good recall is a prompt problem; low recall is an indexing or chunking problem (see `/rag-architect`).

## Phase 6: Run and gate

- Run with a fixed model version and temperature 0 where the API allows it; for sampled outputs run each case 3 times and score the rate.
- Record per run: pass rate per layer, cost, p95 latency, model and prompt versions.
- **CI gate:** run on every change to prompts, tools, model or retrieval. Fail when a layer drops below its baseline by more than the agreed margin, or any safety case fails.
- Tools: a plain test runner with a JSONL loader is enough; promptfoo, Braintrust or Langfuse datasets add reporting. Check the installed version's docs before writing config from memory.

## Phase 7: Verdict (review mode)

| Verdict | When |
|---|---|
| **PASS** | Golden, edge and adversarial cases exist; layers that apply are covered; CI gate compares with a baseline |
| **CONCERNS** | Suite exists but misses a layer, has no baseline, or uses an uncalibrated judge |
| **FAIL** | No eval suite, or no safety cases for a feature with tools or user data |

## Protocol

- Ask before writing dataset files or CI workflows.
- Evals hit a paid API: estimate the cost of one run before running it.
- Never put real PII in the dataset; redact before saving.

## Next steps

- `/llm-cost-optimizer` once quality is measured, to cut cost without losing it.
- `/ai-security` for a deeper look at injection and data exposure.
- `/observability` to track the same metrics in production.
