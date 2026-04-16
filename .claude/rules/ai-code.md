---
paths:
  - "src/ai/**"
  - "src/ml/**"
  - "src/llm/**"
  - "src/agents/**"
  - "src/inference/**"
  - "prompts/**"
  - "models/**"
---

# AI / LLM / ML Code Rules

Applies to software integrations with LLMs, ML inference, and AI agents — not NPC behavior in games
(that rule lives in `skills-gamedev/_rules/ai-code.md`).

## Prompts & Templates

- **Prompts live in dedicated files** (`prompts/[task].md`, `.prompt`, or a versioned store) — not hardcoded strings scattered in code.
- Prompts are **versioned**. A prompt change is a code change — PR reviewed, tested with evals, tagged.
- **Separate system / user / assistant roles** explicitly. Never concatenate user input into the system prompt.
- Treat **user input as untrusted**: use delimiters (XML tags, fenced blocks) and explicit instructions about how the model should handle it. Validate structure of model output before using it.
- **Output schema is enforced**: use structured outputs, tool-calling schemas, or JSON Schema validation. Never `JSON.parse` raw LLM output without validation + fallback.

## Model Selection & Cost

- **Default to the smallest capable model**. Route to larger models only for tasks that demonstrably fail on the small one (have the eval to prove it).
- **Cost budget per request is measured and logged**: token counts in + out, model, cost in $. Track P50/P95 cost per feature.
- **Timeouts and retries are bounded**: max retries ≤ 2, exponential backoff, circuit breaker on the provider. A hung LLM call must not hang a user request.
- **Streaming for user-facing generation**; batch / async for back-office work.
- **Cache deterministic calls** (same system + same user + temperature 0 → cache the response). Document TTL and invalidation.

## Safety & PII

- **No PII in prompts without redaction or consent**. If a prompt touches user data, the user's privacy policy must cover it, and the data boundary is documented.
- **No secrets / API keys ever in prompts**, including example code snippets sent to the model.
- **Hallucination-sensitive outputs require grounding**: retrieval-augmented, citations, or explicit "I don't know" fallback. Never expose an ungrounded LLM answer as factual in a high-stakes domain (medical, legal, financial).
- **Tool calls require authorization checks**: if the agent can invoke a tool that reads/writes data, the calling user's permissions apply — not the service account.
- **Prompt injection is a real threat**: sanitize tool outputs before feeding back into the context. Treat anything read from external URLs / emails / user docs as hostile.

## ML Inference (non-LLM)

- **Model versions are pinned** and logged with every prediction — `model_id`, `model_version`, feature hash.
- **Feature parity** between training and serving — use a feature store or shared transform code, not two implementations.
- **Drift monitoring** on inputs (distribution shift) and outputs (prediction distribution) — alerts before accuracy cliffs.
- **Fallback policy** for inference failures: default response, last-good cached, or fail-closed depending on risk.

## Evaluation

- **Every AI feature has an eval suite** (golden examples, adversarial inputs, regression cases) that runs in CI.
- **Eval results are tracked over time** — prompt/model changes show deltas in pass rate, not a binary pass/fail.
- **A/B on production prompts** when the stakes justify it — don't ship a prompt change to 100% of users on a hunch.

## Anti-Patterns

- `f"Summarize this: {user_input}"` — no role separation, no injection defense
- Calling the LLM in a request path with no timeout
- Storing prompt logs with raw PII forever (retention policy missing)
- "We tested it once in the playground and it worked" — that is not an eval
- Swallowing malformed JSON from the model and returning a half-broken response instead of failing cleanly
