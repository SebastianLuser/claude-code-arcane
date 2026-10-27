---
name: audio-spec
description: "SFX spec sheets and audio event lists: trigger, priority, concurrency, cooldown, variations, spatial properties. Use to: specify sounds, build an event list per system, write a brief for a sound designer."
category: "audio"
argument-hint: "[system-name | all | events]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# audio-spec — SFX Specs & Event Lists

Turns sound direction into specifications an external sound designer can produce without further briefing, and into event lists a programmer can implement without guessing.

Two distinct, complementary deliverables:
- **Spec sheet** — describes *the sound*: what it sounds like, how long it lasts, how many variants
- **Event list** — describes *the contract*: what triggers it, at what priority, how many instances, which parameters it takes

## When to use

- After `/audio-bible` (the direction has to exist first)
- When you are going to outsource SFX production and need a closed brief
- When the code needs to know which events to post before the assets exist
- Before `/middleware-integration` — the event list is its input

## Modes

| Mode | What it does |
|---|---|
| `system-name` | Specifies one concrete system: spec sheets + event list for, say, `combat` |
| `all` | Sweeps every system in the project, one at a time |
| `events` | Event list only, no spec sheets. For when the code needs the contract before the assets exist |

## Input

1. Read the audio bible (palette, frequency allocation, mix hierarchy, standards). If it doesn't exist, say so and offer `/audio-bible` first
2. Identify the system to specify (combat, locomotion, UI, ambience, props...) or `all`
3. Read the system's code/GDD to extract the moments that call for sound
4. Ask the user: level of detail (full spec vs event list only) and whether there are existing assets to reuse

---

## Spec sheet — required fields

Every sound carries these fields. An empty field is a decision someone else will make for you:

| Field | What it defines | Example |
|---|---|---|
| **ID** | Canonical name, matches the bible's naming | `sfx_weapon_shotgun_fire` |
| **Description** | What it is, in one functional line | Double-barrel shotgun shot, dry, no reverb tail |
| **References** | 1-3 concrete sounds and what to take from each | — |
| **Frequency character** | Where it lives, against the bible's allocation | Sub-punch 50-70 Hz + crack 3-5 kHz, empty mids |
| **Duration** | A range, not a single value | 180-260 ms |
| **Envelope** | Explicit attack / body / tail | Attack <5 ms, body 60 ms, tail 120 ms |
| **Volume range** | Level relative to the category | −6 dB to −3 dB of the SFX bus |
| **Spatial properties** | 2D/3D, attenuation curve, min/max distance | 3D, 2-40 m, log |
| **Variations** | How many variants and what randomization | 5 variants, pitch ±3%, volume ±1.5 dB |
| **Priority** | What drops first under voice pressure | High (player action feedback) |

## Event list — required fields

| Field | What it defines |
|---|---|
| **Event** | Name the code posts |
| **Trigger** | Exact gameplay condition that fires it |
| **Sounds** | Which spec IDs it resolves (one or a container) |
| **Concurrency** | Max simultaneous instances + what to do when exceeded (drop oldest / drop newest / reject) |
| **Cooldown** | Minimum time between triggers, for events that can be spammed |
| **Parameters** | RTPCs it takes, with normalized range |
| **Stop condition** | How it ends: one-shot, loop with explicit stop, or fade |

**Concurrency and cooldown are not optional.** They are the difference between a system that survives 40 enemies on screen and one that saturates the voice budget. Every event that can fire more than once per frame needs both.

---

## Process

1. **Sweep the system** — list every moment that calls for sound, including the negatives (where silence is the decision)
2. **Group** — sounds that share a character go together; identify what can be a variation of the same asset instead of a new asset
3. **Draft** the group's specs and event list
4. **Present** them to the user for review
5. **Write** — ask "Should I write the `<system>` spec to `<path>`?" before using Write

Don't batch systems: close one before opening the next.

### Asset reduction

Before specifying N new sounds, ask whether the case is solved with variation or with synthesis. The canonical case: 20 samples × 6 surfaces × 3 intensities = 360 files (~180 MB) vs procedural footsteps (~50 KB) with infinite variation. If the system is high-frequency and has many dimensions, hand off to `/procedural-audio` before writing the spec.

---

## Verdict

Per specified system:

- **READY** — every sound has the 10 fields, every event has concurrency and cooldown. An external party can produce and a programmer can implement
- **CONCERNS** — there are empty fields or events without limits; list which
- **BLOCKED** — the audio bible is missing, or the gameplay system isn't defined enough to know which moments exist

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/middleware-integration` to implement the event list in Wwise/FMOD
- `/procedural-audio` for high-frequency systems that are not worth sampling
- `/sfx-design` to go deeper on the design of the hero sounds
- `/audio-audit` to check delivered assets against the spec
