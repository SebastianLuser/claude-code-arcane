---
name: sfx-design
description: "Sound effect design: attack/body/tail layers, variation and round-robin, pitch randomization, impact layering, anti-repetition. Use for: designing SFX, impact sounds, weapons, action feedback."
category: "audio"
argument-hint: "[sound-name | layers | variation | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# sfx-design — Effects Design

Designs *how an effect sounds*: which layers it is built from, how it varies, and why it reads as the event it represents.

`/audio-spec` writes the contract (what triggers it, with which limits). This skill designs the sound.

## When to use

- Hero sounds that deserve individual design: the main weapon, the critical hit, the ultimate skill
- When an effect "doesn't feel right" and you have to diagnose why
- When the library sounds repetitive and variation has to be solved
- Before recording or buying assets, to know what to look for

## Modes

| Mode | What it does |
|---|---|
| `sound-name` | Designs a specific effect end to end |
| `layers` | Only the layer anatomy: which band each layer occupies |
| `variation` | Only the variation plan: variants, round-robin, randomization, layer swapping |
| `review` | Diagnoses an existing effect against the symptoms table |

## Input

1. Read the audio bible (palette, frequency allocation) and the sound's spec if it exists
2. Ask the user: which event it represents, what the player should feel, and whether there is a sound reference
3. Identify the constraint: does this sound play once per match or a hundred times per minute? That changes everything

---

## Anatomy of an effect

Every effect reads in three parts. Designing them separately is the difference between a sound that works and one that is "missing something":

| Layer | Typical duration | What it communicates | Perceived as |
|---|---|---|---|
| **Attack** | 1-20 ms | Which material, how much force | Impact, precision, "punch" |
| **Body** | 20-200 ms | What size, what object | Weight, scale |
| **Tail** | 50 ms-2 s | Where it is, what space | Ambience, distance, power |

**Diagnosis by symptom:**

| Symptom | Culprit layer | Fix |
|---|---|---|
| "It feels weak" | Attack without a transient | Add a short, bright click/crack layer |
| "It has no weight" | Body without lows | Add sub or body at 60-150 Hz |
| "It sounds like a library sample" | Generic or missing tail | A tail of its own, or reverb from the game's real space |
| "It is confusing, it doesn't read" | Too many layers fighting | Remove layers until it reads; 3 is almost always enough |
| "It feels slow" | Long attack | Trim the pre-attack; the transient has to be in the first ms |
| "It gets annoying after a while" | Energy at 2-6 kHz | Lower it; that band fatigues fast |

## Layering

Build by function, not by accumulation. A typical powerful impact:

1. **Sub** (40-80 Hz) — physical weight. Short, 60-120 ms. It will not be heard on a handheld: it cannot be the only source of force
2. **Punch** (100-300 Hz) — the body that is perceived on any speaker
3. **Crack** (2-5 kHz) — definition and material
4. **Tail** — the space

**Rule:** each layer occupies a different band. If two layers fight over the same band, one is surplus. It is the same frequency allocation principle as the audio bible, applied inside a single sound.

Four layers is the practical ceiling. Beyond that the sound loses legibility and you only gain file weight.

## Variation and anti-repetition

A sound without variation becomes audible **as a sound** instead of as an event. For frequent events that happens around 20 minutes into play.

The tools, from most to least effective:

| Technique | How | Note |
|---|---|---|
| **Real variants** | 4-8 different recordings/renders | The only one that truly varies the timbre |
| **Round-robin** | Cycle through variants in order, never repeating the last one | Beats pure random: random repeats |
| **Pitch randomization** | ±2% to ±4% | ±3% is variation; ±20% changes the object |
| **Volume randomization** | ±1 to ±2 dB | Subtle, always helps |
| **Layer swapping** | Fix the body, rotate attack and tail | Combinatorial: 3 attacks × 3 tails = 9 sounds from 6 assets |
| **Random filter** | Cutoff ±10% | Last resort, barely noticeable |

**Layer swapping has the best result/cost ratio** and is the least used. With 4 attacks, 2 bodies and 3 tails you get 24 combinations from 9 files.

If the event is very high frequency with many dimensions (footsteps over 6 surfaces × 3 intensities), the answer is not more variants: it is `/procedural-audio`.

## Stylization vs realism

The realistic sound is almost never the right sound. A real gunshot is a short, unimpressive crack; a real door sounds like nothing.

Criterion: the effect has to communicate **its function in gameplay**, not the physics. If one weapon does 40 damage and the other 90, they have to sound different in weight even if they are the same caliber. Legibility beats realism whenever they compete.

---

## Process

1. **Define the read** — in one sentence, what the player has to understand when hearing it
2. **Design the layers** by function, with a band assigned to each one
3. **Define the variation** — how many variants, what randomization, round-robin or not
4. **Check against the bible** — does it respect the palette and the frequency allocation?
5. **Check in context** — a sound is never judged alone: with music, ambience and 10 other SFX on top
6. **Write** — ask "Shall I write the design to `<path>`?" before using Write

### Check in context

The most expensive sound design mistake is approving sounds in isolation. An effect that is perfect on its own can disappear in the mix or mask another sound's attack. Always evaluate with everything else playing, and at real game volume.

---

## Verdict

- **READY** — the sound has a defined read, layers per band, a variation plan, and was validated in context
- **CONCERNS** — it is designed but was not tested with the rest of the mix, or the variation is not enough for its frequency of use
- **BLOCKED** — it is not clear which event it represents, or the audio bible direction is missing

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-spec` to formalize the event contract (concurrency, cooldown, priority)
- `/procedural-audio` if the variant count becomes unmanageable
- `/audio-mix` to place it in the bus hierarchy
- `/middleware-integration` to implement the round-robin and randomization in containers
