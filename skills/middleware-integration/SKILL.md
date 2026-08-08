---
name: middleware-integration
description: "Integracion de middleware de audio (Wwise/FMOD): containers, eventos, Switches/States/RTPCs, atenuaciones, soundbanks, streaming vs memoria, y el contrato con el codigo de gameplay. Usar para: Wwise, FMOD, event authoring, RTPC, soundbanks, arquitectura de audio."
category: "audio"
argument-hint: "[structure | events | rtpc | banks | contract]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# middleware-integration — Wwise / FMOD

Diseña la estructura del proyecto de middleware y el contrato entre el audio y el código de gameplay.

Conceptos agnósticos donde se puede; nomenclatura de Wwise como referencia principal, con el equivalente FMOD anotado, porque los dos modelan lo mismo con nombres distintos.

## Cuándo usar

- Estructurar un proyecto de Wwise/FMOD desde cero
- Definir el contrato de eventos que va a postear el código
- Diseñar la organización de soundbanks
- El proyecto de middleware creció desordenado y hay que reorganizarlo
- Decidir qué va en memoria y qué va en streaming

## Input

1. Leer `/audio-spec` (event lists), `/audio-mix` (buses) y `/adaptive-music` (matriz de transiciones) si existen
2. Determinar el middleware y su versión
3. Preguntar al usuario: plataformas target, budget de memoria de audio, y si el proyecto ya existe o se arranca limpio

---

## Equivalencias Wwise ↔ FMOD

| Concepto | Wwise | FMOD Studio |
|---|---|---|
| Unidad que dispara el código | Event | Event |
| Contenedor de variación | Random / Sequence Container | Multi-instrument, Scatterer |
| Selección por estado discreto | Switch Container | Parameter (labeled) |
| Mezcla continua entre variantes | Blend Container | Parameter con automatización |
| Parámetro continuo | RTPC (Game Parameter) | Parameter (continuous) |
| Estado global | State | Global parameter / Snapshot |
| Agrupación de mezcla | Actor-Mixer / Bus | Group bus |
| Snapshot de mezcla | State con propiedades de bus | Snapshot |
| Curva de distancia | Attenuation ShareSet | 3D panner + curvas |
| Empaquetado | SoundBank | Bank |
| Música interactiva | Music Switch / Playlist Container | Event con transition regions |

## Estructura del proyecto

Organizar por **sistema de gameplay**, no por tipo de sonido. `Weapons/Shotgun/` es navegable; `Impacts/` con todo mezclado no.

```
Actor-Mixer Hierarchy
├── Player          (locomoción, armas, voz del jugador)
├── Enemies         (por arquetipo)
├── World           (props, entorno, destructibles)
├── Ambience        (por zona)
└── UI

Interactive Music
└── (por estado: Explore, Combat, Victory...)

Events
└── (espeja la jerarquía de Actor-Mixer)
```

**Reglas que evitan el desorden:**
- Un evento por acción de gameplay, no por sonido. `Play_Weapon_Fire` con un Switch de tipo de arma le gana a un evento por arma
- Los ShareSets (atenuación, conversión, efectos) se definen una vez y se reusan. Un ShareSet por objeto es la causa número uno de proyectos inmanejables
- Work units separados por sistema: es lo que permite que dos personas trabajen sin conflictos de merge

## Containers

| Container | Cuándo | Cuidado |
|---|---|---|
| **Random** | Variación de un mismo sonido | Usar *shuffle* (round-robin), no random puro: random repite |
| **Sequence** | Sonidos que tienen orden (carga → disparo) | Definir qué pasa al interrumpir |
| **Switch** | Selección por estado discreto (superficie, tipo de arma) | Definir el default: si el Switch no está seteado, el evento no suena |
| **Blend** | Mezcla continua por parámetro (RPM de motor) | Cuidar el solapamiento de las curvas o hay huecos |

## Switches, States y RTPCs

Tres cosas distintas, y confundirlas es un error de arquitectura frecuente:

| | Alcance | Tipo | Ejemplo |
|---|---|---|---|
| **Switch** | Por objeto de juego | Discreto | Superficie bajo *este* personaje |
| **State** | Global | Discreto | El juego está en pausa |
| **RTPC** | Global o por objeto | Continuo | Salud del jugador, intensidad de combate |

**Regla:** si es una propiedad de un objeto específico, es Switch. Si es una condición del juego entero, es State. Si es un número que varía suave, es RTPC.

