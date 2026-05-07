---
name: helm-chart-builder
description: "Build production-grade Helm charts: scaffolding, values design, template patterns, dependency management, security hardening, and chart testing with lint/test workflows."
category: "devops"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Helm Chart Builder

Opinionated Helm workflow that turns ad-hoc Kubernetes manifests into maintainable, testable, reusable charts. Covers chart structure, values design, template patterns, dependency management, and security hardening.

May I write Helm chart files, templates, and values configurations to your project?

---

## Workflow

### Step 1: Identify Workload Type

- Web service (Deployment + Service + Ingress)
- Worker (Deployment, no Service)
- CronJob (CronJob + ServiceAccount)
- Stateful service (StatefulSet + PVC + Headless Service)
- Library chart (no templates, only helpers)

### Step 2: Scaffold Chart

Generate a production-ready chart structure:

```bash
python3 scripts/chart_analyzer.py mychart/
helm lint mychart/
helm template mychart/ --debug
```

Chart structure, Chart.yaml best practices, and values.yaml documentation guidelines: `references/chart-patterns.md`

### Step 3: Review Chart

| Check | Severity | Fix |
|-------|----------|-----|
| Missing _helpers.tpl | High | Create helpers for common labels and selectors |
| No resource requests/limits | Critical | Add resources section with defaults in values.yaml |
| Hardcoded image tag | High | Use `{{ .Values.image.repository }}:{{ .Values.image.tag }}` |
| Missing liveness/readiness probes | High | Add probes with configurable paths and ports |
| Missing standard labels | High | Use `app.kubernetes.io/*` labels via _helpers.tpl |
| No NOTES.txt | Medium | Add post-install instructions |

### Step 4: Security Audit

| Check | Severity | Fix |
|-------|----------|-----|
| No securityContext | Critical | Add runAsNonRoot, readOnlyRootFilesystem |
| Running as root | Critical | Set `runAsNonRoot: true`, `runAsUser: 1000` |
| All capabilities retained | High | Drop ALL, add only specific needed caps |
| No NetworkPolicy | Medium | Add default-deny ingress + explicit allow rules |
| Secrets in values.yaml | Critical | Use external secrets operator or sealed-secrets |
| automountServiceAccountToken true | Medium | Set to false unless pod needs K8s API access |

Full security checklist and RBAC audit details: `references/chart-patterns.md`

### Step 5: Validate

```bash
helm lint mychart/
helm template mychart/ --debug
python3 scripts/values_validator.py mychart/values.yaml
```

---

## Tools

### chart_analyzer.py
Static analysis of Helm chart directories: structure validation, template anti-patterns, labels, security baseline.

```bash
python3 scripts/chart_analyzer.py mychart/
python3 scripts/chart_analyzer.py mychart/ --output json
python3 scripts/chart_analyzer.py mychart/ --security
```

### values_validator.py
Validates values.yaml against best practices: documentation coverage, type consistency, hardcoded secrets detection, naming conventions.

```bash
python3 scripts/values_validator.py values.yaml
python3 scripts/values_validator.py values.yaml --strict
```

---

## Values Design Principles

- Flat over nested (max 3 levels deep)
- Group by resource (`service.*`, `ingress.*`, `resources.*`)
- Use `enabled: true/false` for optional resources
- Document every key with inline YAML comments
- Provide sensible development defaults
- camelCase for keys; match upstream conventions (`image.repository`, `image.tag`)

---

## Proactive Triggers

Flag these without being asked:
- **No _helpers.tpl** -- every chart needs standard labels and fullname helpers
- **Hardcoded image tag** -- must be overridable via values.yaml
- **No resource requests/limits** -- pods without limits can starve the node
- **Running as root** -- add securityContext for production charts
- **Secrets in values.yaml defaults** -- use placeholders with comments

---

## Reference Documentation

| Document | Contents |
|----------|----------|
| `references/chart-patterns.md` | Chart structure, template patterns (labels, conditionals, security-hardened pod spec), dependency management |
| `references/values-design.md` | Values structure, naming conventions, anti-patterns, subchart overrides |
