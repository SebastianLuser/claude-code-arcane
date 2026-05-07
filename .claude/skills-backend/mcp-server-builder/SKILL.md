---
name: mcp-server-builder
description: "Design and ship production-ready MCP servers from OpenAPI contracts. Scaffolds Python/TypeScript servers, enforces schema quality, validates tool manifests, and manages versioning for safe evolution."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# MCP Server Builder

Design and ship production-ready MCP servers from API contracts instead of hand-written one-off tool wrappers. Focuses on fast scaffolding, schema quality, validation, and safe evolution.

The workflow supports both Python and TypeScript MCP implementations and treats OpenAPI as the source of truth.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Core Capabilities

- Convert OpenAPI paths/operations into MCP tool definitions
- Generate starter server scaffolds (Python or TypeScript)
- Enforce naming, descriptions, and schema consistency
- Validate MCP tool manifests for common production failures
- Apply versioning and backward-compatibility checks
- Separate transport/runtime decisions from tool contract design

## When to Use

- You need to expose an internal/external REST API to an LLM agent
- You are replacing brittle browser automation with typed tools
- You want one MCP server shared across teams and assistants
- You need repeatable quality checks before publishing MCP tools
- You want to bootstrap an MCP server from existing OpenAPI specs

## Key Workflows

### 1. OpenAPI to MCP Scaffold

1. Start from a valid OpenAPI spec.
2. Generate tool manifest + starter server code.
3. Review naming and auth strategy.
4. Add endpoint-specific runtime logic.

```bash
python3 scripts/openapi_to_mcp.py \
  --input openapi.json \
  --server-name billing-mcp \
  --language python \
  --output-dir ./out \
  --format text
```

### 2. Validate MCP Tool Definitions

```bash
python3 scripts/mcp_validator.py --input out/tool_manifest.json --strict --format text
```

Checks: duplicate names, invalid schema shape, missing descriptions, empty required fields, naming hygiene.

### 3. Auth & Safety Design

- Keep secrets in env, not in tool schemas.
- Prefer explicit allowlists for outbound hosts.
- Return structured errors (`code`, `message`, `details`) for agent recovery.
- Avoid destructive operations without explicit confirmation inputs.

### 4. Versioning Strategy

- Additive fields only for non-breaking updates.
- Never rename tool names in-place.
- Introduce new tool IDs for breaking behavior changes.
- Maintain changelog of tool contracts per release.

## Common Pitfalls

1. Tool names derived directly from raw paths (`get__v1__users___id`)
2. Missing operation descriptions (agents choose tools poorly)
3. Ambiguous parameter schemas with no required fields
4. Mixing transport errors and domain errors in one opaque message
5. Building tool contracts that expose secret values
6. Breaking clients by changing schema keys without versioning

## Best Practices

1. Use `operationId` as canonical tool name when available.
2. Keep one task intent per tool; avoid mega-tools.
3. Add concise descriptions with action verbs.
4. Validate contracts in CI using strict mode.
5. Keep generated scaffold committed, then customize incrementally.
6. Pair contract changes with changelog entries.

## Contract Quality Gates

Before publishing a manifest:

1. Every tool has clear verb-first name.
2. Every tool description explains intent and expected result.
3. Every required field is explicitly typed.
4. Destructive actions include confirmation parameters.
5. Error payload format is consistent across all tools.
6. Validator returns zero errors in strict mode.

## Reference Material

- [references/openapi-extraction-guide.md](references/openapi-extraction-guide.md)
- [references/python-server-template.md](references/python-server-template.md)
- [references/typescript-server-template.md](references/typescript-server-template.md)
- [references/validation-checklist.md](references/validation-checklist.md)
