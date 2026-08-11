---
name: audio-spec
description: "SFX spec sheets y audio event lists: trigger, prioridad, concurrencia, cooldown, variaciones, propiedades espaciales. Usar para: especificar sonidos, event list por sistema, brief para sound designer."
category: "audio"
argument-hint: "[system-name | all | events]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# audio-spec — SFX Specs & Event Lists

Convierte dirección sonora en especificaciones que un sound designer externo puede producir sin más briefing, y en event lists que un programador puede implementar sin adivinar.

Dos entregables distintos y complementarios:
- **Spec sheet** — describe *el sonido*: cómo suena, cuánto dura, cuántas variantes
- **Event list** — describe *el contrato*: qué lo dispara, con qué prioridad, cuántas instancias, qué parámetros recibe

## Cuándo usar

- Después de `/audio-bible` (la dirección tiene que existir primero)
- Cuando vas a tercerizar producción de SFX y necesitás un brief cerrado
- Cuando el código necesita saber qué eventos postear antes de que existan los assets
- Antes de `/middleware-integration` — la event list es su input

## Modos

| Modo | Qué hace |
|---|---|
| `system-name` | Especifica un sistema concreto: spec sheets + event list de, por ejemplo, `combat` |
| `all` | Barre todos los sistemas del proyecto, uno por vez |
| `events` | Solo la event list, sin spec sheets. Para cuando el código necesita el contrato antes de que existan los assets |

## Input

1. Leer audio bible (paleta, frequency allocation, mix hierarchy, standards). Si no existe, avisar y ofrecer `/audio-bible` primero
2. Identificar el sistema a especificar (combate, locomoción, UI, ambiente, props...) o `all`
3. Leer el código/GDD del sistema para extraer los momentos que piden sonido
4. Preguntar al usuario: nivel de detalle (spec completo vs event list sola) y si hay assets existentes que reusar

---

## Spec sheet — campos obligatorios

Cada sonido lleva estos campos. Un campo vacío es una decisión que alguien va a tomar por vos:

| Campo | Qué define | Ejemplo |
|---|---|---|
| **ID** | Nombre canónico, matchea naming del bible | `sfx_weapon_shotgun_fire` |
| **Descripción** | Qué es, en una línea funcional | Disparo de escopeta de doble caño, seco, sin cola de reverb |
| **Referencias** | 1-3 sonidos concretos con qué tomar de cada uno | — |
| **Carácter frecuencial** | Dónde vive, contra la allocation del bible | Sub-punch 50-70 Hz + crack 3-5 kHz, vacío en mids |
| **Duración** | Rango, no valor único | 180-260 ms |
| **Envolvente** | Attack / body / tail explícitos | Attack <5 ms, body 60 ms, tail 120 ms |
| **Rango de volumen** | Nivel relativo a la categoría | −6 dB a −3 dB del bus SFX |
| **Propiedades espaciales** | 2D/3D, curva de atenuación, min/max distance | 3D, 2-40 m, log |
| **Variaciones** | Cuántas variantes y qué randomización | 5 variantes, pitch ±3%, volumen ±1.5 dB |
| **Prioridad** | Qué se cae primero bajo presión de voces | Alta (feedback de acción del jugador) |

## Event list — campos obligatorios

| Campo | Qué define |
|---|---|
| **Evento** | Nombre que postea el código |
| **Trigger** | Condición exacta de gameplay que lo dispara |
| **Sonidos** | Qué IDs de spec resuelve (uno o un container) |
| **Concurrencia** | Máximo de instancias simultáneas + qué hacer al exceder (drop oldest / drop newest / reject) |
| **Cooldown** | Mínimo entre disparos, para eventos que pueden spamearse |
| **Parámetros** | RTPCs que recibe, con rango normalizado |
| **Stop condition** | Cómo termina: one-shot, loop con stop explícito, o fade |

**Concurrencia y cooldown no son opcionales.** Son la diferencia entre un sistema que sobrevive 40 enemigos en pantalla y uno que satura el voice budget. Todo evento que puede dispararse más de una vez por frame necesita ambos.

---

## Proceso

1. **Barrer el sistema** — listar cada momento que pide sonido, incluyendo los negativos (dónde el silencio es la decisión)
2. **Agrupar** — sonidos que comparten carácter van juntos; identificar qué puede ser variación de un mismo asset en vez de asset nuevo
3. **Draftar** specs y event list del grupo
4. **Presentar** al usuario para review
5. **Escribir** — preguntar "¿Escribo el spec de `<sistema>` a `<path>`?" antes de usar Write

No batchear sistemas: cerrar uno antes de abrir el siguiente.

### Reducción de assets

Antes de especificar N sonidos nuevos, preguntar si el caso se resuelve con variación o con síntesis. El caso canónico: 20 samples × 6 superficies × 3 intensidades = 360 archivos (~180 MB) vs footsteps procedurales (~50 KB) con variación infinita. Si el sistema es de alta frecuencia y muchas dimensiones, derivar a `/procedural-audio` antes de escribir el spec.

---

## Verdict

Por sistema especificado:

- **READY** — todo sonido tiene los 10 campos, todo evento tiene concurrencia y cooldown. Un externo puede producir y un programador puede implementar
- **CONCERNS** — hay campos vacíos o eventos sin límites; listar cuáles
- **BLOCKED** — falta el audio bible, o el sistema de gameplay no está definido lo suficiente para saber qué momentos existen

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/middleware-integration` para implementar la event list en Wwise/FMOD
- `/procedural-audio` para los sistemas de alta frecuencia que no conviene samplear
- `/sfx-design` para profundizar el diseño de los sonidos hero
- `/audio-audit` para verificar los assets entregados contra el spec
