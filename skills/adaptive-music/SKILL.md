---
name: adaptive-music
description: "Musica interactiva para juegos: layering vertical, re-secuenciacion horizontal, stingers, reglas de transicion con sync points, y mapeo de estados de gameplay a musica. Usar para: musica adaptativa, sistema de musica dinamica, transiciones musicales, combat music."
category: "audio"
argument-hint: "[design|layers|transitions|stingers|map]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# adaptive-music — Sistemas de Música Interactiva

Diseña el sistema que decide **qué música suena cuándo** y **cómo pasa de un estado a otro sin que se escuche la costura**.

Esta skill diseña el sistema. El material musical lo escribe `/music-composition`; la implementación en middleware la baja `/middleware-integration`.

## Cuándo usar

- Cuando la música tiene que responder a gameplay y no alcanza con reproducir un track
- Cuando las transiciones entre estados (exploración → combate → victoria) suenan a corte
- Cuando el loop fatiga y necesitás variación estructural, no otro track
- Antes de que el compositor escriba una nota: el sistema condiciona cómo se compone

## Modos

| Modo | Qué hace |
|---|---|
| `design` | El sistema completo: eje dominante, capas/segmentos, matriz, stingers, parámetros |
| `layers` | Solo la arquitectura vertical: qué capas, qué rol, qué restricción compositiva |
| `transitions` | Solo la matriz de transiciones con sync points y segmentos de transición |
| `stingers` | Solo los stingers: armonía, sincronización, cooldown |
| `map` | Solo la tabla estado de gameplay → música, con triggers e histéresis |

## Input

1. Leer audio bible, sección 2 (emotional targets por game state) y 6 (music direction). Si no existe, avisar y ofrecer `/audio-bible`
2. Listar los estados de gameplay reales — del código o del GDD, no inventados
3. Preguntar al usuario: middleware target (Wwise / FMOD / engine nativo / sin definir), budget de memoria para música, y si hay material compuesto o se parte de cero

---

## Los dos ejes

Todo sistema de música adaptativa es una combinación de estos dos. Elegir cuál domina es la primera decisión.

### Vertical — layering

Un mismo bloque temporal, capas que entran y salen. Todas suenan sincronizadas porque comparten grid y armonía.

- **Fuerte en:** respuesta inmediata a parámetros continuos (proximidad de enemigo, salud, intensidad de combate)
- **Débil en:** cambiar de material. Todo suena a la misma pieza
- **Costo:** memoria (N stems simultáneos) y una restricción compositiva real — cada capa debe funcionar sola y en toda combinación

### Horizontal — re-secuenciación

Segmentos distintos que se concatenan según reglas, con transiciones en puntos musicalmente válidos.

- **Fuerte en:** cambiar de material y de forma; estructura no repetitiva
- **Débil en:** respuesta inmediata. La transición espera el sync point
- **Costo:** latencia de respuesta (hasta un compás o más) y complejidad de reglas

**Recomendación:** vertical para intensidad continua, horizontal para cambios de estado discretos. La mayoría de los juegos necesitan los dos: capas dentro de cada segmento, re-secuenciación entre segmentos.

---

## Sync points — dónde se puede cortar

Una transición suena bien o mal según **dónde** ocurre, no según el crossfade. De más responsivo a más musical:

| Sync point | Latencia | Cuándo usarlo |
|---|---|---|
| **Inmediato** | 0 | Emergencias (muerte del jugador). Suena a corte, y a veces eso está bien |
| **Siguiente beat** | hasta 1 beat | Reacción rápida que igual respeta el pulso |
| **Siguiente compás (bar)** | hasta 1 compás | El default sano para la mayoría de los casos |
| **Siguiente grid** | variable | Cuando definís una grilla más gruesa (2 o 4 compases) |
| **Exit cue** | hasta el fin del segmento | Máxima musicalidad, máxima latencia |
| **Entry cue del destino** | — | Define desde dónde arranca el segmento destino |

**Segmento de transición** — un fragmento corto que se inserta entre origen y destino. Resuelve los saltos que ningún sync point salva: cambio de tonalidad, de tempo o de métrica. Es la herramienta que más mejora un sistema y la que menos se usa.

En Wwise esto es la Transition Matrix del Music Switch Container: origen × destino, con Exit Cue del origen, Entry Cue del destino, fade in/out, y segmento de transición opcional. En FMOD el equivalente son transition regions y transition timelines. El concepto es el mismo; la nomenclatura cambia.

