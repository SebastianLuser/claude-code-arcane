---
name: senior-prompt-engineer
description: "Prompt engineering patterns, LLM evaluation frameworks, agentic system design, and structured output design. Optimize prompts, design few-shot examples, evaluate RAG quality, and build agent workflows."
category: "ai"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Senior Prompt Engineer

Prompt engineering patterns, LLM evaluation frameworks, and agentic system design. May write or edit prompt files, agent configurations, and evaluation scripts.

## Quick Start

```bash
python scripts/prompt_optimizer.py prompts/my_prompt.txt --analyze       # Analyze prompt
python scripts/rag_evaluator.py --contexts contexts.json --questions questions.json  # Evaluate RAG
python scripts/agent_orchestrator.py agent_config.yaml --visualize       # Visualize agent
```

## Tools

### 1. Prompt Optimizer

Analyzes prompts for token efficiency, clarity, and structure. Generates optimized versions.

```bash
python scripts/prompt_optimizer.py prompt.txt --analyze          # Full analysis
python scripts/prompt_optimizer.py prompt.txt --optimize         # Generate optimized version
python scripts/prompt_optimizer.py prompt.txt --tokens --model gpt-4  # Token count
python scripts/prompt_optimizer.py prompt.txt --extract-examples --output examples.json
```

### 2. RAG Evaluator

Evaluates retrieval quality by measuring context relevance and answer faithfulness.

```bash
python scripts/rag_evaluator.py --contexts retrieved.json --questions eval_set.json
python scripts/rag_evaluator.py --contexts retrieved.json --questions eval_set.json --metrics relevance,faithfulness,coverage
python scripts/rag_evaluator.py --contexts retrieved.json --questions eval_set.json --output report.json --verbose
```

### 3. Agent Orchestrator

Parses agent definitions and visualizes execution flows. Validates tool configurations.

```bash
python scripts/agent_orchestrator.py agent.yaml --validate       # Validate config
python scripts/agent_orchestrator.py agent.yaml --visualize      # Show workflow (ASCII)
python scripts/agent_orchestrator.py agent.yaml --visualize --format mermaid  # Mermaid
python scripts/agent_orchestrator.py agent.yaml --estimate-cost  # Token estimation
```

## Prompt Engineering Workflows

### Prompt Optimization Workflow

1. **Baseline**: `python scripts/prompt_optimizer.py current_prompt.txt --analyze --output baseline.json`
2. **Identify issues**: Token waste, ambiguous instructions, missing constraints
3. **Apply patterns**:

| Issue | Pattern |
|-------|---------|
| Ambiguous output | Add explicit format specification |
| Too verbose | Extract to few-shot examples |
| Inconsistent results | Add role/persona framing |
| Missing edge cases | Add constraint boundaries |

4. **Optimize**: `python scripts/prompt_optimizer.py current_prompt.txt --optimize --output optimized.txt`
5. **Compare**: `python scripts/prompt_optimizer.py optimized.txt --analyze --compare baseline.json`
6. **Validate**: Run both prompts against evaluation set

### Few-Shot Example Design

1. Define task clearly (input format, output format)
2. Select 3-5 diverse examples: simple case, edge case, complex case, negative case
3. Format consistently
4. Validate: `python scripts/prompt_optimizer.py prompt_with_examples.txt --validate-examples`
5. Test with held-out cases

### Structured Output Design

1. Define JSON/XML schema with types, constraints, enums
2. Include schema description in prompt
3. Add format enforcement: "Respond ONLY with valid JSON. Start with { and end with }"
4. Validate: `python scripts/prompt_optimizer.py structured_prompt.txt --validate-schema schema.json`

## Reference Documentation

> See references/ for detailed patterns and examples.

| File | Contains |
|------|----------|
| `references/prompt_engineering_patterns.md` | 10 prompt patterns with I/O examples |
| `references/llm_evaluation_frameworks.md` | Evaluation metrics, scoring, A/B testing |
| `references/agentic_system_design.md` | Agent architectures (ReAct, Plan-Execute, Tool Use) |

## Common Patterns Quick Reference

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Zero-shot** | Simple, well-defined tasks | "Classify this email as spam or not spam" |
| **Few-shot** | Complex tasks, consistent format | Provide 3-5 examples before task |
| **Chain-of-Thought** | Reasoning, math, multi-step | "Think step by step..." |
| **Role Prompting** | Expertise, specific perspective | "You are an expert tax accountant..." |
| **Structured Output** | Need parseable JSON/XML | Include schema + format enforcement |
