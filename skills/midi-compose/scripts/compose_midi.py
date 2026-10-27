#!/usr/bin/env python3
"""Writes a Standard MIDI File (format 1) from a JSON spec.

Stdlib only: the SMF is a documented binary format and emitting it needs
no dependency at all. See references/smf-format.md.

Usage:
    python compose_midi.py spec.json -o output.mid
    python compose_midi.py spec.json --validate      # validate only, write nothing
"""

from __future__ import annotations

import argparse
import json
import struct
import sys

# ---------------------------------------------------------------- constants

DRUM_CHANNEL = 9          # channel 10 in 1-based numbering; reserved for percussion by GM
MAX_CHANNELS = 16         # the hard limit: 15 melodic tracks + percussion
DEFAULT_PPQ = 480

NOTE_OFFSETS = {
    "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11,
}

# sf for the key signature meta event: sharps positive, flats negative
KEY_SIGNATURES = {
    "C": 0, "G": 1, "D": 2, "A": 3, "E": 4, "B": 5, "F#": 6, "C#": 7,
    "F": -1, "Bb": -2, "Eb": -3, "Ab": -4, "Db": -5, "Gb": -6, "Cb": -7,
}


class SpecError(ValueError):
    """The JSON spec is invalid. The message explains what to fix."""


# ------------------------------------------------------------------ helpers

def vlq(value: int) -> bytes:
    """Variable-length quantity: the SMF delta-time encoding.

    Seven bits per byte, MSB=1 on every byte but the last.
    """
    if value < 0:
        raise SpecError(f"negative delta-time: {value}")
    out = [value & 0x7F]
    value >>= 7
    while value:
        out.append((value & 0x7F) | 0x80)
        value >>= 7
    return bytes(reversed(out))


def parse_pitch(pitch: object) -> int:
    """Accepts 60, "C4", "F#3", "Bb5". Returns the MIDI note number (C4 = 60)."""
    if isinstance(pitch, bool):
        raise SpecError(f"invalid pitch: {pitch!r}")
    if isinstance(pitch, int):
        if not 0 <= pitch <= 127:
            raise SpecError(f"pitch out of range 0-127: {pitch}")
        return pitch
    if not isinstance(pitch, str) or not pitch:
        raise SpecError(f"invalid pitch: {pitch!r}")

    text = pitch.strip()
    letter = text[0].upper()
    if letter not in NOTE_OFFSETS:
        raise SpecError(f"unknown note in pitch {pitch!r}")

    index = 1
    accidental = 0
    while index < len(text) and text[index] in "#b":
        accidental += 1 if text[index] == "#" else -1
        index += 1

    octave_text = text[index:]
    if not octave_text.lstrip("-").isdigit():
        raise SpecError(f"missing octave in pitch {pitch!r} (e.g. C4, F#3, Bb5)")

    # C4 = 60 => octave -1 starts at 0
    value = (int(octave_text) + 1) * 12 + NOTE_OFFSETS[letter] + accidental
    if not 0 <= value <= 127:
        raise SpecError(f"pitch {pitch!r} falls outside the MIDI range 0-127")
    return value


def meta(kind: int, payload: bytes) -> bytes:
    return b"\xff" + bytes([kind]) + vlq(len(payload)) + payload


def text_meta(kind: int, text: str) -> bytes:
    return meta(kind, text.encode("utf-8", errors="replace"))


# ------------------------------------------------------------------ validate

