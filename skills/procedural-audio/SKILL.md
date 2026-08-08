---
name: procedural-audio
description: "Audio procedural: footsteps, viento, ambientes y superficies por sintesis en vez de samples. Decidir cuando conviene, disenar el modelo y presupuestar CPU. Usar para: sonido procedural, footsteps sinteticos, ambiente generativo, reducir memoria de audio."
category: "audio"
argument-hint: "[decide | footsteps | wind | ambience | budget]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# procedural-audio — Síntesis en vez de Samples

Resuelve por generación los sistemas de audio donde samplear no escala: alta frecuencia de disparo cruzada con muchas dimensiones de variación.

## Cuándo usar

- El conteo de assets explota: superficies × intensidades × variantes
- El presupuesto de memoria no da para la variación que el sistema necesita
- La repetición se escucha aunque haya muchas variantes
- El sonido tiene que responder de forma continua a un parámetro (velocidad, material, tamaño)

## Cuándo NO usar

Síntesis no es gratis: cuesta CPU por frame y trabajo de tuning. No la uses para sonidos hero (el arma principal, el tema de victoria) — ahí un sample bien diseñado gana en calidad y control. La síntesis rinde en lo frecuente y variable, no en lo memorable y único.

---

## Modos

| Modo | Qué hace |
|---|---|
| `decide` | Solo la evaluación: ¿conviene sintetizar o samplear? Cuenta de assets y presupuesto |
| `footsteps` | Diseña el modelo de pasos con resonancias por superficie |
| `wind` | Diseña el modelo de viento por capas |
| `ambience` | Diseña el ambiente híbrido: bed sampleado + detalle procedural |
| `budget` | Solo el presupuesto de CPU y dónde corre cada modelo |

## La decisión

Evaluar dos ejes: **frecuencia de disparo** y **dimensiones de variación**.

| | Pocas dimensiones | Muchas dimensiones |
|---|---|---|
| **Baja frecuencia** | Sample. Siempre | Sample con layer swapping |
| **Alta frecuencia** | Sample + round-robin | **Procedural** |

El caso canónico: footsteps sobre 6 superficies × 3 intensidades, con 20 variantes cada uno, son **360 archivos (~180 MB)** — y a pesar de eso la repetición se escucha en sesiones largas. Un modelo procedural son **~50 KB** y variación infinita.

Antes de comprometerte, hacé la cuenta explícita:

```
assets = superficies × intensidades × variantes
memoria ≈ assets × tamaño_promedio
```

Si el resultado es de tres dígitos en archivos, la síntesis ya se justifica sola.

---

## Presupuesto de CPU

Esto es lo que decide si el modelo entra o no. Costos de referencia por fuente:

| Operación | Costo |
|---|---|
| Footstep procedural | ~1-2 ms |
| Síntesis de viento | ~0.5 ms/frame |
| Convolución HRTF (512 taps) | ~2 ms/fuente |
| Encode ambisónico | ~0.1 ms/fuente |
| Decode ambisónico a binaural | ~1 ms total |

**El presupuesto total de audio es 5-10% del frame time.** A 60 fps el frame son 16.6 ms, así que el audio entero dispone de ~0.8-1.7 ms. Un footstep procedural de 1-2 ms **no entra en un solo frame**: hay que amortizarlo (generar por adelantado, cachear el resultado, o generar en un thread de audio con buffer).

Ese es el error de cálculo más común: leer "1-2 ms por footstep" y asumir que se puede hacer inline en el update. En un callback de audio de 5-10 ms a 48 kHz / 512 samples hay margen; en el frame de render no.

---

## Modelo de footsteps

Tres componentes, cada uno con parámetros expuestos:

1. **Impacto** — burst de ruido filtrado en la frecuencia de resonancia del material, envolvente muy corta
2. **Resonancia del material** — filtro resonante en la frecuencia característica
3. **Textura** — ruido con envolvente más larga: grava que se mueve, hojas, agua

**Frecuencias de resonancia por superficie:**

| Superficie | Frecuencia | Textura |
|---|---|---|
| Concreto | 150 Hz | Mínima, ataque seco |
| Madera | 250 Hz | Resonancia larga, crujido |
| Metal | 500 Hz | Cola muy larga, armónicos |
| Grava | 300 Hz | Ruido dominante, larga |

**Parámetros de entrada** desde gameplay, todos normalizados 0-1:

| Parámetro | Efecto |
|---|---|
| Material | Selecciona frecuencia y perfil de textura |
| Intensidad (velocidad) | Amplitud, brillo, duración del ataque |
| Peso del personaje | Frecuencia base, cantidad de sub |
| Humedad de superficie | Capa de agua, amortiguación de la resonancia |

La variación sale de randomizar levemente cada parámetro por paso, no de elegir entre archivos. Eso es lo que hace la variación infinita.

## Modelo de viento

Ruido filtrado con modulación lenta, en capas:

- **Base** — ruido rosa con low-pass, cutoff modulado lento (0.05-0.2 Hz)
- **Ráfagas** — amplitud modulada por ruido de baja frecuencia, con picos ocasionales
- **Silbido** — filtro resonante en 800 Hz-2 kHz, solo cuando la intensidad supera un umbral
- **Detalle** — high-pass sutil que aparece con la intensidad

Parámetro principal: intensidad 0-1, mapeada a cutoff, profundidad de modulación y presencia de silbido. Un solo parámetro maneja de brisa a tormenta.

## Ambientes

La síntesis pura de ambiente suele sonar sintética. El enfoque híbrido gana:

- **Bed** — sample loopeado largo (el único sample del sistema)
- **Detalle** — one-shots posicionados por lógica procedural: qué sonido, cada cuánto, desde dónde
- **Modulación** — filtro y volumen del bed manejados por parámetros de entorno (interior/exterior, clima, hora)

La sensación de "vivo" viene de la **distribución temporal y espacial** de los detalles, no de sintetizarlos. Un pájaro sampleado que aparece en posiciones y momentos impredecibles suena más vivo que uno sintetizado en loop fijo.

---

## Proceso

1. **Hacer la cuenta** de assets y memoria; si no justifica, parar y usar samples
2. **Presupuestar CPU** contra el 5-10% del frame, y decidir dónde corre (frame vs thread de audio vs precomputado)
3. **Diseñar el modelo** por componentes con parámetros expuestos
4. **Mapear los parámetros** de gameplay, normalizados y clampeados en el boundary
5. **Definir el fallback** — qué suena si el modelo se desactiva por presupuesto en plataforma baja
6. **Escribir** — preguntar "¿Escribo el diseño a `<path>`?" antes de usar Write

### Fallback obligatorio

Toda plataforma tiene un piso. Si el modelo procedural no entra en la plataforma más baja del target, hace falta un camino de samples reducido. Decidirlo en el diseño, no cuando falla la certificación.

---

## Verdict

- **READY** — la cuenta justifica la síntesis, el presupuesto de CPU cierra con dónde corre, los parámetros están mapeados y hay fallback
- **CONCERNS** — el modelo está diseñado pero el presupuesto de CPU no se verificó en la plataforma más baja, o falta el fallback
- **BLOCKED** — no está claro el conteo de assets ni la frecuencia de disparo, así que no se puede decidir si conviene

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/sfx-design` para los sonidos hero, que siguen siendo samples
- `/audio-audit` para medir el costo real de CPU en runtime, no el estimado
- `/middleware-integration` para exponer los parámetros como RTPCs
- `/spatial-audio` si las fuentes procedurales además se posicionan en 3D
