---
name: adaptive-music
description: "Interactive music for games: vertical layering, horizontal re-sequencing, stingers, transition rules with sync points, and mapping gameplay states to music. Use for: adaptive music, dynamic music system, musical transitions, combat music."
category: "audio"
argument-hint: "[design|layers|transitions|stingers|map]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# adaptive-music — Interactive Music Systems

Designs the system that decides **which music plays when** and **how it moves from one state to another without the seam being heard**.

This skill designs the system. The musical material is written by `/music-composition`; the middleware implementation is done by `/middleware-integration`.

## When to use

- When the music has to respond to gameplay and playing a track is not enough
- When transitions between states (exploration → combat → victory) sound like cuts
- When the loop becomes fatiguing and you need structural variation, not another track
- Before the composer writes a note: the system constrains how the music is composed

## Modes

| Mode | What it does |
|---|---|
| `design` | The full system: dominant axis, layers/segments, matrix, stingers, parameters |
| `layers` | Only the vertical architecture: which layers, which role, which compositional constraint |
| `transitions` | Only the transition matrix with sync points and transition segments |
| `stingers` | Only the stingers: harmony, synchronization, cooldown |
| `map` | Only the gameplay state → music table, with triggers and hysteresis |

## Input

1. Read the audio bible, section 2 (emotional targets per game state) and 6 (music direction). If it does not exist, warn and offer `/audio-bible`
2. List the real gameplay states — from the code or the GDD, not invented
3. Ask the user: middleware target (Wwise / FMOD / native engine / undecided), memory budget for music, and whether there is composed material or it starts from scratch

---

## The two axes

Every adaptive music system is a combination of these two. Choosing which one dominates is the first decision.

### Vertical — layering

The same time block, with layers that come in and out. They all play in sync because they share a grid and harmony.

- **Strong at:** immediate response to continuous parameters (enemy proximity, health, combat intensity)
- **Weak at:** changing material. Everything sounds like the same piece
- **Cost:** memory (N simultaneous stems) and a real compositional constraint — each layer must work alone and in every combination

### Horizontal — re-sequencing

Different segments concatenated according to rules, with transitions at musically valid points.

- **Strong at:** changing material and form; non-repetitive structure
- **Weak at:** immediate response. The transition waits for the sync point
- **Cost:** response latency (up to a bar or more) and rule complexity

**Recommendation:** vertical for continuous intensity, horizontal for discrete state changes. Most games need both: layers inside each segment, re-sequencing between segments.

---

## Sync points — where you can cut

A transition sounds good or bad depending on **where** it happens, not on the crossfade. From most responsive to most musical:

| Sync point | Latency | When to use it |
|---|---|---|
| **Immediate** | 0 | Emergencies (player death). It sounds like a cut, and sometimes that is fine |
| **Next beat** | up to 1 beat | Fast reaction that still respects the pulse |
| **Next bar** | up to 1 bar | The sane default for most cases |
| **Next grid** | variable | When you define a coarser grid (2 or 4 bars) |
| **Exit cue** | up to the end of the segment | Maximum musicality, maximum latency |
| **Destination entry cue** | — | Defines where the destination segment starts from |

**Transition segment** — a short fragment inserted between source and destination. It resolves the jumps no sync point can save: a change of key, tempo or meter. It is the tool that improves a system the most and the one used the least.

In Wwise this is the Transition Matrix of the Music Switch Container: source × destination, with the source's Exit Cue, the destination's Entry Cue, fade in/out, and an optional transition segment. In FMOD the equivalent is transition regions and transition timelines. The concept is the same; the naming changes.

---

## Stingers

Short phrases layered over the background music without interrupting it, synced to the grid so they do not land on the wrong beat.

- Use: one-off events that deserve musical punctuation — discovery, kill, rare item, failure
- **They must share harmony with the background material**, or sound deliberately dissonant. A stinger in the wrong key is the most audible error in the system
- Sync to beat or bar, never immediate
- Define a cooldown: two overlapping stingers sound like a bug
- If the background modulates, the stinger needs per-key versions or has to be tonally neutral (percussion, cluster, noise)

---

## Mapping design

The central deliverable: the state → music table.

| Gameplay state | Trigger | Segment / layers | Sync point | Notes |
|---|---|---|---|---|
| Explore calm | default | bed + pulse | bar | indefinite loop |
| Explore alert | enemy at <30 m | + harmony | beat | returns to calm with 5 s of hysteresis |
| Combat | combat started | combat segment, all layers | bar | |
| Combat low health | HP < 25% | + intensity, filter | beat | |
| Victory | combat resolved | stinger + victory segment | exit cue | one-shot, returns to explore |
| Death | HP = 0 | immediate, cut | immediate | |

**Continuous parameters** separately: which RTPC/parameter drives what, with normalized range and curve.

| Parameter | Range | Controls | Curve |
|---|---|---|---|
| `combat_intensity` | 0-1 | intensity layer volume | log |
| `player_health` | 0-1 | low-pass filter on the music bus | linear |

---

## Hysteresis — the detail that breaks systems

A state computed from a threshold (`enemy at <30 m`) will oscillate when the player walks along the edge. The result is music coming in and out every second.

Every threshold-based transition needs:
- **Different thresholds per direction** — enters at 30 m, exits at 40 m
- **Minimum time in state** — it cannot exit before N seconds
- **Trigger debounce** — the condition has to hold before it counts

Without this, the system works in the editor and fails with a real player.

---

## Generative approaches

When variation through layers and segments is not enough:

- **Stochastic selection of layers/segments** — variation comes from which combination plays. The cheapest and most controllable; always start here
- **Markov chains** — stochastic melody trained on your own material. Preserves idiom, does not generate structure
- **L-systems / recursive grammars** — generate hierarchical structure by rule rewriting. A complement to Markov, which has no form
- **Harmonic constraints** — a validation layer over what is generated: the generator proposes, function and voice-leading rules filter

Real-time note generation has a quality ceiling and a risk of sounding bad in production that selecting pre-recorded material does not have. Justify it before going that way.

---

## Process

1. **List the real gameplay states**, with their exact triggers
2. **Choose the dominant axis** (vertical / horizontal / mixed) and justify it against the budget
3. **Define layers or segments** and the compositional constraint they impose on the composer
4. **Fill in the transition matrix** with sync points, and mark where a transition segment is needed
5. **Define stingers** with their harmony and cooldown
6. **Define continuous parameters** with range and curve
7. **Add hysteresis** to every threshold transition
8. **Present** it to the user and ask "Should I write the design to `<path>`?" before using Write

---

## Verdict

- **READY** — the matrix is complete, every threshold has hysteresis, the stingers have defined harmony, and the composer knows which constraint to respect
- **CONCERNS** — the design exists but there are transitions without a sync point, thresholds without hysteresis, or the memory budget was not checked against the number of stems
- **BLOCKED** — the gameplay states are not defined, or there is no music direction to derive the emotional targets from

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/music-composition` to write the material respecting the layer constraints
- `/middleware-integration` to implement the matrix in Wwise/FMOD
- `/audio-mix` for ducking between music and dialogue
- `/audio-audit` to verify the system's memory and voice count at runtime
