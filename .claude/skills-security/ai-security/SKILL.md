---
name: ai-security
description: "Assess AI/ML systems for prompt injection, jailbreak vulnerabilities, model inversion, data poisoning, and agent tool abuse with MITRE ATLAS technique mapping."
category: "security"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# AI Security

AI and LLM security assessment for prompt injection, jailbreak vulnerabilities, model inversion risk, data poisoning exposure, and agent tool abuse. This is NOT general application security (see security-pen-testing) or behavioral anomaly detection (see threat-detection).

---

## Workflow

### Step 1: Run AI Threat Scanner

```bash
# Scan built-in seed prompts (black-box)
python3 scripts/ai_threat_scanner.py --target-type llm --access-level black-box --json

# Custom test file (gray-box requires --authorized)
python3 scripts/ai_threat_scanner.py --target-type llm --access-level gray-box \
  --test-file prompts.json --authorized --json

# Scope to specific categories
python3 scripts/ai_threat_scanner.py --target-type llm \
  --scope prompt-injection,jailbreak --json
```

**Exit codes:** 0 = low risk, 1 = medium/high findings, 2 = critical or missing authorization.

**Authorization required:** Gray-box and white-box access levels require written authorization before testing.

### Step 2: Assess Injection Risk

Injection signatures detected by the scanner:

| Signature | Severity | ATLAS ID |
|-----------|----------|----------|
| direct_role_override | Critical | AML.T0051 |
| indirect_injection | High | AML.T0051.001 |
| jailbreak_persona | High | AML.T0051 |
| system_prompt_extraction | High | AML.T0056 |
| tool_abuse | Critical | AML.T0051.002 |
| data_poisoning_marker | High | AML.T0020 |

Injection score (0.0-1.0) measures proportion of matched signatures. Score above 0.5 warrants immediate guardrail deployment.

### Step 3: Score Model-Level Risks

**Model inversion risk by access level:**
- white-box: Critical (0.9) -- gradient-based inversion; requires differential privacy
- gray-box: High (0.6) -- confidence-based inference; disable logit outputs
- black-box: Low (0.3) -- label-only attacks; monitor high-volume querying

**Data poisoning risk by scope:**
- fine-tuning: High (0.85) -- audit all training examples
- rlhf: High (0.70) -- vet feedback contributors
- retrieval-augmented: Medium (0.60) -- validate content before indexing
- pre-trained/inference-only: Low -- verify model provenance

### Step 4: Design Guardrails

**Input validation:** injection signature filter, semantic similarity filter, input length limit, content policy classifier.

**Output filtering:** system prompt confidentiality, PII detection, URL/code validation.

**Agent-specific:** tool parameter validation, human-in-the-loop gates for destructive actions, scope enforcement, context integrity monitoring.

Full ATLAS technique coverage and guardrail patterns: `references/atlas-coverage.md`

---

## Tool Reference

### ai_threat_scanner.py

```bash
# List all injection signatures with ATLAS IDs
python3 scripts/ai_threat_scanner.py --list-patterns

# CI/CD gate -- block on critical
python3 scripts/ai_threat_scanner.py --target-type llm \
  --test-file tests/adversarial_prompts.json \
  --scope prompt-injection,jailbreak,tool-abuse --json
```

**Test file format:** JSON array of strings or objects with `"prompt"` key.

---

## Anti-Patterns

1. **Testing only known jailbreak templates** -- published templates are already blocked; test domain-specific patterns
2. **Treating static matching as complete** -- complement with red team adversarial testing and semantic filtering
3. **Ignoring indirect injection for RAG** -- retrieved external content is a higher-risk vector than user input
4. **Not testing with production system prompt** -- a jailbreak may succeed only against the specific system prompt
5. **Deploying without output filtering** -- input validation alone is insufficient; add PII and policy filters
6. **Skipping authorization for gray/white-box testing** -- enables data extraction; requires legal review

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| threat-detection | Anomaly detection in LLM inference logs surfaces injection probing |
| incident-response | Confirmed prompt injection or data extraction is a security incident |
| cloud-security | LLM API keys and model endpoints are cloud resources |
| security-pen-testing | Covers web/API layer; ai-security covers model and agent layer |
