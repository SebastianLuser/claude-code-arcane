# Index Types Reference

| Tipo | Uso | Notas |
|------|-----|-------|
| **B-tree** (default) | Equality, range, ORDER BY, UNIQUE | 95% de los casos |
| **Hash** | Skip — B-tree es igual o mejor | No recomendado |
| **GIN** | Arrays, jsonb, tsvector | Usar `jsonb_path_ops` si solo `@>` (4x mas chico) |
| **GiST** | Geo (PostGIS), ranges, exclusion | Para datos espaciales/temporales |
| **BRIN** | Tablas enormes ordenadas fisicamente | Timestamps, IDs secuenciales; tamano minimo |
| **Partial** | `WHERE` en definicion | Soft-deletes, flags; reduce tamano |
| **Covering** (`INCLUDE`) | Columnas extra en leaf | Habilita Index-Only Scan sin ir a heap |
| **Expression** | Funciones sobre columna | `lower(email)` — query debe matchear la expresion |

## JSONB Indexing

- `@>` (contains): GIN con `jsonb_path_ops` (4x mas chico que default)
- Solo si necesitas `?`, `?&`, `?|`: GIN default
- Un solo key: expression index `((preferences->>'role'))` mejor que indexar todo jsonb
