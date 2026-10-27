# Index Types Reference

| Type | Use | Notes |
|------|-----|-------|
| **B-tree** (default) | Equality, range, ORDER BY, UNIQUE | 95% of cases |
| **Hash** | Skip — B-tree is equal or better | Not recommended |
| **GIN** | Arrays, jsonb, tsvector | Use `jsonb_path_ops` if only `@>` (4x smaller) |
| **GiST** | Geo (PostGIS), ranges, exclusion | For spatial/temporal data |
| **BRIN** | Huge physically ordered tables | Timestamps, sequential IDs; minimal size |
| **Partial** | `WHERE` in the definition | Soft-deletes, flags; reduces size |
| **Covering** (`INCLUDE`) | Extra columns in the leaf | Enables Index-Only Scan without going to the heap |
| **Expression** | Functions over a column | `lower(email)` — the query must match the expression |

## JSONB Indexing

- `@>` (contains): GIN with `jsonb_path_ops` (4x smaller than default)
- Only if you need `?`, `?&`, `?|`: default GIN
- A single key: expression index `((preferences->>'role'))` beats indexing the whole jsonb
