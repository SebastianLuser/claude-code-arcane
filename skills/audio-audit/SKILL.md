---
name: audio-audit
description: "Auditoria de audio: voice count, CPU, memoria, streaming, compliance de loudness (ASWG-R001), conformidad de assets contra spec y checklist por plataforma. Usar para: QA de audio, performance de audio, verificar loudness, revisar assets, pre-certificacion."
category: "audio"
argument-hint: "[full | perf | loudness | assets | platform]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---
# audio-audit — QA y Compliance de Audio

Verifica que el audio del proyecto cumple: performance dentro del presupuesto, assets conformes al spec, y loudness dentro del target de plataforma.

## Cuándo usar

- Antes de una milestone o de certificación
- El audio se corta, se satura o come demasiado CPU
- Verificar assets entregados por un contractor
- Auditar loudness para cumplir requisitos de plataforma
- Después de integrar un sistema nuevo, para medir su costo real

## Input

1. Leer audio bible (sección 8, standards) y los specs de `/audio-spec`
2. Determinar plataformas target, y cuál es la más baja
3. Preguntar al usuario: alcance (`full` / solo perf / solo loudness / solo assets) y si hay captura de profiler disponible

---

## 1. Performance

**Presupuesto:** el audio dispone del **5-10% del frame time**. A 60 fps el frame son 16.6 ms, así que el audio tiene ~0.8-1.7 ms. A 90 fps (VR) el frame son ~11 ms y el margen es menor.

| Métrica | Cómo se mide | Verdict |
|---|---|---|
| **CPU de audio** | Profiler del middleware, en gameplay real | FAIL si supera el 10% del frame sostenido |
| **Voces activas** | Pico vs límite configurado | CONCERNS si el pico toca el límite; FAIL si hay descartes de sonidos de prioridad alta |
| **Memoria de audio** | Por bank y total, vs budget del proyecto | FAIL si supera el budget en la plataforma más baja |
| **Accesos de streaming** | Contador de streaming del profiler | CONCERNS si hay starvation |
| **Game objects registrados** | Contador, medido a lo largo de una sesión larga | FAIL si crece monótonamente (leak) |

**Medir en gameplay real, no en el editor.** El editor dispara eventos en orden, uno por vez, sin ruido. El jugador produce combinaciones que nadie planificó. Y medir en la **plataforma más baja** del target: el presupuesto que cierra en PC no dice nada de un handheld.

**El leak de game objects es el hallazgo más frecuente.** Si el contador de objetos registrados crece durante una sesión de dos horas y nunca baja, hay des-registros faltantes. Se ve solo en sesiones largas.

### Costos de referencia

Para saber si un número medido es razonable:

| Operación | Costo esperado por fuente |
|---|---|
| Convolución HRTF (512 taps) | ~2 ms |
| Encode ambisónico | ~0.1 ms |
| Decode ambisónico a binaural | ~1 ms total |
| Footstep procedural | ~1-2 ms |
| Síntesis de viento | ~0.5 ms/frame |
| Panning + atenuación | despreciable |

Si lo medido se desvía mucho del esperado, la causa suele ser configuración (más taps, más fuentes espacializadas de las previstas) antes que el motor.

## 2. Loudness

Referencia de industria en juegos: **ASWG-R001** (Sony), la única especificación publicada por una plataforma mayor.

| Contexto | Loudness promedio | True peak máximo |
|---|---|---|
| Consola / home | **−23 LUFS** (±2) | **−1 dBTP** |
| Portable / handheld | **−18 LUFS** | −1 dBTP |

**Cómo medir bien:**

- Se mide el **programa completo en gameplay representativo**, no un asset aislado. Medir un `.wav` no dice nada sobre cumplimiento
- Sesión de duración suficiente para promediar: al menos varios minutos cubriendo exploración, combate y diálogo
- Medir el **true peak**, no el peak de sample: la codificación lossy puede generar picos por encima del valor medido en PCM
- **Confirmar el target vigente** de cada plataforma antes de certificación. Las recomendaciones se revisan — el promedio de ASWG también se citó como −24 LKFS, así que no confiar en un número memorizado

**Verdict:** COMPLIANT dentro del target con su tolerancia; NON-COMPLIANT fuera, o con true peak por encima de −1 dBTP.

## 3. Conformidad de assets