def validate(spec: dict) -> dict:
    """Normalizes and validates the spec. Returns the normalized spec."""
    if not isinstance(spec, dict):
        raise SpecError("the root of the spec must be a JSON object")

    tempo = spec.get("tempo", 120)
    if not isinstance(tempo, (int, float)) or not 1 <= tempo <= 600:
        raise SpecError(f"tempo must be a number between 1 and 600, not {tempo!r}")

    ppq = spec.get("ppq", DEFAULT_PPQ)
    if not isinstance(ppq, int) or not 24 <= ppq <= 32767:
        raise SpecError(f"ppq must be an integer between 24 and 32767, not {ppq!r}")

    signature = spec.get("time_signature", [4, 4])
    if (not isinstance(signature, (list, tuple)) or len(signature) != 2
            or not all(isinstance(n, int) for n in signature)):
        raise SpecError('time_signature must be [numerator, denominator], e.g. [4, 4]')
    numerator, denominator = signature
    if not 1 <= numerator <= 255:
        raise SpecError(f"invalid time signature numerator: {numerator}")
    if denominator not in (1, 2, 4, 8, 16, 32, 64):
        raise SpecError(f"invalid time signature denominator: {denominator}")

    key = spec.get("key", "C")
    mode = spec.get("mode", "major")
    if key not in KEY_SIGNATURES:
        raise SpecError(
            f"unknown key {key!r}. Valid: {', '.join(sorted(KEY_SIGNATURES))}"
        )
    if mode not in ("major", "minor"):
        raise SpecError(f'mode must be "major" or "minor", not {mode!r}')

    tracks = spec.get("tracks")
    if not isinstance(tracks, list) or not tracks:
        raise SpecError("the spec needs at least one track in 'tracks'")

    melodic = 0
    used_channels: set[int] = set()
    normalized_tracks = []
    warnings: list[str] = []

    for position, track in enumerate(tracks):
        label = track.get("name") if isinstance(track, dict) else None
        where = f"track {position}" + (f" ({label})" if label else "")

        if not isinstance(track, dict):
            raise SpecError(f"{where}: each track must be an object")

        channel = track.get("channel", DRUM_CHANNEL if track.get("drums") else position)
        if not isinstance(channel, int) or not 0 <= channel < MAX_CHANNELS:
            raise SpecError(f"{where}: channel must be between 0 and 15, not {channel!r}")
        if channel in used_channels:
            raise SpecError(f"{where}: channel {channel} is already used by another track")
        used_channels.add(channel)

        if channel == DRUM_CHANNEL:
            if not track.get("drums"):
                warnings.append(
                    f"{where}: uses channel {DRUM_CHANNEL}, reserved for percussion by GM. "
                    f'If intentional, add "drums": true; otherwise move it to another channel.'
                )
        else:
            melodic += 1

        program = track.get("program", 0)
        if not isinstance(program, int) or not 0 <= program <= 127:
            raise SpecError(f"{where}: program must be between 0 and 127, not {program!r}")

        notes = track.get("notes")
        if not isinstance(notes, list):
            raise SpecError(f"{where}: 'notes' must be a list")

        normalized_notes = []
        for note_position, note in enumerate(notes):
            note_where = f"{where}, note {note_position}"
            if not isinstance(note, dict):
                raise SpecError(f"{note_where}: each note must be an object")

            pitch = parse_pitch(note.get("pitch"))

            start = note.get("start", 0)
            if not isinstance(start, (int, float)) or start < 0:
                raise SpecError(f"{note_where}: 'start' must be >= 0, not {start!r}")

            duration = note.get("duration", 1)
            if not isinstance(duration, (int, float)) or duration <= 0:
                raise SpecError(f"{note_where}: 'duration' must be > 0, not {duration!r}")

            velocity = note.get("velocity", 90)
            if not isinstance(velocity, int) or not 1 <= velocity <= 127:
                raise SpecError(
                    f"{note_where}: 'velocity' must be between 1 and 127, not {velocity!r}"
                )

            normalized_notes.append(
                {"pitch": pitch, "start": float(start),
                 "duration": float(duration), "velocity": velocity}
            )

        normalized_tracks.append({
            "name": track.get("name", f"Track {position}"),
            "channel": channel,
            "program": program,
            "notes": normalized_notes,
        })

    return {
        "name": spec.get("name", "untitled"),
        "tempo": float(tempo),
        "ppq": ppq,
        "time_signature": [numerator, denominator],
        "key": key,
        "mode": mode,
        "tracks": normalized_tracks,
        "melodic_tracks": melodic,
        "warnings": warnings,
    }


