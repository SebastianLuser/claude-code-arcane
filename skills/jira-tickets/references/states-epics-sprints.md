# Statuses, Epics and Sprints

## Statuses and Transitions

Transition and status names (in backticks) are the values to use in JQL and when matching API responses; the IDs are what the API needs.

| Transition | Trans. ID | Status | Status ID | Cat |
|------------|-----------|--------|-----------|-----|
| `To Do` | 11 | `To Do` | 10018 | `new` |
| `In Progress` | 21 | `In Progress` | 10012 | `in-progress` |
| `To Deploy` | 41 | `To Deploy` | 10019 | `in-progress` |
| `QA` | 51 | `Quality Control` | 10020 | `in-progress` |
| `In Review` | 61 | `In Review` | 10021 | `in-progress` |
| `IN PROD` | 81 | `IN PROD` | 10105 | `in-progress` |
| `Blocked` | 91 | `Blocked` | 10171 | `in-progress` |
| `Done` | 31 | `Done` | 10007 | `done` |
| `Canceled` | 71 | `Canceled` | 10036 | `done` |

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
