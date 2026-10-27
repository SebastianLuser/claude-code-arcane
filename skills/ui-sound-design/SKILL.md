---
name: ui-sound-design
description: "Interface sound and feedback: durations and levels per event type, feedback hierarchy, coordination with haptics, respecting the system volume, accessibility. Use for: UI sounds, menu feedback, notifications, app sound."
category: "audio"
argument-hint: "[set | event-name | review | haptics]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# ui-sound-design — Interface Feedback

Designs the sound that confirms actions. It is the audio the user hears most often, and the one that turns annoying fastest if it is badly calibrated.

## When to use

- Define the UI sound set of a game or an app
- The feedback feels annoying, intrusive or inconsistent
- Hierarchy is missing: everything sounds equally important
- Coordinate audio with haptics

## Input

1. Read the audio bible (palette, frequency allocation, mix hierarchy)
2. List the interface's real UI events
3. Ask the user: platform (desktop / console / mobile), whether there are haptics, and whether the game is played in long sessions

---

## Specifications by type

These ranges are the calibrated starting point. Leaving them requires a reason.

| Type | Duration | Character | Level |
|---|---|---|---|
| **Tap / hover** | 30-80 ms | Soft click, high frequency | −24 dB |
| **Confirmation** | 80-150 ms | Defined transient, neutral | −21 dB |
| **Success** | 150-300 ms | Rising tone, positive | −18 dB |
| **Error** | 200-400 ms | Falling, minor | −18 dB |
| **Notification** | 300-800 ms | Distinctive, attention-grabbing | −18 dB |
| **Transition / navigation** | 100-250 ms | Subtle movement | −24 dB |
| **Toggle** | 40-100 ms | Two distinguishable states | −24 dB |

**The level is what gets it wrong most often.** UI sounds sit between **−18 and −24 dB** relative to the gameplay material. A click at −3 dB competes with the game action and becomes exhausting within minutes.

Proportionality rule: **level and duration are proportional to the event's importance**. A hover is the shortest and the quietest. A transaction error is the longest and the loudest. If the hover and the error sound alike, there is no hierarchy.

## Frequency and fatigue

UI feedback lives at **2-6 kHz**: that is where the ear is most sensitive, so a quiet sound reads clearly without volume. It is also the band that **fatigues fastest**.

Design consequences:

- Short transients, not sustained tones: brief energy informs without tiring
- In a game with long sessions, moving the feedback lower (1-3 kHz) reduces fatigue at the cost of some clarity
- If the game has a lot of bright percussion or hi-hats, the UI competes: lowering the UI is not enough, it has to be given room in the arrangement (see `/audio-mix`)

## Hierarchy

Three levels, and every event falls into one:

| Level | What goes in | Can interrupt |
|---|---|---|
| **Ambient** | Hover, navigation, toggle | Nothing. It gets lost and that is fine |
| **Confirmatory** | Tap, confirmation, success | Nothing, but it must not get lost |
| **Critical** | Error, alert, timeout | Ducks everything else |

Only the critical level ducks. If all three duck, the music disappears every time the user navigates a menu.

## Haptics

When there are haptics, audio and vibration are **a single perceived event**. Rules:

- **Hard sync:** an offset greater than ~30 ms is perceived as two separate events
- **Do not duplicate information:** if the haptic already communicates intensity, the audio does not need to go up in level
- **Band complementarity:** the haptic covers what the small speaker cannot deliver (the sub). Design the audio without relying on the lows when there is a haptic
- **Respect the user's setting:** haptics turned off must not leave the event without feedback

## Platform

### Mobile — audio sessions

Ignoring the audio session is the most common mobile audio bug: the app loses its audio during a call and never gets it back.

| iOS `AVAudioSession` | Behavior |
|---|---|
| `.ambient` | Mixes with other audio; the silent switch mutes it |
| `.playback` | Interrupts other audio; ignores the silent switch |
| `.playAndRecord` | For apps with voice |
| `.soloAmbient` | Default; silences other audio |

On Android the equivalent is AudioFocus. In both cases you have to handle **interruptions** (call, alarm) and **route changes** (headphones connected/disconnected).

**A game that plays in the background or ignores the silent switch is a store rejection waiting to happen.** For a game, `.ambient` or `.soloAmbient` depending on whether you want to let the user listen to their own music.

### Respect the system volume

Never normalize above the system volume or force a minimum. If the user turned the volume down, they turned the volume down.

## Accessibility

- UI sound **can never be the only channel** for critical information: always paired with a visual signal
- Success and error must be distinguishable by **melodic contour** (rising vs falling), not only by timbre — it is what survives high-frequency hearing loss
- Offer a UI volume control separate from music and SFX
- Repetitive navigation sounds must be able to be turned off without losing the critical feedback

---

## Process

1. **List the real UI events** and assign each one to a hierarchy level
2. **Specify** duration, character and level per event, against the reference table
3. **Verify the hierarchy** — hover and critical must be unmistakable
4. **Define the haptics** if applicable, with sync and band split
5. **Define the session handling** on mobile
6. **Check accessibility** — melodic contour, redundant channel, separate controls
7. **Write** — ask "Shall I write the set to `<path>`?" before using Write

---

## Verdict

- **READY** — every event has a level, duration and hierarchy; accessibility is covered; on mobile the audio session is defined
- **CONCERNS** — the set exists but there is no differentiated hierarchy, or the level is above −18 dB, or interruption handling is missing
- **BLOCKED** — the list of UI events is not defined, or the audio bible direction is missing

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-mix` for the UI bus and the critical level's ducking
- `/audio-spec` to formalize cooldowns (fast navigation spams the event)
- `/audio-audit` to verify measured levels against the specified ones
