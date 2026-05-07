---
name: security-pen-testing
description: "Offensive security testing: OWASP Top 10 audits, static analysis, dependency scanning, secret detection, API security testing, and pen test report generation."
category: "security"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Security Penetration Testing

Systematic vulnerability discovery through authorized testing. Covers web applications, APIs, infrastructure, and supply chain security. This is NOT compliance checking or security policy writing.

**All testing requires written authorization** from the system owner before starting.

---

## Workflow

### Step 1: OWASP Top 10 Audit

```bash
python scripts/vulnerability_scanner.py --target web --scope full
python scripts/vulnerability_scanner.py --target api --scope quick --json
```

| # | Category | Key Tests |
|---|----------|-----------|
| A01 | Broken Access Control | IDOR, vertical escalation, JWT claim manipulation |
| A02 | Cryptographic Failures | TLS version, password hashing, hardcoded keys |
| A03 | Injection | SQLi, NoSQLi, command injection, XSS |
| A04 | Insecure Design | Rate limiting, business logic abuse |
| A05 | Security Misconfiguration | Default credentials, debug mode, headers |
| A06 | Vulnerable Components | Dependency audit, EOL checks, CVEs |
| A07 | Auth Failures | Brute force, session management, MFA bypass |
| A08 | Integrity Failures | Unsafe deserialization, SRI, CI/CD integrity |
| A09 | Logging Failures | Auth event logging, sensitive data in logs |
| A10 | SSRF | Internal IP access, cloud metadata endpoints |

Full test procedures, code patterns, and CVSS scoring: `references/owasp_top_10_checklist.md`

### Step 2: Dependency and Secret Scanning

```bash
python scripts/dependency_auditor.py --file package.json --severity critical --json
```

**Secret scanning:** TruffleHog (git history + filesystem), Gitleaks (regex-based). Configure pre-commit hooks and CI/CD gates.

### Step 3: API Security Testing

- **JWT manipulation:** alg:none, RS256-to-HS256, claim modification
- **IDOR/BOLA:** Change resource IDs across users on every endpoint
- **BFLA:** Regular user tries admin endpoints
- **Rate limiting:** Rapid-fire to auth endpoints; expect 429
- **GraphQL:** Introspection disabled, query depth limits, batch mutation restrictions

Full attack payloads and bypass techniques: `references/attack_patterns.md`

### Step 4: Web Vulnerability Testing

Key tests: XSS (reflected, stored, DOM-based), CSRF (token replay, SameSite), SQL injection (error/union/time/boolean-based), SSRF (metadata endpoints, encoding bypasses), path traversal.

### Step 5: Infrastructure Security

- Cloud storage public access
- HTTP security headers (HSTS, CSP, X-Content-Type-Options)
- TLS configuration (reject TLS 1.0/1.1, weak ciphers)
- Port scanning for dangerous open services

### Step 6: Generate Report

```bash
python scripts/pentest_report_generator.py --findings findings.json --format md --output report.md
```

Report structure: executive summary, scope, methodology, findings table (by severity/CVSS), detailed findings with evidence and remediation, priority matrix.

Responsible disclosure timeline and templates: `references/responsible_disclosure.md`

---

## Tools

### vulnerability_scanner.py
OWASP checklist generation and automated security checks.

### dependency_auditor.py
Ecosystem-aware dependency scanning with CVE triage.

### pentest_report_generator.py
Professional report generation from structured findings JSON.

---

## Anti-Patterns

1. **Testing in production without authorization** -- use staging/test environments
2. **Ignoring low-severity findings** -- chains of lows can become critical
3. **Skipping responsible disclosure** -- every vulnerability must be reported properly
4. **Relying solely on automated tools** -- tools miss business logic flaws and chained exploits
5. **Reporting without remediation guidance** -- every finding needs actionable fix steps
6. **One-time testing** -- integrate into CI/CD and schedule periodic assessments

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| red-team | Pen testing targets specific vulnerabilities; red team simulates full kill chains |
| cloud-security | Cloud posture findings feed into infrastructure security section |
| threat-detection | Pen test findings identify attack surfaces for ongoing monitoring |
| incident-response | Exploited vulnerabilities in the wild escalate to incident handling |
