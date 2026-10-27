#!/usr/bin/env python3
"""Checks the mechanical conformance of WAV assets against the project standards.

Stdlib only: uses the `wave` module to read headers and frames. Checks that
would need an external tool are reported as [SKIP]; they do not break the run.

Usage:
    python check_assets.py assets/audio
    python check_assets.py assets/audio --rate 48000 --bits 16
    python check_assets.py assets/audio --mono-3d --naming "^(sfx|vo|mus)_"
"""

from __future__ import annotations

import argparse
import os
import re
import struct
import sys
import wave

# Detection thresholds. Explicit so they can be discussed.
LEADING_SILENCE_MS = 10.0    # leading silence that is already perceived as lag
SILENCE_FLOOR = 0.002        # ~-54 dBFS: anything below counts as silence
DC_OFFSET_LIMIT = 0.01       # 1% of full scale
CLIP_SAMPLE_LIMIT = 3        # samples at full scale to call it clipping


class Finding:
    __slots__ = ("path", "severity", "check", "detail")

    def __init__(self, path: str, severity: str, check: str, detail: str):
        self.path = path
        self.severity = severity      # FAIL | WARN | SKIP
        self.check = check
        self.detail = detail


def read_samples(handle: wave.Wave_read, limit: int | None = None) -> list[int]:
    """Returns the first channel's samples, normalized to signed int."""
    width = handle.getsampwidth()
    channels = handle.getnchannels()
    frames = handle.getnframes() if limit is None else min(limit, handle.getnframes())
    raw = handle.readframes(frames)

    if width == 1:
        # 8-bit WAV is unsigned; center on 0
        values = [byte - 128 for byte in raw]
    elif width == 2:
        values = list(struct.unpack(f"<{len(raw) // 2}h", raw[: len(raw) // 2 * 2]))
    elif width == 3:
        values = []
        for offset in range(0, len(raw) - 2, 3):
            chunk = raw[offset:offset + 3]
            value = int.from_bytes(chunk, "little", signed=True)
            values.append(value)
    elif width == 4:
        values = list(struct.unpack(f"<{len(raw) // 4}i", raw[: len(raw) // 4 * 4]))
    else:
        return []

    return values[::channels] if channels > 1 else values


def full_scale(width: int) -> float:
    return float(2 ** (8 * width - 1))


def check_file(path: str, args: argparse.Namespace) -> list[Finding]:
    findings: list[Finding] = []
    name = os.path.basename(path)

    if args.naming and not re.search(args.naming, name):
        findings.append(Finding(path, "FAIL", "naming",
                                f"does not match {args.naming!r}"))

    try:
        with wave.open(path, "rb") as handle:
            rate = handle.getframerate()
            width = handle.getsampwidth()
            channels = handle.getnchannels()
            frames = handle.getnframes()
            duration = frames / rate if rate else 0.0

            if args.rate and rate != args.rate:
                findings.append(Finding(path, "FAIL", "sample-rate",
                                        f"{rate} Hz, expected {args.rate} Hz"))
            if args.bits and width * 8 != args.bits:
                findings.append(Finding(path, "FAIL", "bit-depth",
                                        f"{width * 8}-bit, expected {args.bits}-bit"))
            if args.mono_3d and channels != 1:
                findings.append(Finding(
                    path, "FAIL", "channels",
                    f"{channels} channels; a 3D source must be mono or the "
                    f"middleware collapses it and localization degrades"))
            if args.rate and rate and rate != args.rate and args.rate % rate and rate % args.rate:
                findings.append(Finding(path, "WARN", "resample",
                                        f"{rate} Hz is neither a multiple nor a divisor of "
                                        f"{args.rate} Hz: resampling is more expensive"))
            if frames == 0:
                findings.append(Finding(path, "FAIL", "empty", "0 frames"))
                return findings
            if args.max_duration and duration > args.max_duration:
                findings.append(Finding(path, "WARN", "duration",
                                        f"{duration:.2f} s > {args.max_duration:.2f} s"))

            samples = read_samples(handle)
            if not samples:
                findings.append(Finding(path, "SKIP", "content",
                                        f"{width * 8}-bit not supported by the stdlib reader"))
                return findings

            scale = full_scale(width)
            peak = max(abs(value) for value in samples)

            clipped = sum(1 for value in samples if abs(value) >= scale - 1)
            if clipped >= CLIP_SAMPLE_LIMIT:
                findings.append(Finding(path, "FAIL", "clipping",
                                        f"{clipped} samples at full scale"))

            offset = sum(samples) / len(samples) / scale
            if abs(offset) > DC_OFFSET_LIMIT:
                findings.append(Finding(path, "WARN", "dc-offset",
                                        f"{offset * 100:+.2f}% - causes clicks when concatenating"))

            floor = SILENCE_FLOOR * scale
            if peak < floor:
                # Entirely silent file: the leading-silence check is redundant,
                # it would be the same finding twice.
                findings.append(Finding(path, "FAIL", "silent", "the file is silence"))
                return findings

            leading = 0
            for value in samples:
                if abs(value) > floor:
                    break
                leading += 1
            leading_ms = leading / rate * 1000
            if leading_ms > LEADING_SILENCE_MS:
                findings.append(Finding(
                    path, "WARN", "leading-silence",
                    f"{leading_ms:.1f} ms of leading silence - perceived as input lag"))

    except wave.Error as error:
        findings.append(Finding(path, "SKIP", "format",
                                f"not a readable PCM WAV ({error})"))
    except OSError as error:
        findings.append(Finding(path, "FAIL", "io", str(error)))

    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Checks WAV asset conformance against the project standards.")
    parser.add_argument("root", help="folder to audit (recursive)")
    parser.add_argument("--rate", type=int, help="expected sample rate, e.g. 48000")
    parser.add_argument("--bits", type=int, choices=(8, 16, 24, 32),
                        help="expected bit depth")
    parser.add_argument("--mono-3d", action="store_true",
                        help="require mono (assets used as 3D sources)")
    parser.add_argument("--naming", help="regex the file name must match")
    parser.add_argument("--max-duration", type=float,
                        help="maximum duration in seconds")
    args = parser.parse_args(argv)

    if not os.path.isdir(args.root):
        print(f"[FAIL] not a folder: {args.root}", file=sys.stderr)
        return 1

    paths = []
    for directory, _subdirs, files in os.walk(args.root):
        for name in sorted(files):
            if name.lower().endswith(".wav"):
                paths.append(os.path.join(directory, name))

    if not paths:
        print(f"[SKIP] no .wav files in {args.root}")
        return 0

    findings: list[Finding] = []
    for path in paths:
        findings.extend(check_file(path, args))

    fails = [f for f in findings if f.severity == "FAIL"]
    warns = [f for f in findings if f.severity == "WARN"]
    skips = [f for f in findings if f.severity == "SKIP"]

    for group in (fails, warns, skips):
        for finding in group:
            relative = os.path.relpath(finding.path, args.root)
            print(f"[{finding.severity}] {relative}: {finding.check} - {finding.detail}")

    print()
    print(f"{len(paths)} assets | {len(fails)} FAIL | {len(warns)} WARN | {len(skips)} SKIP")

    if fails:
        print("NON-COMPLIANT")
        return 1
    if warns:
        print("CONCERNS")
        return 0
    print("COMPLIANT")
    return 0


if __name__ == "__main__":
    sys.exit(main())
