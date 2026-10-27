# Standard MIDI File — binary format

Reference for what `scripts/compose_midi.py` emits. Useful for debugging a `.mid` by hand or extending the script.

## Overall structure

An SMF is a sequence of chunks. Each chunk: 4 bytes of type + 4 bytes of length (big-endian) + body.

```
MThd <len=6> <format:2> <ntrks:2> <division:2>
MTrk <len>   <events...>
MTrk <len>   <events...>
```

**Formats:**

| Format | What it is |
|---|---|
| 0 | A single track with everything merged |
| 1 | Multiple simultaneous tracks; track 0 is the conductor (tempo/time signature) |
| 2 | Independent, sequential tracks. Hardly ever used |

The script emits **format 1**: track 0 with tempo, time signature and key and no notes, plus one `MTrk` per musical part. It is what DAWs expect.

**Division** — with the high bit at 0, it is *ticks per quarter note* (PPQ). 480 is the industry standard value and divides cleanly into triplets (160) and sixteenth notes (120).

## Delta-times and VLQ

Each event starts with a delta-time: how many ticks passed since the previous event *in that track*. It is encoded as a Variable-Length Quantity: 7 data bits per byte, MSB = 1 on every byte but the last.

| Value | Bytes |
|---|---|
| 0 | `00` |
| 127 | `7F` |
| 128 | `81 00` |
| 480 | `83 60` |
| 8192 | `C0 00` |

A badly encoded delta shifts everything after it: it is the number one cause of a `.mid` that "sounds weird from the middle on".

## Channel events

`n` is the channel, 0-15.

| Event | Bytes | Notes |
|---|---|---|
| Note Off | `8n kk vv` | `kk` note, `vv` release velocity |
| Note On | `9n kk vv` | `vv = 0` is equivalent to Note Off |
| Control Change | `Bn cc vv` | cc 7 = volume, 10 = pan, 11 = expression |
| Program Change | `Cn pp` | GM instrument |
| Pitch Bend | `En ll mm` | 14 bits, centered at `00 40` |

**Order on the same tick:** the Note Off has to come before the Note On when the same note is re-attacked, or the synthesizer cuts the new note. The script sorts by `(tick, 0=off, 1=on)` precisely for this.

## Meta events

They all start with `FF`, then the type, then the length in VLQ.

| Meta | Bytes | Content |
|---|---|---|
| Sequence/track name | `FF 03 <len> <text>` | |
| Tempo | `FF 51 03 tttttt` | Microseconds per quarter note = `60000000 / BPM` |
| Time signature | `FF 58 04 nn dd cc bb` | `dd` = log2(denominator); `cc` = 24; `bb` = 8 |
| Key signature | `FF 59 02 sf mi` | `sf` sharps (+) or flats (−), signed; `mi` 0 major / 1 minor |
| End of Track | `FF 2F 00` | **Required** at the end of every `MTrk` |

Without `End of Track` many readers reject the whole file.

## Time conversion

```
ticks = beats × PPQ
ms_per_tick = 60000 / (BPM × PPQ)
```

At 120 BPM with PPQ 480: 1 tick = 1.041 ms. At 84 BPM: 1 tick = 1.488 ms.

To write a feel offset in beats: `beats = ms × BPM / 60000`.

## Frequently used General MIDI programs

| # | Instrument | # | Instrument |
|---|---|---|---|
| 0 | Acoustic Grand Piano | 48 | String Ensemble 1 |
| 4 | Electric Piano 1 | 49 | String Ensemble 2 |
| 11 | Vibraphone | 52 | Choir Aahs |
| 19 | Church Organ | 56 | Trumpet |
| 24 | Nylon Guitar | 57 | Trombone |
| 25 | Steel Guitar | 60 | French Horn |
| 32 | Acoustic Bass | 68 | Oboe |
| 33 | Finger Bass | 71 | Clarinet |
| 40 | Violin | 73 | Flute |
| 42 | Cello | 89 | Pad 2 (warm) |
| 46 | Orchestral Harp | 94 | Pad 7 (halo) |

## Percussion (channel 9)

The `pitch` is the instrument, not the pitch.

| # | Instrument | # | Instrument |
|---|---|---|---|
| 35 | Acoustic Bass Drum | 44 | Pedal Hi-Hat |
| 36 | Bass Drum 1 | 46 | Open Hi-Hat |
| 38 | Acoustic Snare | 49 | Crash Cymbal 1 |
| 39 | Hand Clap | 51 | Ride Cymbal 1 |
| 40 | Electric Snare | 54 | Tambourine |
| 41 | Low Floor Tom | 56 | Cowbell |
| 42 | Closed Hi-Hat | 76 | Hi Wood Block |

## Checking a .mid by hand

```bash
python - <<'EOF'
import struct
data = open("output.mid", "rb").read()
assert data[:4] == b"MThd"
length, fmt, ntrks, div = struct.unpack(">IHHH", data[4:14])
print("format", fmt, "| tracks", ntrks, "| ppq", div)
pos, seen = 14, 0
while pos < len(data):
    name, size = data[pos:pos+4], struct.unpack(">I", data[pos+4:pos+8])[0]
    body = data[pos+8:pos+8+size]
    assert name == b"MTrk" and body[-3:] == b"\xff\x2f\x00", f"track {seen} malformed"
    pos += 8 + size
    seen += 1
assert seen == ntrks and pos == len(data)
print("valid SMF")
EOF
```
