#!/usr/bin/env python3
"""Verifica conformidad mecanica de assets WAV contra los standards del proyecto.

Solo stdlib: usa el modulo `wave` para leer cabeceras y frames. Los chequeos que
necesitarian una herramienta externa se reportan como [SKIP], no rompen la corrida.

Uso:
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

# Umbrales de deteccion. Explicitos para que se puedan discutir.
LEADING_SILENCE_MS = 10.0    # silencio inicial que ya se percibe como lag
SILENCE_FLOOR = 0.002        # ~-54 dBFS: por debajo se considera silencio
DC_OFFSET_LIMIT = 0.01       # 1% de fondo de escala
CLIP_SAMPLE_LIMIT = 3        # muestras en fondo de escala para llamarlo clipping


class Finding:
    __slots__ = ("path", "severity", "check", "detail")

    def __init__(self, path: str, severity: str, check: str, detail: str):
        self.path = path
        self.severity = severity      # FAIL | WARN | SKIP
        self.check = check
        self.detail = detail


def read_samples(handle: wave.Wave_read, limit: int | None = None) -> list[int]:
    """Devuelve las muestras del primer canal, normalizadas a int con signo."""
    width = handle.getsampwidth()
    channels = handle.getnchannels()
    frames = handle.getnframes() if limit is None else min(limit, handle.getnframes())
    raw = handle.readframes(frames)

    if width == 1:
        # 8-bit WAV es unsigned; centrar en 0
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
                                f"no matchea {args.naming!r}"))

    try:
        with wave.open(path, "rb") as handle:
            rate = handle.getframerate()
            width = handle.getsampwidth()
            channels = handle.getnchannels()
            frames = handle.getnframes()
            duration = frames / rate if rate else 0.0

            if args.rate and rate != args.rate:
                findings.append(Finding(path, "FAIL", "sample-rate",
                                        f"{rate} Hz, se esperaba {args.rate} Hz"))
            if args.bits and width * 8 != args.bits:
                findings.append(Finding(path, "FAIL", "bit-depth",
                                        f"{width * 8}-bit, se esperaba {args.bits}-bit"))
            if args.mono_3d and channels != 1:
                findings.append(Finding(
                    path, "FAIL", "channels",
                    f"{channels} canales; una fuente 3D tiene que ser mono o el "
                    f"middleware la colapsa y se degrada la localizacion"))
            if args.rate and rate and rate != args.rate and args.rate % rate and rate % args.rate:
                findings.append(Finding(path, "WARN", "resample",
                                        f"{rate} Hz no es multiplo ni divisor de "
                                        f"{args.rate} Hz: el resampleo es mas costoso"))
            if frames == 0:
                findings.append(Finding(path, "FAIL", "empty", "0 frames"))
                return findings
            if args.max_duration and duration > args.max_duration:
                findings.append(Finding(path, "WARN", "duration",
                                        f"{duration:.2f} s > {args.max_duration:.2f} s"))

            samples = read_samples(handle)
            if not samples:
                findings.append(Finding(path, "SKIP", "content",
                                        f"{width * 8}-bit no soportado por el lector stdlib"))
                return findings

            scale = full_scale(width)
            peak = max(abs(value) for value in samples)

            clipped = sum(1 for value in samples if abs(value) >= scale - 1)
            if clipped >= CLIP_SAMPLE_LIMIT:
                findings.append(Finding(path, "FAIL", "clipping",
                                        f"{clipped} muestras en fondo de escala"))

            offset = sum(samples) / len(samples) / scale
            if abs(offset) > DC_OFFSET_LIMIT:
                findings.append(Finding(path, "WARN", "dc-offset",
                                        f"{offset * 100:+.2f}% - produce clicks al concatenar"))

            floor = SILENCE_FLOOR * scale
            if peak < floor:
                # Archivo enteramente silencioso: el chequeo de silencio inicial
                # sobra, seria el mismo hallazgo dos veces.
                findings.append(Finding(path, "FAIL", "silent", "el archivo es silencio"))
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
                    f"{leading_ms:.1f} ms de silencio inicial - se percibe como lag de input"))

    except wave.Error as error:
        findings.append(Finding(path, "SKIP", "format",
                                f"no es un WAV PCM legible ({error})"))
    except OSError as error:
        findings.append(Finding(path, "FAIL", "io", str(error)))

    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Verifica conformidad de assets WAV contra los standards del proyecto.")
    parser.add_argument("root", help="carpeta a auditar (recursivo)")
    parser.add_argument("--rate", type=int, help="sample rate esperado, ej 48000")
    parser.add_argument("--bits", type=int, choices=(8, 16, 24, 32),
                        help="bit depth esperado")
    parser.add_argument("--mono-3d", action="store_true",
                        help="exigir mono (assets usados como fuentes 3D)")
    parser.add_argument("--naming", help="regex que el nombre de archivo debe matchear")
    parser.add_argument("--max-duration", type=float,
                        help="duracion maxima en segundos")
    args = parser.parse_args(argv)

    if not os.path.isdir(args.root):
        print(f"[FAIL] no es una carpeta: {args.root}", file=sys.stderr)
        return 1

    paths = []
    for directory, _subdirs, files in os.walk(args.root):
        for name in sorted(files):
            if name.lower().endswith(".wav"):
                paths.append(os.path.join(directory, name))

    if not paths:
        print(f"[SKIP] no hay .wav en {args.root}")
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