Usar un State para algo que es por objeto es el bug que produce "todos los personajes caminan sobre la superficie del jugador".

**Contrato de RTPCs:** todo RTPC necesita rango declarado, curva, y valor por default. El código **normaliza y clampea antes de enviarlo** — el middleware no debería recibir nunca un valor fuera de rango.

## Soundbanks

Estrategia por defecto que funciona en la mayoría de los proyectos:

| Bank | Contenido | Cuándo carga |
|---|---|---|
| `Init` | Estructura del proyecto, buses | Al arrancar, siempre |
| `Global` | UI, voz del jugador, música persistente | Al arrancar, siempre |
| `Level_XX` | Ambiente y props del nivel | Al cargar el nivel |
| `Character_XX` | Por personaje/enemigo | Con el spawn del personaje |

**Streaming vs memoria:**

| Va en memoria | Va en streaming |
|---|---|
| Todo lo corto y frecuente (SFX, UI, footsteps) | Música |
| Cualquier cosa que necesite latencia cero | Diálogo largo |
| | Ambientes largos |

El streaming ahorra memoria y cuesta latencia y accesos a disco. Un SFX en streaming llega tarde; la música en memoria se come el budget.

**Prefetch** para lo streameado que necesita arrancar rápido: los primeros ms van en memoria y el resto se stremea.

## Contrato con el código

Lo que el código tiene que poder hacer, y nada más:

```
PostEvent(eventName, gameObject)      → dispara
StopEvent(playingId, fadeMs)          → detiene lo que loopea
SetSwitch(group, value, gameObject)   → propiedad de objeto
SetState(group, value)                → condición global
SetRTPC(param, value01, gameObject?)  → parámetro, normalizado
RegisterGameObject / Unregister       → ciclo de vida
```

**Reglas del contrato** (las mismas que enforcea `rules/gamedev/audio-code.md`):

- Gameplay **nunca** referencia assets, solo nombres de evento
- Todo loop tiene un stop explícito, y se detiene al destruirse el objeto dueño
- Los RTPCs llegan normalizados y clampeados
- Un evento que falla (bank no cargado) **no rompe el frame**: degrada en silencio
- Registrar y des-registrar game objects es obligatorio — objetos filtrados son un leak clásico

## Profiling

El middleware trae el profiler, y es la única fuente de verdad sobre lo que pasa en runtime:

- **Voces activas** vs el límite configurado, y qué se está descartando
- **CPU de audio** contra el 5-10% del frame
- **Memoria** por bank y total
- **Valores de RTPC en vivo** — sirve para descubrir que el código manda un rango equivocado
- **Árbol de contribución de voz** — por qué un sonido se oye más o menos de lo esperado
- Capturas exportables para análisis offline

Para profilear objetos de juego hay que tener la captura activa en la vista de Game Object antes de disparar los eventos, o no se registra nada.

---

## Proceso

1. **Definir la jerarquía** por sistema de gameplay, con work units separados
2. **Crear los ShareSets** de atenuación y conversión antes de los objetos, para que se reusen
3. **Autorear los eventos** desde la event list de `/audio-spec`, uno por acción
4. **Definir Switch/State/RTPC** con su alcance correcto, rango y default
5. **Diseñar los buses** desde `/audio-mix`
6. **Definir los banks** y qué va en streaming
7. **Documentar el contrato** para el equipo de código
8. **Escribir** — preguntar "¿Escribo la arquitectura a `<path>`?" antes de usar Write

### Nota sobre automatización

Wwise expone WAAPI y FMOD tiene su API de scripting, así que la autoría en batch es automatizable. Hay servidores MCP de terceros que exponen WAAPI a un agente, pero al momento de escribir esto el más completo se declara **EXPERIMENTAL y explícitamente no recomendado para proyectos de producción**. Si querés explorarlo, hacelo en un proyecto de prueba, nunca sobre el proyecto real.

---

## Verdict

- **READY** — jerarquía por sistema, ShareSets reusados, cada parámetro con el alcance correcto, banks definidos, contrato documentado
- **CONCERNS** — la estructura existe pero hay ShareSets duplicados, parámetros con alcance equivocado (State donde va Switch), o banks sin estrategia de carga
- **BLOCKED** — falta la event list de `/audio-spec` o la estructura de buses de `/audio-mix`

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-audit` para profilear voces, CPU y memoria en runtime
- `/adaptive-music` si falta la matriz de transiciones de música
- `/audio-spec` si la event list no existe todavía
