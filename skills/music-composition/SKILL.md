---
name: music-composition
description: "Music composition: harmony, melody, form, groove, orchestration. Turns vague creative problems into concrete compositional moves with chord symbols, scale degrees and voicings. Use for: progressions, melodies, modulation, arrangement, musical analysis. Does NOT generate audio or MIDI or operate a DAW."
category: "audio"
argument-hint: "[harmony|melody|form|groove|orchestration|analyze]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# music-composition — Musical Decisions

Solves composition problems with actionable output: concrete chord symbols, melodies in scale degrees, groove sketches, specific voicings.

**Theory is a map of possible effects, not a list of commandments.** Each technique comes with *what effect it produces* and *why*, so the choice is informed rather than obedient.

## Scope

**Yes:** harmony, melody, counterpoint, rhythm/groove, form, orchestration, instrumental idiom, analysis, songwriting.

**No:** generating MIDI files (→ `/midi-compose`), generating audio, operating a DAW, mixing/mastering (→ `/audio-mix`), sound design (→ `/sfx-design`), notation in Sibelius/Dorico.

## When to use

- Technical problems: "which scale goes over Cm7", "how do I modulate from C to Eb"
- Craft problems: "this melody doesn't stick", "the chorus feels weak"
- Vague problems: "the transition is awkward", "it sounds generic" — translating them into compositional moves is exactly this skill's job
- Game music: themes, variations, material that later becomes adaptive

---

## Method

### 1. Translate the problem

The user almost never arrives with technical vocabulary. Before proposing anything, turn the complaint into a diagnosis:

| Complaint | Likely diagnosis | Where to look |
|---|---|---|
| "The chorus feels weak" | No contrast in register/density/harmonic rhythm with the verse | `references/form.md` |
| "It sounds generic" | Predictable progression and harmonic rhythm, melody without a profile | `references/harmony.md`, `references/melody.md` |
| "It doesn't stick" | A repeatable gesture is missing: short motif, identifiable leap, asymmetric rhythm | `references/melody.md` |
| "The transition is awkward" | Key/texture jump without preparation or a pivot | `references/harmony.md` |
| "It gets tiring fast" | Loop without material variation or density change | `references/game-music.md` |
| "It feels muddy" | Voicings stacked in the same register, unnecessary doublings | `references/orchestration.md` |

### 2. Offer options with a trade-off

Never a single answer. Two or three moves, each with the effect it produces and its cost:

> To lift the chorus you have three levers:
> - **Raise the harmonic rhythm** (one chord per bar → two): more urgency, but it loses room for the melody
> - **Open the register** (melody a 6th higher): more brightness and perceived vocal effort, but it burns the resource if you already used it
> - **Move the bass to inversions** (I → I/3 → IV): more motion without touching the melody, subtle effect

### 3. Be concrete

Useful output, not descriptive:

- **Harmony:** real chord symbols — `| Cmaj7 | Am7 | Dm7 | G7sus4 G7 |`, not "a melancholic minor progression"
- **Melody:** scale degrees with rhythm — `5 - 3 - 2 - 1` (half, quarter, quarter, whole), portable to any key
- **Groove:** sketch on a subdivision grid, with where the accent falls and where it is pushed
- **Voicing:** exact notes per register — `bass: C2 / piano: E3-G3-B3-D4 / strings: G4-C5`

### 4. Validate

Before closing: does the proposal solve the original problem or dodge it? Is it playable by the target instrument/voice? Does it respect the genre's conventions without being enslaved to them?

---

## References

Load only the one that applies to the problem:

| Area | File |
|---|---|
| Functional, modal and chromatic harmony, modulation, voice leading, reharmonization | `references/harmony.md` |
| Melodic construction, motivic development, phrase structure | `references/melody.md` |
| Popular and classical forms, transitions, formal narrative | `references/form.md` |
| Groove, feel, odd meters, polyrhythm, rhythmic devices | `references/rhythm-groove.md` |
| Instrument ranges and character, arrangement density, voicing and texture | `references/orchestration.md` |
| Game music: loops, variation, themes and transformation, scales and modes by mood | `references/game-music.md` |

---

## Principles

- Explain **why** a technique produces its effect, not just that it exists
- Respect genre conventions without being enslaved to them — name the convention and the option of breaking it
- Silence and density reduction are compositional moves, not a lack of material
- If the user describes the goal in non-technical terms, translate first and confirm the diagnosis before proposing
- When writing material to a file, ask "Should I write this to `<path>`?" before using Write

---

## Verdict

When closing a consultation:

- **COMPLETE** — the problem is diagnosed and there are at least two concrete moves with an explicit trade-off
- **CONCERNS** — there is a proposal but the diagnosis was not confirmed with the user, or the output stayed descriptive instead of concrete
- **BLOCKED** — information that cannot be inferred is missing: key, target instrumentation, genre, or the existing material

## Next steps

- `/midi-compose` to turn the material into a real `.mid`
- `/adaptive-music` to turn a theme into a system that responds to gameplay
- `/audio-bible` if the musical decisions have no direction to hang from