---

## Stingers

Frases cortas que se superponen sin interrumpir la música de fondo, sincronizadas al grid para que no suenen encima del tiempo equivocado.

- Uso: eventos puntuales que merecen puntuación musical — descubrimiento, kill, item raro, fallo
- **Deben compartir armonía con el material de fondo**, o sonar deliberadamente disonantes. Un stinger en la tonalidad equivocada es el error más audible del sistema
- Sincronizar a beat o compás, nunca inmediato
- Definir cooldown: dos stingers superpuestos suenan a error
- Si el fondo modula, el stinger necesita versiones por tonalidad o tiene que ser tonalmente neutro (percusión, cluster, ruido)

---

## Diseño del mapeo

El entregable central: la tabla estado → música.

| Estado de gameplay | Trigger | Segmento / capas | Sync point | Notas |
|---|---|---|---|---|
| Explore calm | default | bed + pulse | bar | loop indefinido |
| Explore alert | enemigo a <30 m | + harmony | beat | vuelve a calm con 5 s de histéresis |
| Combat | combate iniciado | segmento combat, todas las capas | bar | |
| Combat low health | HP < 25% | + intensity, filtro | beat | |
| Victory | combate resuelto | stinger + segmento victory | exit cue | one-shot, vuelve a explore |
| Death | HP = 0 | inmediato, corte | inmediato | |

**Parámetros continuos** aparte: qué RTPC/parámetro maneja qué, con rango normalizado y curva.

| Parámetro | Rango | Controla | Curva |
|---|---|---|---|
| `combat_intensity` | 0-1 | volumen de capa intensity | log |
| `player_health` | 0-1 | filtro low-pass sobre el bus música | lineal |

---

## Histéresis — el detalle que rompe los sistemas

Un estado que se calcula por umbral (`enemigo a <30 m`) va a oscilar cuando el jugador camine en el borde. El resultado es música entrando y saliendo cada segundo.

Toda transición basada en umbral necesita:
- **Umbrales distintos por dirección** — entra a 30 m, sale a 40 m
- **Tiempo mínimo en estado** — no se puede salir antes de N segundos
- **Debounce del trigger** — la condición tiene que sostenerse antes de contar

Sin esto, el sistema funciona en el editor y falla con un jugador real.

---

## Enfoques generativos

Cuando la variación por capas y segmentos no alcanza:

- **Selección estocástica de capas/segmentos** — la variación sale de qué combinación suena. El más barato y controlable; empezar acá siempre
- **Cadenas de Markov** — melodía estocástica entrenada sobre material propio. Preserva idioma, no genera estructura
- **L-systems / gramáticas recursivas** — generan estructura jerárquica por reescritura de reglas. Complemento de Markov, que no tiene forma
- **Restricciones armónicas** — capa de validación sobre lo generado: el generador propone, las reglas de función y voice leading filtran

La generación de notas en tiempo real tiene un techo de calidad y un riesgo de que suene mal en producción que la selección de material pregrabado no tiene. Justificar antes de ir por ahí.

---

## Proceso

1. **Listar estados reales** del gameplay, con sus triggers exactos
2. **Elegir el eje dominante** (vertical / horizontal / mixto) y justificarlo contra el budget
3. **Definir capas o segmentos** y la restricción compositiva que impone al compositor
4. **Llenar la matriz de transiciones** con sync points, y marcar dónde hace falta segmento de transición
5. **Definir stingers** con su armonía y cooldown
6. **Definir parámetros continuos** con rango y curva
7. **Agregar histéresis** a toda transición por umbral
8. **Presentar** al usuario y preguntar "¿Escribo el diseño a `<path>`?" antes de usar Write

---

## Verdict

- **READY** — la matriz está completa, todo umbral tiene histéresis, los stingers tienen armonía definida, y el compositor sabe qué restricción respetar
- **CONCERNS** — el diseño existe pero hay transiciones sin sync point, umbrales sin histéresis, o el budget de memoria no se verificó contra el número de stems
- **BLOCKED** — los estados de gameplay no están definidos, o no hay dirección musical de la cual derivar los emotional targets

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/music-composition` para escribir el material respetando las restricciones de capas
- `/middleware-integration` para implementar la matriz en Wwise/FMOD
- `/audio-mix` para el ducking entre música y diálogo
- `/audio-audit` para verificar memoria y voice count del sistema en runtime
