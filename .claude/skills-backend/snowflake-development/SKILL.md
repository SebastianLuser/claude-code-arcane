---
name: snowflake-development
description: "Snowflake SQL, data pipelines (Dynamic Tables, Streams+Tasks), Cortex AI functions, Snowpark Python, and dbt integration. Covers the colon-prefix rule, semi-structured data, MERGE upserts, performance tuning, and security hardening."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Snowflake Development

Snowflake SQL, data pipelines, Cortex AI, and Snowpark Python development. Covers the colon-prefix rule, semi-structured data, MERGE upserts, Dynamic Tables, Streams+Tasks, Cortex AI functions, agent specs, performance tuning, and security hardening.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Quick Start

```bash
# Generate a MERGE upsert template
python scripts/snowflake_query_helper.py merge --target customers --source staging_customers --key customer_id --columns name,email,updated_at

# Generate a Dynamic Table template
python scripts/snowflake_query_helper.py dynamic-table --name cleaned_events --warehouse transform_wh --lag "5 minutes"

# Generate RBAC grant statements
python scripts/snowflake_query_helper.py grant --role analyst_role --database analytics --schemas public,staging --privileges SELECT,USAGE
```

## SQL Best Practices

### Naming and Style

- Use `snake_case` for all identifiers. Avoid double-quoted identifiers.
- Use CTEs (`WITH` clauses) over nested subqueries.
- Use `CREATE OR REPLACE` for idempotent DDL.
- Use explicit column lists -- never `SELECT *` in production.

### Stored Procedures -- Colon Prefix Rule

In SQL stored procedures (BEGIN...END blocks), variables and parameters **must** use the colon `:` prefix inside SQL statements. Without it, Snowflake treats them as column identifiers.

```sql
-- WRONG: missing colon prefix
SELECT name INTO result FROM users WHERE id = p_id;

-- CORRECT: colon prefix on both variable and parameter
SELECT name INTO :result FROM users WHERE id = :p_id;
```

### Semi-Structured Data

- VARIANT, OBJECT, ARRAY for JSON/Avro/Parquet/ORC.
- Access nested fields: `src:customer.name::STRING`. Always cast with `::TYPE`.
- Flatten arrays: `SELECT f.value:name::STRING FROM my_table, LATERAL FLATTEN(input => src:items) f;`

## Data Pipelines

| Approach | When to Use |
|----------|-------------|
| Dynamic Tables | Declarative transformations. **Default choice.** Define the query, Snowflake handles refresh. |
| Streams + Tasks | Imperative CDC. Use for procedural logic, stored procedure calls, complex branching. |
| Snowpipe | Continuous file loading from cloud storage (S3, GCS, Azure). |

### Dynamic Tables -- Key Rules

- Set `TARGET_LAG` progressively: tighter at the top of the DAG, looser downstream.
- Incremental DTs cannot depend on Full-refresh DTs.
- `SELECT *` breaks on upstream schema changes -- use explicit column lists.

### Streams + Tasks -- Key Rule

Tasks start SUSPENDED. You **must** resume: `ALTER TASK task_name RESUME;`

## Cortex AI

| Function | Purpose |
|----------|---------|
| `AI_COMPLETE` | LLM completion (text, images, documents) |
| `AI_CLASSIFY` | Classify text into categories (up to 500 labels) |
| `AI_FILTER` | Boolean filter on text or images |
| `AI_EXTRACT` | Structured extraction from text/images/documents |
| `AI_SENTIMENT` | Sentiment score (-1 to 1) |
| `AI_PARSE_DOCUMENT` | OCR or layout extraction from documents |
| `AI_REDACT` | PII removal from text |

**Deprecated names (do NOT use):** `COMPLETE`, `CLASSIFY_TEXT`, `EXTRACT_ANSWER`, `PARSE_DOCUMENT`, `SUMMARIZE`, `TRANSLATE`, `SENTIMENT`, `EMBED_TEXT_768`.

### TO_FILE -- Common Pitfall

Stage path and filename are **separate** arguments: `TO_FILE('@db.schema.mystage', 'invoice.pdf')` (not `TO_FILE('@stage/file.pdf')`).

## Proactive Triggers

Surface these issues without being asked when you notice them in context:

- **Missing colon prefix** in SQL stored procedures
- **`SELECT *` in Dynamic Tables** -- schema-change time bomb
- **Deprecated Cortex function names** -- suggest `AI_*` equivalents
- **Task not resumed** after creation
- **Hardcoded credentials** in Snowpark code

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Object does not exist" | Wrong database/schema context or missing grants | Fully qualify names, check grants |
| "Invalid identifier" in procedure | Missing colon prefix on variable | Use `:variable_name` |
| "Numeric value not recognized" | VARIANT field not cast | Cast explicitly: `src:field::NUMBER(10,2)` |
| Task not running | Forgot to resume after creation | `ALTER TASK task_name RESUME;` |
| DT refresh failing | Schema change upstream | Use explicit columns, verify change tracking |
| TO_FILE error | Combined path as single argument | Split into two args |

## Reference Documentation

| Document | Contents |
|----------|----------|
| `references/snowflake_sql_and_pipelines.md` | SQL patterns, MERGE templates, Dynamic Table debugging, Snowpipe, anti-patterns |
| `references/cortex_ai_and_agents.md` | Cortex AI functions, agent spec structure, Cortex Search, Snowpark |
| `references/troubleshooting.md` | Error reference, debugging queries, common fixes |
