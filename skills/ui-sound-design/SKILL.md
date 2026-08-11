---
name: ui-sound-design
description: "Sonido de interfaz y feedback: duraciones y niveles por tipo de evento, jerarquia de feedback, coordinacion con haptics, respeto del volumen del sistema, accesibilidad. Usar para: sonidos de UI, feedback de menu, notificaciones, sonido de app."
category: "audio"
argument-hint: "[set | event-name | review | haptics]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# ui-sound-design — Feedback de Interfaz

Diseña el sonido que confirma acciones. Es el audio que el usuario escucha más veces y el que más rápido se vuelve molesto si está mal calibrado.

## Cuándo usar

- Definir el set de sonidos de UI de un juego o una app
- El feedback se siente molesto, invasivo o inconsistente
- Falta jerarquía: todo suena igual de importante
- Coordinar audio con haptics

## Input

1. Leer audio bible (paleta, frequency allocation, mix hierarchy)
2. Listar los eventos de UI reales de la interfaz
3. Preguntar al usuario: plataforma (desktop / consola / móvil), si hay haptics, y si el juego se juega en sesiones largas

---

## Especificaciones por tipo

Estos rangos son el punto de partida calibrado. Salirse de ellos requiere razón.

| Tipo | Duración | Carácter | Nivel |
|---|---|---|---|
| **Tap / hover** | 30-80 ms | Click suave, alta frecuencia | −24 dB |
| **Confirmación** | 80-150 ms | Transiente definido, neutro | −21 dB |
| **Éxito** | 150-300 ms | Tono ascendente, positivo | −18 dB |
| **Error** | 200-400 ms | Descendente, menor | −18 dB |
| **Notificación** | 300-800 ms | Distintivo, llama atención | −18 dB |
| **Transición / navegación** | 100-250 ms | Movimiento sutil | −24 dB |
| **Toggle** | 40-100 ms | Dos estados distinguibles | −24 dB |

**El nivel es lo que más se equivoca.** Los sonidos de UI van entre **−18 y −24 dB** relativos al material de gameplay. Un click a −3 dB compite con la acción del juego y agota en minutos.

Regla de proporcionalidad: **el nivel y la duración son proporcionales a la importancia del evento**. Un hover es lo más corto y lo más bajo. Un error de transacción es lo más largo y lo más alto. Si el hover y el error suenan parecido, no hay jerarquía.

## Frecuencia y fatiga

El feedback de UI vive en **2-6 kHz**: es donde el oído es más sensible, así que un sonido bajo se lee claro sin volumen. Es también la banda que **más rápido fatiga**.

Consecuencias de diseño:

- Transientes cortos, no tonos sostenidos: la energía breve informa sin cansar
- En un juego de sesiones largas, correr el feedback hacia abajo (1-3 kHz) reduce la fatiga a costa de algo de claridad
- Si el juego tiene mucha percusión brillante o hi-hats, el UI compite: bajar el UI no alcanza, hay que hacerle lugar en el arreglo (ver `/audio-mix`)

## Jerarquía

Tres niveles, y cada evento cae en uno:

| Nivel | Qué entra | Puede interrumpir |
|---|---|---|
| **Ambiental** | Hover, navegación, toggle | Nada. Se pierde y no importa |
| **Confirmatorio** | Tap, confirmación, éxito | Nada, pero no se debe perder |
| **Crítico** | Error, alerta, timeout | Duckea el resto |

Solo el nivel crítico duckea. Si los tres duckean, la música desaparece cada vez que el usuario navega un menú.

## Haptics

Cuando hay haptics, audio y vibración son **un solo evento percibido**. Reglas:

- **Sincronía dura:** un desfasaje mayor a ~30 ms se percibe como dos eventos separados
- **No duplicar la información:** si el haptic ya comunica la intensidad, el audio no necesita subir de nivel
- **Complementariedad de banda:** el haptic cubre lo que el speaker chico no puede dar (el sub). Diseñar el audio sin depender del grave si hay haptic
- **Respetar el ajuste del usuario:** haptics desactivado no debe dejar el evento sin feedback

## Plataforma

### Móvil — sesiones de audio

Ignorar la sesión de audio es el bug más común de audio en móvil: la app pierde el audio en una llamada y no lo recupera nunca.

| iOS `AVAudioSession` | Comportamiento |
|---|---|
| `.ambient` | Se mezcla con otro audio; el switch de silencio lo silencia |
| `.playback` | Interrumpe otro audio; ignora el switch de silencio |
| `.playAndRecord` | Para apps con voz |
| `.soloAmbient` | Default; silencia otro audio |

En Android el equivalente es AudioFocus. En los dos casos hay que manejar **interrupciones** (llamada, alarma) y **cambios de ruta** (auriculares conectados/desconectados).

**Un juego que suena en background o que ignora el switch de silencio es un rechazo de store esperando pasar.** Para un juego, `.ambient` o `.soloAmbient` según si querés dejar que el usuario escuche su música.

### Respetar el volumen del sistema

Nunca normalizar por encima del volumen del sistema ni forzar un mínimo. Si el usuario bajó el volumen, bajó el volumen.

## Accesibilidad

- El sonido de UI **nunca puede ser el único canal** de información crítica: siempre acompañado de señal visual
- Éxito y error tienen que distinguirse por **contorno melódico** (ascendente vs descendente), no solo por timbre — es lo que sobrevive a pérdida de agudos
- Ofrecer control de volumen de UI separado de música y SFX
- Los sonidos repetitivos de navegación tienen que poder desactivarse sin perder el feedback crítico

---

## Proceso

1. **Listar los eventos** de UI reales y asignar cada uno a un nivel de jerarquía
2. **Especificar** duración, carácter y nivel por evento, contra la tabla de referencia
3. **Verificar la jerarquía** — hover y crítico tienen que ser inconfundibles
4. **Definir haptics** si aplica, con sincronía y reparto de banda
5. **Definir el manejo de sesión** en móvil
6. **Chequear accesibilidad** — contorno melódico, canal redundante, controles separados
7. **Escribir** — preguntar "¿Escribo el set a `<path>`?" antes de usar Write

---

## Verdict

- **READY** — cada evento tiene nivel, duración y jerarquía; la accesibilidad está cubierta; en móvil la sesión de audio está definida
- **CONCERNS** — el set existe pero no hay jerarquía diferenciada, o el nivel está por encima de −18 dB, o falta el manejo de interrupciones
- **BLOCKED** — no está definida la lista de eventos de UI o falta la dirección del audio bible

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-mix` para el bus de UI y el ducking del nivel crítico
- `/audio-spec` para formalizar cooldowns (navegación rápida spamea el evento)
- `/audio-audit` para verificar niveles medidos contra los especificados
