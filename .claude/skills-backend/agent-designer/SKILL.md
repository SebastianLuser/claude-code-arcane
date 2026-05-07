---
name: agent-designer
description: "Design multi-agent systems, create agent architectures, define communication patterns, and build autonomous agent workflows with structured evaluation frameworks."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Agent Designer

Comprehensive toolkit for designing, architecting, and evaluating multi-agent systems. Provides structured approaches to agent architecture patterns, tool design principles, communication strategies, and performance evaluation frameworks.

## Core Capabilities

### Agent Architecture Patterns

- **Single Agent** -- Simple, focused tasks with clear boundaries. Minimal complexity, easy debugging.
- **Supervisor** -- One supervisor coordinating multiple specialist agents. Clear command structure, centralized decisions.
- **Swarm** -- Multiple autonomous agents with shared objectives. High parallelism, fault tolerance, emergent intelligence.
- **Hierarchical** -- Tree structure with managers and workers at different levels. Natural organizational mapping.
- **Pipeline** -- Agents in sequential processing stages. Clear data flow, specialized optimization per stage.

### Agent Role Definition

- **Identity:** Name, purpose statement, core competencies
- **Responsibilities:** Primary tasks, decision boundaries, success criteria
- **Capabilities:** Required tools, knowledge domains, processing limits
- **Interfaces:** Input/output formats, communication protocols
- **Constraints:** Security boundaries, resource limits, operational guidelines

### Common Agent Archetypes

- **Coordinator** -- Orchestrates workflows, makes high-level decisions, handles escalations
- **Specialist** -- Deep domain expertise, optimized tools, clear handoff protocols
- **Interface** -- External interactions, protocol translation, auth management
- **Monitor** -- Health monitoring, metrics collection, anomaly detection, compliance

## Implementation Guidelines

### Architecture Decision Process

1. **Requirements Analysis:** Understand system goals, constraints, scale
2. **Pattern Selection:** Choose appropriate architecture pattern
3. **Agent Design:** Define roles, responsibilities, interfaces
4. **Tool Architecture:** Design tool schemas and error handling
5. **Communication Design:** Select message patterns and protocols
6. **Safety Implementation:** Build guardrails and validation
7. **Evaluation Planning:** Define success metrics and monitoring
8. **Deployment Strategy:** Plan scaling and failure handling

### Guardrails and Safety

- **Input Validation:** Schema enforcement, content filtering, rate limiting, auth checks
- **Output Filtering:** Content moderation, consistency validation, audit logging
- **Human-in-the-Loop:** Approval workflows, escalation triggers, override mechanisms

## Reference Documentation

> See references/agent_architecture_patterns.md for detailed pattern catalog with scaling considerations and failure handling.

> See references/tool_design_best_practices.md for schema design, error handling patterns, and idempotency requirements.

> See references/evaluation_methodology.md for task completion metrics, quality assessment, cost analysis, and latency distribution frameworks.
