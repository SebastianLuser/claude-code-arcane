---
name: audio-mix
description: "Mezcla de juego: jerarquia de buses, ducking y sidechain, mix states/snapshots, frequency masking, headroom y targets de loudness. Usar para: estructura de buses, ducking de dialogo, mix dinamico, resolver que el mix suena barroso."
category: "audio"
argument-hint: "[buses | ducking | states | loudness | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# audio-mix — Mezcla Dinámica

Diseña la estructura de buses y las reglas que deciden **qué se escucha cuando todo suena a la vez**.

El mix de un juego no es un mix estático: es un sistema de reglas, porque no se sabe de antemano qué va a sonar simultáneamente.

## Cuándo usar

- Definir la arquitectura de buses del proyecto
- El mix suena barroso, o el diálogo no se entiende
- Falta control dinámico: momentos importantes no destacan
- Cumplir targets de loudness de plataforma

## Input

1. Leer audio bible, sección 4 (frequency allocation) y 5 (mix hierarchy)
2. Listar las categorías de audio del proyecto
3. Preguntar al usuario: plataformas target, si hay diálogo, y si existe algún requisito de certificación

---

## Jerarquía de buses

Estructura base que sirve para casi cualquier juego:

```
Master
├── Music
├── SFX
│   ├── Player          (feedback de la acción del jugador)
│   ├── World           (enemigos, props, entorno)
│   └── Ambience
├── Voice
│   ├── Dialogue        (narrativa, crítico)
│   └── Barks           (chatter de combate)
└── UI
```

**Por qué esta forma:**
- `Player` separado de `World` permite proteger el feedback de la acción del jugador cuando hay 40 enemigos
- `Dialogue` separado de `Barks` permite duckear por diálogo importante sin que cada bark baje la música
- `UI` afuera de `SFX` porque tiene su propio nivel (−18 a −24 dB) y su propio control de usuario
- `Ambience` separado porque es lo primero que se sacrifica cuando el mix se llena

**Cada bus necesita:** volumen base, control de usuario expuesto o no, y si va a reverb de zona.

## Ducking

Bajar una categoría cuando otra suena. Los casos reales:

| Trigger | Qué duckea | Cuánto | Attack / Release |
|---|---|---|---|
| Diálogo | Music, Ambience | −6 a −9 dB | 50 ms / 400 ms |
| UI crítico | Music, SFX | −3 a −6 dB | 20 ms / 200 ms |
| Momento narrativo | Todo menos Voice | −12 dB | 200 ms / 800 ms |
| Barks | nada, o −2 dB | mínimo | rápido |

**El release siempre más largo que el attack.** Un release corto produce bombeo audible: la música sube y baja a cada palabra. 300-500 ms de release para diálogo es lo que suena natural.

**El ducking no reemplaza al arreglo.** Si la música vive en 500 Hz-2 kHz y el diálogo también, hay que duckear tanto que se escucha. La solución es dejar ese rango libre en el arreglo (ver `/music-composition`, orquestación production-aware). El ducking es el ajuste fino, no la solución estructural.

**Sidechain vs ducking por evento:** el ducking por evento (el middleware baja el bus cuando el evento está activo) es más predecible y más barato. El sidechain real (detectar la señal) responde mejor a diálogo de duración variable. Para VO grabado, ducking por evento alcanza.

## Frequency masking

Dos sonidos que ocupan la misma banda compiten, y el más fuerte gana. El EQ correctivo adelgaza todo; la solución es la **asignación de bandas** del audio bible.

Cuando ya está producido y hay que arreglarlo:

| Problema | Arreglo de mezcla |
|---|---|
| Diálogo tapado por música | EQ dinámico en Music: hueco en 1-3 kHz solo cuando hay VO |
| Impactos sin peso | High-pass en Music y Ambience por debajo de 80 Hz |
| Mix barroso | High-pass en todo lo que no necesita graves; casi nada necesita por debajo de 60 Hz |
| UI perdido | Reducir el brillo de la percusión, no subir el UI |
| Todo suena chico | Demasiadas fuentes; el problema es voice count, no EQ |

## Mix states

Snapshots de la mezcla que se activan por contexto. El mix dinámico es lo que hace que un juego suene "bien mezclado" en situaciones que nadie mezcló a mano.

| Estado | Qué cambia |
|---|---|
| Exploration | Base |
| Combat | Player y World arriba, Ambience abajo |
| Cutscene | Voice arriba, todo lo demás abajo, sin UI |
| Menu (pausa) | Todo salvo UI y Music muy abajo o silenciado |
| Low health | Filtro en Music, tinnitus, resto atenuado |
| Death | Corte o filtro extremo |

**Interpolar entre estados**, nunca saltar. 200-500 ms según qué tan dramático sea el cambio. Y definir qué pasa si dos estados quieren activarse a la vez: prioridad explícita.

## Headroom y loudness

**Headroom:** dejar margen en el master para que los picos simultáneos no clippeen. El mix se hace apuntando a que el caso peor (explosión + música + diálogo) tenga espacio, no el caso promedio.

**Targets de loudness.** La referencia de industria en juegos es **ASWG-R001** (Sony), que es la única especificación de una plataforma mayor:

| Contexto | Loudness promedio | True peak máximo |
|---|---|---|
| Consola / home | **−23 LUFS** (±2) | **−1 dBTP** |
| Portable / handheld | **−18 LUFS** | −1 dBTP |

El target portable es más alto porque se juega en ambientes ruidosos y con speakers chicos.

Notas de aplicación:
- La medición es del **programa completo en gameplay representativo**, no de un asset aislado
- Verificar los targets vigentes de cada plataforma antes de certificación: las recomendaciones se revisan (el promedio de ASWG estuvo también citado como −24 LKFS)
- El true peak de −1 dBTP deja margen para la codificación lossy, que puede generar picos por encima del valor medido en PCM

---

## Proceso

1. **Definir la jerarquía de buses** con sus volúmenes base y controles de usuario
2. **Definir reglas de ducking** con attack/release y cuánto
3. **Definir mix states** con sus transiciones y prioridades
4. **Verificar masking** contra la frequency allocation del bible
5. **Definir targets de loudness** por plataforma y cómo se van a medir
6. **Escribir** — preguntar "¿Escribo el diseño de mezcla a `<path>`?" antes de usar Write

### Verificación

El mix se valida **jugando**, en el caso peor: máxima densidad de enemigos, con diálogo, con música de combate, en el dispositivo más chico del target. Si ahí se entiende el diálogo y se lee el feedback del jugador, el mix funciona.

---

## Verdict

- **COMPLIANT** — buses definidos, ducking con release más largo que attack, mix states interpolados con prioridad, y loudness medido dentro del target de cada plataforma
- **CONCERNS** — la estructura existe pero el loudness no se midió en gameplay real, o el ducking está tapando un problema de arreglo
- **NON-COMPLIANT** — el loudness está fuera del target de plataforma, o hay clipping en el caso peor

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-audit` para medir loudness, picos y voice count en gameplay real
- `/middleware-integration` para implementar buses, ducking y states
- `/ui-sound-design` para el nivel del bus UI
- `/music-composition` si el masking se tiene que resolver en el arreglo y no en la mezcla
