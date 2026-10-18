# Observability for LLM features and agents

An LLM call is a dependency with variable latency, variable cost and output that can be wrong without an error. Instrument it like any dependency, plus quality and cost.

## What to record per call

| Field | Why |
|---|---|
| `model`, `model_version`, `prompt_version` | Tie a behavior change to the change that caused it |
| Input, output and cached tokens | Cost and context-window pressure |
| Cost in $ (computed from the price table) | Spend per feature, per user, per tenant |
| Latency: time to first token and total | Streaming UX and timeouts |
| Tool calls: name, arguments hash, result status, duration | Agent loops and failing tools |
| Finish reason (`stop`, `length`, `tool_use`, refusal) | Truncation and refusals show up here first |
| `trace_id`, user or tenant id (hashed), feature | Correlate with the request that triggered it |

Never store raw prompts or outputs by default: they carry PII and secrets. Sample them, redact them, and give them a short retention.

## Traces

- One span per LLM call and per tool call, children of the request span. The OpenTelemetry GenAI semantic conventions (`gen_ai.*` attributes) are the vendor-neutral form; check the attribute names against the installed SDK, since the conventions are still evolving.
- LLM-specific backends (Langfuse, Helicone, LangSmith, Arize Phoenix) add prompt/response views and eval scores on top of the traces. Langfuse and Phoenix can be self-hosted, which matters when prompts carry customer data.

## Metrics and alerts

| Metric | Alert when |
|---|---|
| Cost per hour and per feature | Above budget, or 2x the weekly baseline |
| p95 latency and time to first token | Above the feature's SLO |
| Provider error and rate-limit rate | Above the usual rate for 5+ minutes |
| Tool-call count per agent run | A run passes the expected maximum (a loop) |
| `length` finish rate | Rising: outputs are being truncated |
| Online eval score (sampled, judge or user feedback) | Drops below the offline baseline from `/llm-evals` |

## SLOs

Define them per feature, not per model: "95% of answers in under 4 s", "cost under $0.02 per conversation", "groundedness above 0.9 on the sampled set". A model or prompt change that breaks one of them is a regression, even if no request failed.
