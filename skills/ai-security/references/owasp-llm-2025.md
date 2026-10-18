# OWASP Top 10 for LLM Applications (2025) and defenses

The 2025 list (v2.0, published November 2024) replaced the 2023 one. New: LLM07 System Prompt Leakage and LLM08 Vector and Embedding Weaknesses. LLM10 Unbounded Consumption widens the old Denial of Service to cost. Sources that still show "Insecure Output Handling", "Model Denial of Service" or "Model Theft" use the 2023 list.

| ID | Risk | What to check | Defense |
|---|---|---|---|
| LLM01 | Prompt Injection | Direct (user text) and indirect (documents, web pages, tool output, emails) | Instruction hierarchy, untrusted text delimited, tools by allowlist, confirmation for actions |
| LLM02 | Sensitive Information Disclosure | PII, secrets or other tenants' data in answers or logs | Redact before the prompt, output filter, per-user retrieval filters |
| LLM03 | Supply Chain | Models, datasets, LoRA adapters and packages from third parties | Pin versions and hashes, `safetensors` not `pickle`, trusted sources; `/supply-chain-security` |
| LLM04 | Data and Model Poisoning | Fine-tuning data, RLHF feedback, documents indexed for RAG | Vet sources, review what gets indexed, keep provenance |
| LLM05 | Improper Output Handling | Model output reaching SQL, shell, HTML, file paths or other prompts unvalidated | Treat output as user input: schema, escaping, parameterized queries |
| LLM06 | Excessive Agency | Tools, permissions or autonomy beyond the task | Least privilege per tool and per user, human approval for destructive actions |
| LLM07 | System Prompt Leakage | Secrets, roles or rules that only live in the system prompt | Assume the prompt leaks: no secrets in it, enforce authorization in code |
| LLM08 | Vector and Embedding Weaknesses | Cross-tenant retrieval, poisoned embeddings, inversion of stored vectors | Partition or filter the index by tenant and permission at query time |
| LLM09 | Misinformation | Ungrounded answers presented as fact, invented packages or APIs | Grounding with citations, abstain when retrieval is weak, evals (`/llm-evals`) |
| LLM10 | Unbounded Consumption | Unlimited tokens, tool calls or requests per user, model extraction by volume | Budgets per user and request, rate limits, alerts on cost spikes |

## Canary tokens

Put a unique random string in the system prompt and in a few private documents. If it ever shows up in a response, a log export or the web, the prompt or the index leaked. Alert on it in the output filter.

## RAG security

- Scan documents before indexing: hidden instructions (white text, HTML comments, metadata), executable content, secrets.
- Store each chunk with its source and access list; filter by the requesting user's permissions **at query time**, not after generation.
- Retrieved text is untrusted input: delimit it and never let it change the task (LLM01).

## Tenant isolation

- One index or namespace per tenant when the data is sensitive; otherwise a mandatory tenant filter added in code, never by the model.
- Caches (prompt, semantic, response) are keyed by tenant: a shared semantic cache can serve one tenant's answer to another.
- Test it: an eval case where tenant A asks for tenant B's data must return nothing.
