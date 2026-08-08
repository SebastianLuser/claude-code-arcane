---
name: midi-compose
description: "Genera archivos MIDI (.mid) desde un spec JSON con scripts Python stdlib-only. Sin dependencias: escribe el Standard MIDI File binario directo. Usar para: exportar una composicion a MIDI, bocetar stems, generar loops o capas para middleware."
category: "audio"
argument-hint: "[spec-path | new | validate]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---
# midi-compose — Composición a MIDI

Baja decisiones musicales a un `.mid` real. Las decisiones las toma `/music-composition`; esta skill las escribe.

**Sin dependencias.** El Standard MIDI File es un formato binario documentado y `scripts/compose_midi.py` lo emite con la stdlib de Python. No hay que instalar `midiutil`, `music21` ni nada. Corre en la máquina del usuario tal como se copia.

## Alcance

**Sí:** escribir `.mid` multipista con tempo, compás, tonalidad, programas General MIDI, velocities y percusión.

**No:** renderizar a audio (requiere FluidSynth + soundfonts, dependencias de sistema fuera de scope), tomar decisiones musicales (→ `/music-composition`), notación.

## Cuándo usar

- Ya hay material decidido (progresión, melodía, groove) y hace falta el archivo
- Bocetar stems para un sistema de capas de `/adaptive-music`
- Generar variantes de un tema por transformación (aumentación, cambio de modo)
- Entregar MIDI a un compositor o importarlo a un DAW/middleware

---

## Modos

| Modo | Qué hace |
|---|---|
| `spec-path` | Genera el `.mid` desde un spec JSON existente |
| `new` | Arma el spec desde cero a partir de material musical, y después genera |
| `validate` | Solo valida el spec y reporta, sin escribir nada |

## Workflow

### 1. Armar el spec

Un objeto JSON. Todos los tiempos están en **beats** (negras), no en ticks — el script convierte.

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

Hay un ejemplo completo de tres pistas en `templates/example-composition.json`.

**Campos del spec**

| Campo | Default | Notas |
|---|---|---|
| `name` | `"untitled"` | Va al meta de nombre de secuencia |
| `tempo` | `120` | BPM, 1-600 |
| `ppq` | `480` | Ticks por negra, 24-32767 |
| `time_signature` | `[4, 4]` | Denominador potencia de 2 |
| `key` / `mode` | `"C"` / `"major"` | Solo para el meta de tonalidad; no transpone |
| `tracks[].channel` | índice del track | 0-15, único por track |
| `tracks[].program` | `0` | Programa General MIDI 0-127 |
| `tracks[].drums` | `false` | Declaralo en el track del canal 9 |
| `notes[].pitch` | — | `60`, `"C4"`, `"F#3"`, `"Bb5"`. C4 = 60 |
| `notes[].start` | `0` | En beats desde el inicio |
| `notes[].duration` | `1` | En beats, > 0 |
| `notes[].velocity` | `90` | 1-127 |

### 2. Validar antes de escribir

```bash
python skills/midi-compose/scripts/compose_midi.py spec.json --validate
```

Salida `[PASS]` con el resumen, más `[WARN]` por cada problema no fatal. Un `[FAIL]` nombra el track y la nota exactos.

### 3. Generar

```bash
python skills/midi-compose/scripts/compose_midi.py spec.json -o salida.mid
```

Antes de escribir el `.mid` o el spec a disco, preguntar al usuario "¿Escribo esto a `<path>`?" — sobre todo si el archivo ya existe.

---

## Límites de MIDI que importan

- **16 canales.** El canal 9 (10 en base 1) está reservado a percusión por General MIDI, así que quedan **15 pistas melódicas**. Si necesitás más, son varios archivos.
- **Un programa por canal a la vez.** Cambiar de instrumento a mitad de pista pide otro canal.
- **Velocity no es volumen.** Es intensidad de ataque; el sampler decide qué hacer con ella.
- **MIDI no lleva timbre.** El programa GM es una sugerencia; cómo suena depende del soundfont o del instrumento del DAW.
- **`pitch` en el canal de percusión es el instrumento**, no una altura: 36 = bombo, 38 = redoblante, 42 = hi-hat cerrado, 46 = hi-hat abierto.

## Feel y microtiming

El spec acepta `start` fraccional, así que el feel se escribe directo: para atrasar un backbeat 15 ms a 84 BPM, `15 / (60000 / 84 / 1) ≈ 0.021` beats. Un desvío de 10-30 ms es feel; arriba de ~50 ms se percibe como error. Ver `references/smf-format.md` para la relación tick/ms.

## Formato

> → Read references/smf-format.md para la estructura binaria del SMF, el encoding VLQ y la tabla de programas GM más usados

---

## Verdict

- **COMPLETE** — el `.mid` se escribió y la verificación de estructura pasa
- **CONCERNS** — se escribió pero hay `[WARN]`: contenido melódico en el canal de percusión, o pistas cerca del límite de 15
- **FAIL** — el spec no valida; el mensaje nombra el track y la nota

Verificación rápida de que el archivo es un SMF:

```bash
python -c "print(open('salida.mid','rb').read(4) == b'MThd')"   # True
```

## Next steps

- `/music-composition` si el material musical todavía no está decidido
- `/adaptive-music` para armar el sistema de capas que consume estos stems
- `/middleware-integration` para importar los segmentos a Wwise/FMOD
