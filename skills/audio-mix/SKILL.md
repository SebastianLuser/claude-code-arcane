---
name: audio-mix
description: "Game mixing: bus hierarchy, ducking and sidechain, mix states/snapshots, frequency masking, headroom and loudness targets. Use for: bus structure, dialogue ducking, dynamic mix, fixing a muddy-sounding mix."
category: "audio"
argument-hint: "[buses | ducking | states | loudness | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# audio-mix — Dynamic Mixing

Designs the bus structure and the rules that decide **what is heard when everything plays at once**.

A game mix is not a static mix: it is a system of rules, because you cannot know in advance what will play simultaneously.

## When to use

- Define the project's bus architecture
- The mix sounds muddy, or the dialogue is not intelligible
- Dynamic control is missing: important moments do not stand out
- Meet platform loudness targets

## Input

1. Read the audio bible, section 4 (frequency allocation) and 5 (mix hierarchy)
2. List the project's audio categories
3. Ask the user: target platforms, whether there is dialogue, and whether there is any certification requirement

---

## Bus hierarchy

Base structure that works for almost any game:

```
Master
├── Music
├── SFX
│   ├── Player          (feedback for the player's action)
│   ├── World           (enemies, props, environment)
│   └── Ambience
├── Voice
│   ├── Dialogue        (narrative, critical)
│   └── Barks           (combat chatter)
└── UI
```

**Why this shape:**
- `Player` separate from `World` lets you protect the feedback for the player's action when there are 40 enemies
- `Dialogue` separate from `Barks` lets you duck for important dialogue without every bark lowering the music
- `UI` outside `SFX` because it has its own level (−18 to −24 dB) and its own user control
- `Ambience` separate because it is the first thing sacrificed when the mix fills up

**Each bus needs:** a base volume, whether a user control is exposed, and whether it sends to zone reverb.

## Ducking

Lowering one category when another plays. The real cases:

| Trigger | What it ducks | How much | Attack / Release |
|---|---|---|---|
| Dialogue | Music, Ambience | −6 to −9 dB | 50 ms / 400 ms |
| Critical UI | Music, SFX | −3 to −6 dB | 20 ms / 200 ms |
| Narrative moment | Everything but Voice | −12 dB | 200 ms / 800 ms |
| Barks | nothing, or −2 dB | minimal | fast |

**Release always longer than attack.** A short release produces audible pumping: the music rises and falls with every word. 300-500 ms of release for dialogue is what sounds natural.

**Ducking does not replace the arrangement.** If the music lives in 500 Hz-2 kHz and so does the dialogue, you have to duck so much that it is audible. The fix is leaving that range free in the arrangement (see `/music-composition`, production-aware orchestration). Ducking is the fine adjustment, not the structural fix.

**Sidechain vs per-event ducking:** per-event ducking (the middleware lowers the bus while the event is active) is more predictable and cheaper. True sidechain (detecting the signal) responds better to dialogue of variable length. For recorded VO, per-event ducking is enough.

## Frequency masking

Two sounds occupying the same band compete, and the louder one wins. Corrective EQ thins everything out; the fix is the audio bible's **band allocation**.

When it is already produced and has to be fixed:

| Problem | Mix fix |
|---|---|
| Dialogue buried by music | Dynamic EQ on Music: a dip at 1-3 kHz only while there is VO |
| Impacts without weight | High-pass on Music and Ambience below 80 Hz |
| Muddy mix | High-pass on everything that does not need lows; almost nothing needs anything below 60 Hz |
| Lost UI | Reduce the brightness of the percussion, do not raise the UI |
| Everything sounds small | Too many sources; the problem is voice count, not EQ |

## Mix states

Mix snapshots activated by context. The dynamic mix is what makes a game sound "well mixed" in situations nobody mixed by hand.

| State | What changes |
|---|---|
| Exploration | Base |
| Combat | Player and World up, Ambience down |
| Cutscene | Voice up, everything else down, no UI |
| Menu (pause) | Everything except UI and Music way down or muted |
| Low health | Filter on Music, tinnitus, the rest attenuated |
| Death | Cut or extreme filter |

**Interpolate between states**, never jump. 200-500 ms depending on how dramatic the change is. And define what happens if two states want to activate at once: explicit priority.

## Headroom and loudness

**Headroom:** leave margin on the master so simultaneous peaks do not clip. Mix so the worst case (explosion + music + dialogue) has room, not the average case.

**Loudness targets.** The industry reference for games is **ASWG-R001** (Sony), the only specification from a major platform:

| Context | Average loudness | Maximum true peak |
|---|---|---|
| Console / home | **−23 LUFS** (±2) | **−1 dBTP** |
| Portable / handheld | **−18 LUFS** | −1 dBTP |

The portable target is higher because people play in noisy environments and with small speakers.

Application notes:
- Measure the **full program in representative gameplay**, not an isolated asset
- Verify each platform's current targets before certification: the recommendations get revised (the ASWG average was also cited as −24 LKFS)
- The −1 dBTP true peak leaves margin for lossy encoding, which can produce peaks above the value measured in PCM

---

## Process

1. **Define the bus hierarchy** with its base volumes and user controls
2. **Define ducking rules** with attack/release and amount
3. **Define mix states** with their transitions and priorities
4. **Check masking** against the bible's frequency allocation
5. **Define loudness targets** per platform and how they will be measured
6. **Write** — ask "Should I write the mix design to `<path>`?" before using Write

### Verification

The mix is validated **by playing**, in the worst case: maximum enemy density, with dialogue, with combat music, on the smallest target device. If the dialogue is intelligible and the player's feedback reads there, the mix works.

---

## Verdict

- **COMPLIANT** — buses defined, ducking with release longer than attack, mix states interpolated with priority, and loudness measured within each platform's target
- **CONCERNS** — the structure exists but loudness was not measured in real gameplay, or ducking is covering an arrangement problem
- **NON-COMPLIANT** — loudness is outside the platform target, or there is clipping in the worst case

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-audit` to measure loudness, peaks and voice count in real gameplay
- `/middleware-integration` to implement buses, ducking and states
- `/ui-sound-design` for the UI bus level
- `/music-composition` if the masking has to be solved in the arrangement rather than in the mix
