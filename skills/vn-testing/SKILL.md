---
name: vn-testing
description: "Test visual novel completeness and correctness: path coverage, dead-end detection, flag consistency, asset references, dialogue lint, and playthrough simulation."
category: "visualnovel"
argument-hint: "[paths | flags | assets | dialogue | full] [--chapter <name>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion
---

When this skill is invoked:

1. **Parse test scope**: paths, flags, assets, dialogue, or full (all)
2. **Load project**:
   - Glob `game/chapters/*.rpy` + `game/script.rpy` — all script files
   - Read `game/characters.rpy` — character definitions
   - Read `game/variables.rpy` — flag and variable declarations

---

## Test Suite: Path Coverage

Analyze all labels and jumps to verify story graph integrity.

### Steps:
1. Extract all `label` definitions across .rpy files
2. Extract all `jump`, `call`, and `menu` targets
3. Build directed graph of label → jump connections
4. Verify:

| Check | Description | Severity |
|-------|-------------|----------|
| Dead ends | Labels that don't jump anywhere and aren't endpoints | CRITICAL |
| Unreachable labels | Labels no path leads to | WARNING |
| Missing targets | `jump X` where label X doesn't exist | CRITICAL |
| Circular paths | Infinite loops without exit conditions | CRITICAL |
| Endpoint coverage | All routes reach a valid ending label | CRITICAL |
| Convergence | Branch paths properly merge or terminate | WARNING |

### Output:
```
PATH COVERAGE REPORT
====================
Total labels: 47
Reachable from 'start': 45
Unreachable: 2 (chapter_5_deleted_scene, test_label)
Dead ends: 0
Missing jump targets: 1 (chapter_3_path_c — referenced in chapter_3.rpy:89)
Circular paths: 0
Endpoints reached: 6/6 endings

Route coverage:
- Route A (Sakura): start → ... → ending_sakura_good ✅
- Route A (bad):    start → ... → ending_sakura_bad ✅
- Route B (Ryu):    start → ... → ending_ryu_good ✅
- Route B (bad):    start → ... → ending_ryu_bad ✅
- Secret route:     start → ... → ending_true ✅
- Bad ending:       start → ... → ending_bad_generic ✅
```

---

## Test Suite: Flag Consistency

Verify all flags and variables are properly declared, set, and checked.

### Steps:
1. Extract all `$ flags.*` and `$ [var] =` assignments
2. Extract all `if flags.*` and `if [var]` conditions
3. Cross-reference with `game/variables.rpy` declarations
4. Check:

| Check | Description | Severity |
|-------|-------------|----------|
| Undeclared flags | Flag used but not declared in variables.rpy | WARNING |
| Unused flags | Flag declared and set but never checked | WARNING |
| Unchecked set flags | Flag set but never influences any condition | INFO |
| Set-before-check | Flag checked before any path can set it | CRITICAL |
| Type mismatch | Variable compared as wrong type | CRITICAL |
| Affinity ranges | Relationship values checked against impossible thresholds | WARNING |

### Output:
```
FLAG CONSISTENCY REPORT
=======================
Flags declared: 24
Flags used (set): 22
Flags used (checked): 20

⚠ Undeclared: flag_secret_room (set in chapter_5.rpy:33, never declared)
⚠ Unused: flag_old_letter (declared in variables.rpy:15, never set or checked)
⚠ Set-never-checked: flag_pet_cat (set in chapter_2.rpy:88, never checked)
❌ Check-before-set: flag_confession at chapter_3.rpy:12 — earliest set is chapter_4.rpy:55
✅ Affinity ranges: all thresholds reachable within possible score bounds
```

---

## Test Suite: Asset References

Verify all referenced assets exist on disk.

### Steps:
1. Extract all `show [image]`, `scene [image]`, `play music/sound`, `voice` commands
2. Resolve image names to file paths using Ren'Py naming conventions
3. Check file existence

### Output:
```
ASSET REFERENCE REPORT
======================
Images referenced: 89
Images found: 85
Images missing: 4
  - chars/yuki/face_thinking.png (chapter_4.rpy:22)
  - bg/hospital_room.png (chapter_7.rpy:5)
  - cg/cg_008_ending.png (chapter_8.rpy:112)
  - ui/phone_notification.png (screens.rpy:45)

Audio referenced: 34
Audio found: 30
Audio missing: 4
  - bgm/festival_theme.ogg (chapter_6.rpy:1)
  - sfx/glass_break.ogg (chapter_7.rpy:67)
  - sfx/rain_heavy.ogg (chapter_4.rpy:30)
  - voice/sakura/line_045.ogg (chapter_3.rpy:99)
```

---

## Test Suite: Dialogue Lint

Quality checks on dialogue content.

### Checks:
| Check | Description | Severity |
|-------|-------------|----------|
| Line length | Dialogue > 200 chars (may overflow textbox) | WARNING |
| Undefined speaker | Dialogue attributed to undeclared character | CRITICAL |
| Empty dialogue | `[char] ""` — empty string dialogue | WARNING |
| Placeholder text | Lines containing TODO, FIXME, XXX, [PLACEHOLDER] | WARNING |
| Consistency | Character name used inconsistently | INFO |
| Orphan narration | Long narration blocks (>5 lines) not in NVL mode | INFO |
| Translation keys | Hardcoded text outside of translation-safe patterns | INFO |

---

## Test Suite: Full Report

Run all test suites and produce a combined report:

```markdown
# VN Test Report — [date]

## Summary
| Suite | Pass | Warn | Fail | Score |
|-------|------|------|------|-------|
| Path Coverage | 45/47 | 2 | 0 | 96% |
| Flag Consistency | 20/24 | 3 | 1 | 83% |
| Asset References | 115/123 | 0 | 8 | 93% |
| Dialogue Lint | 342/350 | 6 | 2 | 98% |
| **Overall** | | | | **92%** |

## Critical Issues (must fix)
1. [issue]

## Warnings (should fix)
1. [issue]

## Info (nice to fix)
1. [issue]
```

Write report to `production/qa/vn-test-report-[date].md`

Suggest next:
- Fix critical issues first
- `/vn-asset-pipeline audit` for deeper asset analysis
- `/vn-script` to fix dialogue issues
