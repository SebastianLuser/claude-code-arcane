---
name: spatial-audio
description: "Audio espacial: HRTF/binaural, Ambisonics, panning, curvas de atenuacion, oclusion y obstruccion, reverb por zona, y presupuesto de CPU por tecnica. Usar para: sonido 3D, audio posicional, VR audio, oclusion, decidir HRTF vs panning."
category: "audio"
argument-hint: "[decide | hrtf | ambisonics | occlusion | budget]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# spatial-audio — Audio Posicional

Decide qué técnica de espacialización usar por fuente, y presupuesta el costo. La decisión correcta casi nunca es "la mejor técnica para todo".

## Cuándo usar

- Definir la estrategia de espacialización de un juego o experiencia VR
- El audio 3D come demasiado CPU
- Las fuentes no se localizan bien, o suenan "adentro de la cabeza"
- Implementar oclusión y obstrucción
- Diseñar reverb por zona

## Input

1. Leer audio bible y el presupuesto de performance del proyecto
2. Determinar: ¿hay auriculares garantizados (VR) o hay que funcionar en speakers?
3. Contar las fuentes simultáneas esperadas por categoría
4. Preguntar al usuario: plataforma target más baja y fps objetivo

---

## Presupuesto — el número que decide todo

| Técnica | Costo |
|---|---|
| Convolución HRTF (512 taps) | **~2 ms por fuente** |
| Encode ambisónico | ~0.1 ms por fuente |
| Decode ambisónico a binaural | ~1 ms total (una vez, no por fuente) |
| Panning estéreo / vector-based | despreciable |
| Atenuación por distancia + filtro | despreciable |

**El audio entero dispone del 5-10% del frame time.** A 60 fps son 16.6 ms de frame, así que el audio tiene ~0.8-1.7 ms.

Ese número mata la idea de HRTF universal de entrada: **50 fuentes × 2 ms = 100 ms de CPU**, seis veces el frame completo. No es "costoso": es imposible.

Presupuesto realista: **3-5 fuentes con HRTF**, el resto por otras técnicas.

---

## Decisión por fuente

| Situación | Técnica | Por qué |
|---|---|---|
| 3-5 fuentes críticas, con auriculares | **HRTF** | Localización precisa, incluida elevación |
| Ambiente, campo difuso | **Ambisonics** | Costo por fuente casi nulo; un solo decode |
| Fuentes lejanas o poco importantes | **Panning + atenuación** | Gratis, e igual son indistinguibles |
| Música, UI | **2D, sin espacializar** | No tienen posición en el mundo |
| Diálogo del jugador / narrador | **2D o pseudo-3D** | Tiene que ser siempre inteligible |
| Fuentes en speakers (no auriculares) | **Panning / surround** | HRTF en speakers no funciona: asume oídos, no una sala |

**HRTF asume auriculares.** En speakers el crosstalk entre canales destruye las claves binaurales y el resultado es peor que un panning honesto. Si la plataforma no garantiza auriculares, HRTF necesita detección de ruta o queda descartado.

**Estrategia recomendada:** un presupuesto explícito de "slots HRTF" asignado por prioridad dinámica — la fuente más importante y más cercana se lleva el slot, y al alejarse lo devuelve. Todo lo demás, Ambisonics y panning.

---

## Curvas de atenuación

La atenuación es lo que más aporta a la percepción de distancia, y es gratis. Componentes:

| Componente | Qué comunica |
|---|---|
| **Volumen por distancia** | Distancia base |
| **Filtro low-pass creciente** | El aire absorbe agudos: lejano = más opaco |
| **Reducción de spread** | Cerca es ancho, lejos es puntual |
| **Aumento de reverb (wet/dry)** | Lejano = más proporción de espacio |

**Los cuatro juntos** venden la distancia mucho mejor que el volumen solo. Un sonido que solo baja de volumen se percibe como "más silencioso", no como "más lejos".

Definir siempre `min distance` (dentro de la cual no atenúa) y `max distance` (fuera de la cual no suena), y la forma de la curva. Log es lo más natural para la mayoría de las fuentes; lineal sirve cuando querés control preciso del rango audible.

## Oclusión y obstrucción

Dos fenómenos distintos que se confunden seguido:

| | Qué es | Efecto |
|---|---|---|
| **Obstrucción** | Algo bloquea el camino directo, pero el sonido reflejado llega | Baja el directo, mantiene el reverb. Se oye "alrededor" |
| **Oclusión** | Directo y reflejado bloqueados: pared sólida | Baja los dos + low-pass fuerte |

Confundirlas produce el bug clásico: un enemigo detrás de una columna se vuelve inaudible (se aplicó oclusión donde correspondía obstrucción).

**Costo:** la parte cara no es el filtro, es el raycast. Con muchas fuentes hay que:
- Limitar los raycasts por frame y repartirlos entre frames
- Cachear el resultado y actualizar con menos frecuencia que el frame
- Interpolar el valor de oclusión hacia el target, nunca aplicarlo de golpe (el salto se escucha)

## Reverb por zona

- Definir zonas con un preset de reverb cada una, y **crossfade en las transiciones** — un cambio instantáneo de reverb es muy audible
- El envío a reverb depende de la distancia (ver curvas arriba)
- Las fuentes 2D (música, UI) normalmente **no** van a reverb de zona
- La cola del reverb tiene que seguir sonando al cambiar de zona, o se corta de forma antinatural

## VR y consideraciones específicas

- **Head tracking obligatorio:** la posición de las fuentes se actualiza con la cabeza. Latencia alta rompe la ilusión y marea
- **Elevación importa:** es lo que HRTF aporta y el panning no puede
- **Auriculares garantizados:** es el único contexto donde HRTF es la elección obvia
- **Presupuesto más ajustado:** 90 fps deja ~11 ms de frame, así que el audio tiene menos margen aún

---

## Proceso

1. **Contar fuentes** simultáneas por categoría
2. **Presupuestar** contra el 5-10% del frame en la plataforma más baja
3. **Asignar técnica por categoría**, con slots HRTF explícitos y prioridad dinámica
4. **Definir curvas** de atenuación con los cuatro componentes
5. **Definir oclusión vs obstrucción** por tipo de geometría, con presupuesto de raycasts e interpolación
6. **Definir zonas** de reverb y sus transiciones
7. **Escribir** — preguntar "¿Escribo la estrategia a `<path>`?" antes de usar Write

---

## Verdict

- **READY** — cada categoría tiene técnica asignada, el presupuesto cierra en la plataforma más baja, y oclusión/obstrucción están diferenciadas
- **CONCERNS** — la estrategia existe pero el presupuesto no se midió, o HRTF se asume sin verificar que haya auriculares
- **BLOCKED** — falta el conteo de fuentes simultáneas o el presupuesto de performance del proyecto

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-audit` para medir CPU y voice count reales en runtime
- `/middleware-integration` para implementar atenuaciones, oclusión y buses de reverb
- `/procedural-audio` si las fuentes ambiente son muchas y conviene generarlas
- `/audio-mix` para el reparto de buses y el ducking del diálogo