Verificación mecánica contra los standards del bible. Esto se automatiza:

| Chequeo | Falla típica |
|---|---|
| Sample rate | Mezcla de 44.1 y 48 kHz en el mismo proyecto |
| Bit depth | 24-bit donde el pipeline espera 16 |
| Canales | Estéreo en un asset que se usa como fuente 3D mono |
| Naming | No sigue el patrón; rompe batch y automatización de banks |
| DC offset | Produce clicks al concatenar |
| Silencio al inicio | Retrasa el ataque; se percibe como lag |
| Clipping | Picos a 0 dBFS en el asset crudo |
| Duración vs spec | Fuera del rango especificado |
| Loudness por categoría | Assets de la misma categoría con niveles dispares |

**Fuente 3D en estéreo es el hallazgo más común y el más silencioso:** el middleware la trata distinto o la colapsa, y la localización espacial se degrada sin que nadie vea un error.

La skill trae el verificador: `scripts/check_assets.py`, stdlib-only (módulo `wave`), recursivo sobre una carpeta.

```bash
python skills/audio-audit/scripts/check_assets.py assets/audio \
  --rate 48000 --bits 16 --mono-3d --naming '^(sfx|vo|mus)_'
```

Chequea sample rate, bit depth, canales, naming, clipping, DC offset, silencio inicial, archivos vacíos o silenciosos, y avisa cuando el sample rate obliga a un resampleo costoso. Emite `[FAIL]` / `[WARN]` / `[SKIP]` por hallazgo y cierra con COMPLIANT / CONCERNS / NON-COMPLIANT; exit code 1 solo si hay FAIL, para usarlo en CI.

Lo que necesita una herramienta externa (loudness integrado, análisis espectral) se reporta como `[SKIP]` en vez de abortar la corrida.

## 4. Checklist por plataforma

| Ítem | Aplica a |
|---|---|
| Loudness dentro del target del contexto | Todas |
| True peak ≤ −1 dBTP | Todas |
| Manejo de interrupciones (llamada, alarma) | Móvil |
| Manejo de cambio de ruta (auriculares) | Móvil, consola |
| Respeto del switch de silencio | iOS |
| Comportamiento en background | Móvil |
| Mezcla con audio de terceros | Móvil |
| Audio no rompe al perder foco | Todas |
| Memoria dentro del budget de la plataforma | Todas |
| Se puede mutear todo desde opciones | Todas |
| Controles separados: música / SFX / voz / UI | Todas |
| Información crítica no exclusivamente por audio | Todas (accesibilidad) |
| Subtítulos para todo el diálogo | Todas (accesibilidad) |

El comportamiento en background y el switch de silencio en iOS son causas concretas de rechazo de store, no recomendaciones.

---

## Proceso

1. **Determinar el alcance** y la plataforma más baja del target
2. **Capturar** con el profiler del middleware en gameplay representativo, no en el editor
3. **Medir performance** contra el presupuesto y comparar con los costos de referencia
4. **Medir loudness** del programa completo, con true peak
5. **Verificar assets** contra los standards, automatizado si el volumen lo justifica
6. **Recorrer el checklist** de plataforma
7. **Reportar** con severidad por hallazgo y, si el usuario lo pide, preguntar "¿Escribo el reporte a `<path>`?" antes de usar Write

### Formato del reporte

Por hallazgo: qué se midió, valor medido, valor esperado, severidad, y dónde está el problema. Un hallazgo sin número medido no es un hallazgo, es una impresión.

---

## Verdict

Global, y por sección:

- **COMPLIANT** — performance dentro del presupuesto en la plataforma más baja, loudness dentro del target, assets conformes, checklist completo
- **CONCERNS** — hay desvíos que no bloquean: pico de voces tocando el límite, assets con naming inconsistente, loudness en el borde de la tolerancia
- **NON-COMPLIANT** — CPU o memoria fuera de presupuesto, loudness fuera del target, leak de game objects, o un ítem de checklist que es causa de rechazo de plataforma

Un NON-COMPLIANT en cualquier sección bloquea certificación.

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/spatial-audio` si el costo de espacialización está fuera de presupuesto
- `/audio-mix` si el problema es loudness o balance entre categorías
- `/middleware-integration` si hay leaks, banks mal organizados o descartes de voces
- `/procedural-audio` si la memoria no cierra por cantidad de samples
