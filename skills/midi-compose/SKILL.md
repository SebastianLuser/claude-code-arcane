---
name: midi-compose
description: "Generates MIDI files (.mid) from a JSON spec with stdlib-only Python scripts. No dependencies: writes the binary Standard MIDI File directly. Use for: exporting a composition to MIDI, sketching stems, generating loops or layers for middleware."
category: "audio"
argument-hint: "[spec-path | new | validate]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---
# midi-compose — Composition to MIDI

Turns musical decisions into a real `.mid`. `/music-composition` makes the decisions; this skill writes them.

**No dependencies.** The Standard MIDI File is a documented binary format and `scripts/compose_midi.py` emits it with the Python stdlib. There is no need to install `midiutil`, `music21` or anything else. It runs on the user's machine exactly as copied.

## Scope

**Yes:** write multitrack `.mid` files with tempo, time signature, key, General MIDI programs, velocities and percussion.

**No:** rendering to audio (requires FluidSynth + soundfonts, system dependencies out of scope), making musical decisions (→ `/music-composition`), notation.

## When to use

- The material is already decided (progression, melody, groove) and the file is needed
- Sketch stems for a `/adaptive-music` layering system
- Generate variants of a theme by transformation (augmentation, mode change)
- Hand MIDI to a composer or import it into a DAW/middleware

---

## Modes

| Mode | What it does |
|---|---|
| `spec-path` | Generates the `.mid` from an existing JSON spec |
| `new` | Builds the spec from scratch from musical material, then generates |
| `validate` | Only validates the spec and reports, without writing anything |

## Workflow

### 1. Build the spec

A JSON object. All times are in **beats** (quarter notes), not ticks — the script converts.

```json
{
  "name": "Explore Calm",
  "tempo": 84,
  "ppq": 480,
  "time_signature": [4, 4],
  "key": "D",
  "mode": "minor",
  "tracks": [
    {
      "name": "Bed (strings)",
      "channel": 0,
      "program": 48,
      "notes": [
        { "pitch": "D3", "start": 0, "duration": 4, "velocity": 62 }
      ]
    }
  ]
}
```

There is a complete three-track example in `templates/example-composition.json`.

**Spec fields**

| Field | Default | Notes |
|---|---|---|
| `name` | `"untitled"` | Goes to the sequence name meta event |
| `tempo` | `120` | BPM, 1-600 |
| `ppq` | `480` | Ticks per quarter note, 24-32767 |
| `time_signature` | `[4, 4]` | Denominator is a power of 2 |
| `key` / `mode` | `"C"` / `"major"` | Only for the key signature meta event; does not transpose |
| `tracks[].channel` | track index | 0-15, unique per track |
| `tracks[].program` | `0` | General MIDI program 0-127 |
| `tracks[].drums` | `false` | Declare it on the channel 9 track |
| `notes[].pitch` | — | `60`, `"C4"`, `"F#3"`, `"Bb5"`. C4 = 60 |
| `notes[].start` | `0` | In beats from the start |
| `notes[].duration` | `1` | In beats, > 0 |
| `notes[].velocity` | `90` | 1-127 |

### 2. Validate before writing

```bash
python skills/midi-compose/scripts/compose_midi.py spec.json --validate
```

Outputs `[PASS]` with the summary, plus a `[WARN]` for each non-fatal problem. A `[FAIL]` names the exact track and note.

### 3. Generate

```bash
python skills/midi-compose/scripts/compose_midi.py spec.json -o output.mid
```

Before writing the `.mid` or the spec to disk, ask the user "Should I write this to `<path>`?" — especially if the file already exists.

---

## MIDI limits that matter

- **16 channels.** Channel 9 (10 in 1-based numbering) is reserved for percussion by General MIDI, which leaves **15 melodic tracks**. If you need more, use several files.
- **One program per channel at a time.** Changing instrument mid-track needs another channel.
- **Velocity is not volume.** It is attack intensity; the sampler decides what to do with it.
- **MIDI carries no timbre.** The GM program is a suggestion; how it sounds depends on the soundfont or the DAW instrument.
- **`pitch` on the percussion channel is the instrument**, not a pitch: 36 = kick, 38 = snare, 42 = closed hi-hat, 46 = open hi-hat.

## Feel and microtiming

The spec accepts fractional `start`, so feel is written directly: to delay a backbeat by 15 ms at 84 BPM, `15 / (60000 / 84 / 1) ≈ 0.021` beats. A deviation of 10-30 ms is feel; above ~50 ms it is perceived as a mistake. See `references/smf-format.md` for the tick/ms relationship.

## Format

> → Read references/smf-format.md for the SMF binary structure, the VLQ encoding and the table of the most used GM programs

---

## Verdict

- **COMPLETE** — the `.mid` was written and the structure check passes
- **CONCERNS** — it was written but there are `[WARN]`s: melodic content on the percussion channel, or tracks close to the 15 limit
- **FAIL** — the spec does not validate; the message names the track and the note

Quick check that the file is an SMF:

```bash
python -c "print(open('output.mid','rb').read(4) == b'MThd')"   # True
```

## Next steps

- `/music-composition` if the musical material is not decided yet
- `/adaptive-music` to build the layering system that consumes these stems
- `/middleware-integration` to import the segments into Wwise/FMOD