# --------------------------------------------------------------------- build

def build_chunk(name: bytes, body: bytes) -> bytes:
    return name + struct.pack(">I", len(body)) + body


def conductor_track(spec: dict) -> bytes:
    """Format 1 track 0: tempo, time signature, key. No notes."""
    events = [b"\x00" + text_meta(0x03, spec["name"])]

    microseconds = int(round(60_000_000 / spec["tempo"]))
    events.append(b"\x00" + meta(0x51, struct.pack(">I", microseconds)[1:]))

    numerator, denominator = spec["time_signature"]
    events.append(
        b"\x00" + meta(0x58, bytes([numerator, denominator.bit_length() - 1, 24, 8]))
    )

    sharps = KEY_SIGNATURES[spec["key"]]
    events.append(
        b"\x00" + meta(0x59, struct.pack(">bB", sharps, 1 if spec["mode"] == "minor" else 0))
    )

    events.append(b"\x00" + meta(0x2F, b""))
    return build_chunk(b"MTrk", b"".join(events))


def music_track(track: dict, ppq: int) -> bytes:
    channel = track["channel"]
    events = [
        b"\x00" + text_meta(0x03, track["name"]),
        b"\x00" + bytes([0xC0 | channel, track["program"]]),
    ]

    # (tick, order, bytes). order 0 = note-off first, so a note
    # re-attacked on the same tick does not cut itself off.
    timeline: list[tuple[int, int, bytes]] = []
    for note in track["notes"]:
        start = int(round(note["start"] * ppq))
        end = start + max(1, int(round(note["duration"] * ppq)))
        timeline.append((start, 1, bytes([0x90 | channel, note["pitch"], note["velocity"]])))
        timeline.append((end, 0, bytes([0x80 | channel, note["pitch"], 0])))

    timeline.sort(key=lambda item: (item[0], item[1]))

    previous = 0
    for tick, _order, payload in timeline:
        events.append(vlq(tick - previous) + payload)
        previous = tick

    events.append(b"\x00" + meta(0x2F, b""))
    return build_chunk(b"MTrk", b"".join(events))


def build_midi(spec: dict) -> bytes:
    ppq = spec["ppq"]
    tracks = [conductor_track(spec)] + [music_track(t, ppq) for t in spec["tracks"]]
    header = build_chunk(b"MThd", struct.pack(">HHH", 1, len(tracks), ppq))
    return header + b"".join(tracks)


# ----------------------------------------------------------------------- cli

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Writes a .mid from a JSON spec.")
    parser.add_argument("spec", help="path to the JSON spec")
    parser.add_argument("-o", "--output", help="path of the output .mid")
    parser.add_argument("--validate", action="store_true",
                        help="only validate the spec, write nothing")
    args = parser.parse_args(argv)

    try:
        with open(args.spec, "r", encoding="utf-8") as handle:
            raw = json.load(handle)
    except FileNotFoundError:
        print(f"[FAIL] spec not found: {args.spec}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as error:
        print(f"[FAIL] invalid JSON in {args.spec}: {error}", file=sys.stderr)
        return 1

    try:
        spec = validate(raw)
    except SpecError as error:
        print(f"[FAIL] {error}", file=sys.stderr)
        return 1

    note_count = sum(len(t["notes"]) for t in spec["tracks"])
    print(f"[PASS] valid spec: {len(spec['tracks'])} tracks "
          f"({spec['melodic_tracks']} melodic out of 15 possible), {note_count} notes, "
          f"{spec['tempo']:g} BPM, {spec['key']} {spec['mode']}")
    for warning in spec["warnings"]:
        print(f"[WARN] {warning}")

    if args.validate:
        return 0

    output = args.output or (args.spec.rsplit(".", 1)[0] + ".mid")
    data = build_midi(spec)
    with open(output, "wb") as handle:
        handle.write(data)

    print(f"[COMPLETE] {output} ({len(data)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
