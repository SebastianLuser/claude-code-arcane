# Standard MIDI File — formato binario

Referencia de lo que emite `scripts/compose_midi.py`. Útil para debuggear un `.mid` a mano o extender el script.

## Estructura general

Un SMF es una secuencia de chunks. Cada chunk: 4 bytes de tipo + 4 bytes de longitud (big-endian) + cuerpo.

```
MThd <len=6> <format:2> <ntrks:2> <division:2>
MTrk <len>   <eventos...>
MTrk <len>   <eventos...>
```

**Formatos:**

| Formato | Qué es |
|---|---|
| 0 | Un solo track con todo mezclado |
| 1 | Múltiples tracks simultáneos; el track 0 es el conductor (tempo/compás) |
| 2 | Tracks independientes, secuenciales. Casi no se usa |

El script emite **formato 1**: track 0 con tempo, compás y tonalidad sin notas, y un `MTrk` por pista musical. Es lo que esperan los DAWs.

**División** — con el bit alto en 0, es *ticks por negra* (PPQ). 480 es el valor estándar de la industria y divide bien tresillos (160) y semicorcheas (120).

## Delta-times y VLQ

Cada evento arranca con un delta-time: cuántos ticks pasaron desde el evento anterior *en ese track*. Se codifica como Variable-Length Quantity: 7 bits de datos por byte, MSB = 1 en todos los bytes menos el último.

| Valor | Bytes |
|---|---|
| 0 | `00` |
| 127 | `7F` |
| 128 | `81 00` |
| 480 | `83 60` |
| 8192 | `C0 00` |

Un delta mal codificado desplaza todo lo que sigue: es la causa número uno de un `.mid` que "suena raro a partir de la mitad".

## Eventos de canal

`n` es el canal, 0-15.

| Evento | Bytes | Notas |
|---|---|---|
| Note Off | `8n kk vv` | `kk` nota, `vv` velocity de release |
| Note On | `9n kk vv` | `vv = 0` equivale a Note Off |
| Control Change | `Bn cc vv` | cc 7 = volumen, 10 = pan, 11 = expresión |
| Program Change | `Cn pp` | Instrumento GM |
| Pitch Bend | `En ll mm` | 14 bits, centro en `00 40` |

**Orden en el mismo tick:** el Note Off tiene que ir antes del Note On cuando se reataca la misma nota, o el sintetizador corta la nota nueva. El script ordena por `(tick, 0=off, 1=on)` justamente por esto.

## Meta eventos

Todos arrancan con `FF`, después tipo, después longitud en VLQ.

| Meta | Bytes | Contenido |
|---|---|---|
| Nombre de secuencia/track | `FF 03 <len> <texto>` | |
| Tempo | `FF 51 03 tttttt` | Microsegundos por negra = `60000000 / BPM` |
| Compás | `FF 58 04 nn dd cc bb` | `dd` = log2(denominador); `cc` = 24; `bb` = 8 |
| Tonalidad | `FF 59 02 sf mi` | `sf` sostenidos (+) o bemoles (−), signed; `mi` 0 mayor / 1 menor |
| End of Track | `FF 2F 00` | **Obligatorio** al final de cada `MTrk` |

Sin `End of Track` muchos lectores rechazan el archivo entero.

## Conversión de tiempo

```
ticks = beats × PPQ
ms_por_tick = 60000 / (BPM × PPQ)
```

A 120 BPM con PPQ 480: 1 tick = 1.041 ms. A 84 BPM: 1 tick = 1.488 ms.

Para escribir un desvío de feel en beats: `beats = ms × BPM / 60000`.

## Programas General MIDI usados seguido

| # | Instrumento | # | Instrumento |
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

## Percusión (canal 9)

El `pitch` es el instrumento, no la altura.

| # | Instrumento | # | Instrumento |
|---|---|---|---|
| 35 | Acoustic Bass Drum | 44 | Pedal Hi-Hat |
| 36 | Bass Drum 1 | 46 | Open Hi-Hat |
| 38 | Acoustic Snare | 49 | Crash Cymbal 1 |
| 39 | Hand Clap | 51 | Ride Cymbal 1 |
| 40 | Electric Snare | 54 | Tambourine |
| 41 | Low Floor Tom | 56 | Cowbell |
| 42 | Closed Hi-Hat | 76 | Hi Wood Block |

## Verificar un .mid a mano

```bash
python - <<'EOF'
import struct
data = open("salida.mid", "rb").read()
assert data[:4] == b"MThd"
length, fmt, ntrks, div = struct.unpack(">IHHH", data[4:14])
print("format", fmt, "| tracks", ntrks, "| ppq", div)
pos, seen = 14, 0
while pos < len(data):
    name, size = data[pos:pos+4], struct.unpack(">I", data[pos+4:pos+8])[0]
    body = data[pos+8:pos+8+size]
    assert name == b"MTrk" and body[-3:] == b"\xff\x2f\x00", f"track {seen} malformado"
    pos += 8 + size
    seen += 1
assert seen == ntrks and pos == len(data)
print("SMF valido")
EOF
```
