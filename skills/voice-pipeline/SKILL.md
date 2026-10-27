---
name: voice-pipeline
description: "Voice pipeline: VO script, casting, recording sessions, naming and batch processing, localization, lipsync and barks. Use for: recorded dialogue, voice over, dubbing, voice localization, VO asset management."
category: "audio"
argument-hint: "[script | casting | naming | loc | barks]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# voice-pipeline — Voice and Localization

Manages the full recorded-voice cycle: from the script to the integrated, localized asset.

Voice is the audio area where mistakes are **most expensive**: redoing a recording session costs money and actors' schedules, and a naming mistake multiplied by 12 languages is unmanageable by hand.

## When to use

- Preparing a VO script for recording
- Defining naming and structure before receiving assets
- Planning localization into several languages
- Managing barks (combat chatter) and their variation
- The VO pipeline got messy and needs reorganizing

## Input

1. Read the audio bible (voice direction if it exists) and the narrative script
2. Determine: how many languages, how many characters, whether there is lipsync
3. Ask the user: recording budget, whether actors are already hired, and the target platform

---

## Naming — the most important decision

**Naming is defined before recording a single line.** Renaming 4,000 files × 12 languages afterwards is not a task, it is a project.

Recommended pattern:

```
vo_<character>_<context>_<id>_<variant>
vo_kira_combat_taunt_003_a
vo_kira_story_ch02_017
```

**Pattern requirements:**
- **Stable, unique ID** — never reused, not even if the line is cut. Gaps are free; renumbering is not
- **No spaces or accents** — survives any filesystem and batch scripts
- **The language does NOT go in the file name** — it goes in the path or in the language bank. That way the same name resolves in any locale
- **Alphabetically sortable** in the order it is used
- **Bounded length** — some platforms have path limits

The ID is the key that ties together script, recording session, asset, subtitle and translation. If it changes anywhere, the link breaks.

## VO script

What the actor and the director need per line:

| Field | Why |
|---|---|
| **ID** | The key for the whole pipeline |
| **Character** | |
| **Text** | Exact, it is what gets recorded and subtitled |
| **Context** | What happened before; without it the performance is blind |
| **Direction** | Emotion, intensity, who they are talking to |
| **Duration constraint** | Whether it has to fit an animation or a gameplay gap |
| **Takes requested** | How many intent variants |

**Context is what gets omitted most and what ruins sessions most.** An actor recording loose lines in alphabetical order, without knowing who they are talking to or what just happened, delivers unusable material and has to be called back.

**Recording order:** by character and by scene, not by ID. Also group by emotional intensity — leave the screams for the end of the session, because they wear the voice out and ruin whatever comes after.

## Casting

- **Range, not just timbre** — the character who screams in act three needs an actor who can scream without losing their voice
- **Distinguishability** — two characters who sound alike are confusing in a game where the player does not always see who is speaking. Test: listen without watching
- **Availability for pickups** — there are always pickups. An actor who cannot be called back is a production risk
- **Consistency across languages** — localization casting should keep the *timbral role*, not imitate the original actor

## Barks

Combat chatter has its own rules because it is heard a lot:

- **Many variants per intent** — at least 5-8 per type. A repeated bark is the first thing the player notices
- **Short** — 0.5 to 2 s. A long bark gets stepped on by gameplay
- **Global cooldown per character and per type** — two enemies shouting the same thing at once sounds like a bug
- **Low priority** — a bark must never cover narrative dialogue or player feedback
- **A bus separate** from `Dialogue` so they do not duck the music (see `/audio-mix`)
- **Interruptible** — if the character dies mid-bark, it gets cut

## Localization

| Decision | Recommendation |
|---|---|
| Structure | One bank or folder per language, same file names inside |
| Runtime language | Resolved by loading the locale's bank, with no logic in gameplay |
| Fallback | The base language if the asset is missing — never silence |
| Text expansion | German and Spanish grow 20-35% over English: the timing gaps have to tolerate it |
| Subtitles | Same ID as the audio. An ID without a subtitle is an accessibility bug |
| Not dubbed | Subtitle-only languages: define explicitly which ones and make sure the mix accounts for it |

**Text expansion is the most common practical problem.** A line that fits exactly in English runs 30% over in German, and if there is a fixed animation or a gameplay gap, it does not fit. Budget the gap against the longest language in the target, not against English.

## Batch processing

VO arrives raw and needs the same treatment across thousands of files. What must be automated, not manual:

1. **Silence trimming** with a consistent threshold
2. **Loudness normalization** to a common target
3. **De-noise / de-click** if the source calls for it
4. Short in and out **fades**
5. **Verification**: sample rate, bit depth, channels, duration vs constraint
6. **Report** of the ones that fail

Steps 5 and 6 are the ones to insist on: without automatic verification, non-conforming assets are discovered at integration.

## Lipsync

- **Phoneme-based** (extracted from the audio or the text) or **amplitude-based** (cheaper, much worse)
- If there is lipsync, the **text has to match exactly** what was recorded — an actor's improvisation breaks the sync
- Localization needs lipsync regenerated per language, or explicitly accepting the mismatch
- Pickups have to regenerate the lipsync of the affected line

---

## Process

1. **Define the naming** and freeze it. This step first, no exceptions
2. **Build the script** with context and direction per line
3. **Plan the sessions** by character/scene, with the screams at the end
4. **Define the localization structure** and the fallback
5. **Define the batch pipeline** with its verification step
6. **Define barks** with variants, cooldown and bus
7. **Write** — ask "Shall I write the pipeline to `<path>`?" before using Write

---

## Verdict

- **READY** — naming frozen, script with context and direction, localization structure with fallback, batch pipeline with automatic verification
- **CONCERNS** — the pipeline exists but the script has no per-line context, or text expansion was not budgeted, or barks have no cooldown
- **BLOCKED** — naming is not defined: any recording before that produces work that will have to be redone

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-mix` for the dialogue bus and ducking
- `/audio-spec` for the barks event contract (concurrency and cooldown)
- `/audio-audit` to verify delivered assets against the spec
- `/middleware-integration` for the language banks
