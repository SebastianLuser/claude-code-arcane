# Statuses, Epics and Sprints

## Statuses and Transitions

Transition and status names (in backticks) are the literal values configured in the Educabot Jira workflow, which is in Spanish. Use them verbatim in JQL and when matching API responses; the English column is only a gloss.

| Transition | Trans. ID | Status | Status ID | Cat | English gloss |
|------------|-----------|--------|-----------|-----|---------------|
| `Por hacer` | 11 | `Tareas por hacer` | 10018 | `new` | To do |
| `En curso` | 21 | `En curso` | 10012 | `in-progress` | In progress |
| `Por subir` | 41 | `Por subir` | 10019 | `in-progress` | To deploy |
| `QA` | 51 | `Control de calidad` | 10020 | `in-progress` | QA |
| `En revision` | 61 | `En revision` | 10021 | `in-progress` | In review |
| `EN PROD` | 81 | `EN PROD` | 10105 | `in-progress` | In prod |
| `Blocked` | 91 | `Blocked` | 10171 | `in-progress` | Blocked |
| `Listo` | 31 | `Finalizada` | 10007 | `done` | Done |
| `Canceled` | 71 | `Cancelado` | 10036 | `done` | Canceled |

## Active TUNI epics

| Key | Description |
|-----|-------------|
| TUNI-181 | Canvas LMS integration |
| TUNI-905 | Adaptive model |
| TUNI-1007 | Adaptive tutoring session |
| TUNI-1008 | Content generator |
| TUNI-1009 | Mobile |
| TUNI-1010 | Supervision tools |
| TUNI-1011 | Student identity hub |
| TUNI-1012 | Social features |
| TUNI-1016 | Review mode |
| TUNI-1017 | Performance mode |
| TUNI-1018 | Cosmos (white-labeling) |
| TUNI-1019 | Memory (context persistence) |
| TUNI-1085 | Initial leveling |

Canceled: TUNI-903, TUNI-906 (replaced by 1007/1008).

## Known sprints

| Sprint | ID | State |
|--------|----|--------|
| AI Sprint 31 | 2147 | closed |
| AI Sprint 32 | 2213 | active |
| AI Sprint 33 | 2280 | future |
