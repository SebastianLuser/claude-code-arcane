---
name: spatial-audio
description: "Spatial audio: HRTF/binaural, Ambisonics, panning, attenuation curves, occlusion and obstruction, per-zone reverb, and CPU budget per technique. Use for: 3D sound, positional audio, VR audio, occlusion, deciding HRTF vs panning."
category: "audio"
argument-hint: "[decide | hrtf | ambisonics | occlusion | budget]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# spatial-audio — Positional Audio

Decides which spatialization technique to use per source, and budgets the cost. The right decision is almost never "the best technique for everything".

## When to use

- Define the spatialization strategy for a game or VR experience
- 3D audio eats too much CPU
- Sources are not localized well, or sound "inside the head"
- Implement occlusion and obstruction
- Design per-zone reverb

## Input

1. Read the audio bible and the project's performance budget
2. Determine: are headphones guaranteed (VR), or does it have to work on speakers?
3. Count the expected simultaneous sources per category
4. Ask the user: lowest target platform and target fps

---

## Budget — the number that decides everything

| Technique | Cost |
|---|---|
| HRTF convolution (512 taps) | **~2 ms per source** |
| Ambisonic encode | ~0.1 ms per source |
| Ambisonic decode to binaural | ~1 ms total (once, not per source) |
| Stereo / vector-based panning | negligible |
| Distance attenuation + filter | negligible |

**All of audio gets 5-10% of the frame time.** At 60 fps the frame is 16.6 ms, so audio has ~0.8-1.7 ms.

That number kills the idea of universal HRTF from the start: **50 sources × 2 ms = 100 ms of CPU**, six times the whole frame. It is not "expensive": it is impossible.

Realistic budget: **3-5 sources with HRTF**, the rest through other techniques.

---

## Decision per source

| Situation | Technique | Why |
|---|---|---|
| 3-5 critical sources, with headphones | **HRTF** | Precise localization, including elevation |
| Ambience, diffuse field | **Ambisonics** | Near-zero per-source cost; a single decode |
| Distant or unimportant sources | **Panning + attenuation** | Free, and they are indistinguishable anyway |
| Music, UI | **2D, not spatialized** | They have no position in the world |
| Player dialogue / narrator | **2D or pseudo-3D** | It must always be intelligible |
| Sources on speakers (not headphones) | **Panning / surround** | HRTF on speakers does not work: it assumes ears, not a room |

**HRTF assumes headphones.** On speakers the crosstalk between channels destroys the binaural cues and the result is worse than honest panning. If the platform does not guarantee headphones, HRTF needs output-route detection or it is ruled out.

**Recommended strategy:** an explicit budget of "HRTF slots" assigned by dynamic priority — the most important and closest source takes the slot, and gives it back as it moves away. Everything else, Ambisonics and panning.

---

## Attenuation curves

Attenuation is what contributes most to the perception of distance, and it is free. Components:

| Component | What it communicates |
|---|---|
| **Volume by distance** | Base distance |
| **Increasing low-pass filter** | Air absorbs highs: distant = duller |
| **Spread reduction** | Close is wide, far is a point |
| **Reverb increase (wet/dry)** | Distant = more proportion of space |

**All four together** sell distance much better than volume alone. A sound that only drops in volume is perceived as "quieter", not as "farther away".

Always define `min distance` (within which it does not attenuate) and `max distance` (beyond which it does not play), and the shape of the curve. Log is the most natural for most sources; linear works when you want precise control of the audible range.

## Occlusion and obstruction

Two different phenomena that often get confused:

| | What it is | Effect |
|---|---|---|
| **Obstruction** | Something blocks the direct path, but reflected sound arrives | Lowers the direct sound, keeps the reverb. It is heard "around" |
| **Occlusion** | Direct and reflected both blocked: a solid wall | Lowers both + strong low-pass |

Confusing them produces the classic bug: an enemy behind a column becomes inaudible (occlusion was applied where obstruction belonged).

**Cost:** the expensive part is not the filter, it is the raycast. With many sources you have to:
- Limit raycasts per frame and spread them across frames
- Cache the result and update it less often than every frame
- Interpolate the occlusion value toward the target, never apply it at once (the jump is audible)

## Per-zone reverb

- Define zones with one reverb preset each, and **crossfade at the transitions** — an instant reverb change is very audible
- The reverb send depends on distance (see the curves above)
- 2D sources (music, UI) normally do **not** go to zone reverb
- The reverb tail has to keep playing when changing zones, or it cuts off unnaturally

## VR and specific considerations

- **Head tracking is mandatory:** source positions update with the head. High latency breaks the illusion and causes motion sickness
- **Elevation matters:** it is what HRTF provides and panning cannot
- **Guaranteed headphones:** the only context where HRTF is the obvious choice
- **Tighter budget:** 90 fps leaves ~11 ms per frame, so audio has even less margin

---

## Process

1. **Count** simultaneous sources per category
2. **Budget** against 5-10% of the frame on the lowest platform
3. **Assign a technique per category**, with explicit HRTF slots and dynamic priority
4. **Define** attenuation curves with the four components
5. **Define occlusion vs obstruction** per geometry type, with a raycast budget and interpolation
6. **Define** reverb zones and their transitions
7. **Write** — ask "Should I write the strategy to `<path>`?" before using Write

---

## Verdict

- **READY** — every category has an assigned technique, the budget fits on the lowest platform, and occlusion/obstruction are differentiated
- **CONCERNS** — the strategy exists but the budget was not measured, or HRTF is assumed without verifying there are headphones
- **BLOCKED** — the count of simultaneous sources or the project's performance budget is missing

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-audit` to measure real CPU and voice count at runtime
- `/middleware-integration` to implement attenuations, occlusion and reverb buses
- `/procedural-audio` if there are many ambient sources and generating them pays off
- `/audio-mix` for bus allocation and dialogue ducking
