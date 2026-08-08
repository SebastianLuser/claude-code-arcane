---
name: sfx-design
description: "Diseno de efectos de sonido: capas attack/body/tail, variacion y round-robin, pitch randomization, layering de impactos, anti-repeticion. Usar para: disenar SFX, sonidos de impacto, armas, feedback de accion."
category: "audio"
argument-hint: "[sound-name | layers | variation | review]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# sfx-design — Diseño de Efectos

Diseña *cómo suena* un efecto: de qué capas se construye, cómo varía, y por qué se lee como el evento que representa.

`/audio-spec` escribe el contrato (qué lo dispara, con qué límites). Esta skill diseña el sonido.

## Cuándo usar

- Sonidos hero que merecen diseño individual: el arma principal, el golpe crítico, el skill definitivo
- Cuando un efecto "no se siente" y hay que diagnosticar por qué
- Cuando la biblioteca se escucha repetitiva y hay que resolver variación
- Antes de grabar o comprar assets, para saber qué buscar

## Modos

| Modo | Qué hace |
|---|---|
| `sound-name` | Diseña un efecto concreto de punta a punta |
| `layers` | Solo la anatomía por capas: qué banda ocupa cada una |
| `variation` | Solo el plan de variación: variantes, round-robin, randomización, layer swapping |
| `review` | Diagnostica un efecto existente contra la tabla de síntomas |

## Input

1. Leer audio bible (paleta, frequency allocation) y el spec del sonido si existe
2. Preguntar al usuario: qué evento representa, qué debe sentir el jugador, y si hay referencia sonora
3. Identificar la restricción: ¿este sonido suena una vez por partida o cien veces por minuto? Eso cambia todo

---

## Anatomía de un efecto

Todo efecto se lee en tres partes. Diseñarlas por separado es la diferencia entre un sonido que funciona y uno que "le falta algo":

| Capa | Duración típica | Qué comunica | Se percibe como |
|---|---|---|---|
| **Attack** | 1-20 ms | Qué material, cuánta fuerza | Impacto, precisión, "punch" |
| **Body** | 20-200 ms | Qué tamaño, qué objeto | Peso, escala |
| **Tail** | 50 ms-2 s | Dónde está, qué espacio | Ambiente, distancia, potencia |

**Diagnóstico por síntoma:**

| Síntoma | Capa culpable | Arreglo |
|---|---|---|
| "Se siente débil" | Attack sin transiente | Sumar una capa de click/crack corta y brillante |
| "No tiene peso" | Body sin graves | Sumar sub o cuerpo en 60-150 Hz |
| "Suena a sample de librería" | Tail genérico o ausente | Cola propia, o reverb del espacio real del juego |
| "Es confuso, no se lee" | Demasiadas capas peleando | Sacar capas hasta que se lea; casi siempre 3 alcanzan |
| "Se siente lento" | Attack largo | Recortar el pre-ataque; el transiente tiene que estar en los primeros ms |
| "Molesta después de un rato" | Energía en 2-6 kHz | Bajar; esa banda fatiga rápido |

## Layering

Construir por función, no por acumulación. Un impacto potente típico:

1. **Sub** (40-80 Hz) — peso físico. Corto, 60-120 ms. En un handheld no se va a oír: no puede ser la única fuente de fuerza
2. **Punch** (100-300 Hz) — el cuerpo que se percibe en cualquier speaker
3. **Crack** (2-5 kHz) — la definición y el material
4. **Tail** — el espacio

**Regla:** cada capa ocupa una banda distinta. Si dos capas pelean la misma banda, una sobra. Es el mismo principio de frequency allocation del audio bible, aplicado dentro de un solo sonido.

Cuatro capas es el techo práctico. Arriba de eso el sonido pierde legibilidad y ganás solo peso de archivo.

## Variación y anti-repetición

Un sonido sin variación se vuelve audible **como sonido** en vez de como evento. En eventos frecuentes eso pasa alrededor de los 20 minutos de juego.

Las herramientas, de más a menos efectiva:

| Técnica | Cómo | Nota |
|---|---|---|
| **Variantes reales** | 4-8 grabaciones/renders distintos | La única que varía el timbre de verdad |
| **Round-robin** | Recorrer variantes en orden, sin repetir la última | Le gana a random puro: random repite |
| **Pitch randomization** | ±2% a ±4% | ±3% es variación; ±20% cambia el objeto |
| **Volume randomization** | ±1 a ±2 dB | Sutil, siempre suma |
| **Layer swapping** | Fijar el body, rotar attack y tail | Combinatorio: 3 attacks × 3 tails = 9 sonidos con 6 assets |
| **Filtro aleatorio** | Cutoff ±10% | Último recurso, se nota poco |

**Layer swapping es la de mejor relación resultado/costo** y la menos usada. Con 4 attacks, 2 bodies y 3 tails tenés 24 combinaciones desde 9 archivos.

Si el evento es de altísima frecuencia y muchas dimensiones (footsteps sobre 6 superficies × 3 intensidades), la respuesta no es más variantes: es `/procedural-audio`.

## Estilización vs realismo

El sonido realista casi nunca es el sonido correcto. Un disparo real es un chasquido corto y poco impresionante; una puerta real suena a nada.

Criterio: el efecto tiene que comunicar **la función en el gameplay**, no la física. Si el arma hace 40 de daño y la otra 90, tienen que sonar distintas en peso aunque sean el mismo calibre. La legibilidad le gana al realismo siempre que compiten.

---

## Proceso

1. **Definir la lectura** — en una frase, qué tiene que entender el jugador al escucharlo
2. **Diseñar las capas** por función, con banda asignada a cada una
3. **Definir la variación** — cuántas variantes, qué randomización, round-robin o no
4. **Chequear contra el bible** — ¿respeta la paleta y la allocation de frecuencias?
5. **Chequear en contexto** — un sonido nunca se juzga solo: con música, ambiente y otros 10 SFX encima
6. **Escribir** — preguntar "¿Escribo el diseño a `<path>`?" antes de usar Write

### Chequeo en contexto

El error más caro del sound design es aprobar sonidos en aislamiento. Un efecto perfecto solo puede desaparecer en la mezcla o taparle el ataque a otro. Evaluar siempre con el resto sonando, y al volumen real de juego.

---

## Verdict

- **READY** — el sonido tiene lectura definida, capas por banda, plan de variación, y se validó en contexto
- **CONCERNS** — está diseñado pero no se probó con el resto del mix, o la variación no alcanza para su frecuencia de uso
- **BLOCKED** — no está claro qué evento representa o falta la dirección del audio bible

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-spec` para formalizar el contrato del evento (concurrencia, cooldown, prioridad)
- `/procedural-audio` si el conteo de variantes se vuelve inmanejable
- `/audio-mix` para ubicarlo en la jerarquía de buses
- `/middleware-integration` para implementar el round-robin y la randomización en containers
