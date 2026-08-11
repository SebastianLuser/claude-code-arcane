---
name: voice-pipeline
description: "Pipeline de voz: script de VO, casting, sesiones de grabacion, naming y batch processing, localizacion, lipsync y barks. Usar para: dialogo grabado, voice over, doblaje, localizacion de voz, gestion de assets de VO."
category: "audio"
argument-hint: "[script | casting | naming | loc | barks]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# voice-pipeline — Voz y Localización

Gestiona el ciclo completo de voz grabada: del script al asset integrado y localizado.

La voz es el área de audio donde los errores son **más caros**: rehacer una sesión de grabación cuesta dinero y agenda de actores, y un error de naming multiplicado por 12 idiomas es inmanejable a mano.

## Cuándo usar

- Preparar un script de VO para grabación
- Definir naming y estructura antes de recibir assets
- Planificar localización a varios idiomas
- Gestionar barks (chatter de combate) y su variación
- El pipeline de VO se desordenó y hay que reorganizarlo

## Input

1. Leer audio bible (dirección de voz si existe) y el guion narrativo
2. Determinar: cuántos idiomas, cuántos personajes, si hay lipsync
3. Preguntar al usuario: presupuesto de grabación, si hay actores ya contratados, y plataforma de destino

---

## Naming — la decisión más importante

**El naming se define antes de grabar una sola línea.** Renombrar 4.000 archivos × 12 idiomas después no es una tarea, es un proyecto.

Patrón recomendado:

```
vo_<personaje>_<contexto>_<id>_<variante>
vo_kira_combat_taunt_003_a
vo_kira_story_ch02_017
```

**Requisitos del patrón:**
- **ID estable y único** — nunca se reusa, ni si la línea se corta. Los huecos son gratis; renumerar no
- **Sin espacios ni acentos** — sobrevive a cualquier filesystem y a batch scripts
- **El idioma NO va en el nombre del archivo** — va en la ruta o en el bank de idioma. Así el mismo nombre resuelve en cualquier locale
- **Ordenable alfabéticamente** en el orden en que se usa
- **Longitud acotada** — algunas plataformas tienen límites de path

El ID es la llave que une script, sesión de grabación, asset, subtítulo y traducción. Si cambia en algún punto, el vínculo se rompe.

## Script de VO

Lo que el actor y el director necesitan por línea:

| Campo | Por qué |
|---|---|
| **ID** | La llave de todo el pipeline |
| **Personaje** | |
| **Texto** | Exacto, es lo que se graba y se subtitula |
| **Contexto** | Qué pasó antes; sin esto la actuación es a ciegas |
| **Dirección** | Emoción, intensidad, a quién le habla |
| **Restricción de duración** | Si tiene que calzar en una animación o un hueco de gameplay |
| **Tomas pedidas** | Cuántas variantes de intención |

**El contexto es lo que más se omite y lo que más arruina sesiones.** Un actor grabando líneas sueltas en orden alfabético, sin saber a quién le habla ni qué acaba de pasar, entrega material que no sirve y hay que volver a convocarlo.

**Orden de grabación:** por personaje y por escena, no por ID. Agrupar además por intensidad emocional — dejar los gritos para el final de la sesión, porque desgastan la voz y arruinan lo que venga después.

## Casting

- **Rango, no solo timbre** — el personaje que grita en el acto tres necesita un actor que pueda gritar sin perder la voz
- **Distinguibilidad** — dos personajes que suenan parecido confunden en un juego donde el jugador no siempre ve quién habla. Test: escuchar sin ver
- **Disponibilidad para pickups** — siempre hay pickups. Un actor imposible de reconvocar es un riesgo de producción
- **Consistencia entre idiomas** — el casting de localización debería mantener el *rol tímbrico*, no imitar al actor original

## Barks

El chatter de combate tiene reglas propias porque se escucha muchísimo:

- **Muchas variantes por intención** — mínimo 5-8 por tipo. Un bark repetido es lo primero que el jugador nota
- **Cortos** — 0.5 a 2 s. Un bark largo se pisa con el gameplay
- **Cooldown global por personaje y por tipo** — dos enemigos gritando lo mismo a la vez suena a bug
- **Prioridad baja** — un bark nunca debe tapar diálogo narrativo ni feedback del jugador
- **Bus separado** de `Dialogue` para que no duckeen la música (ver `/audio-mix`)
- **Interrumpibles** — si el personaje muere a mitad del bark, se corta

## Localización

| Decisión | Recomendación |
|---|---|
| Estructura | Un bank o carpeta por idioma, mismos nombres de archivo adentro |
| Idioma en runtime | Se resuelve cargando el bank del locale, sin lógica en gameplay |
| Fallback | Idioma base si falta el asset — nunca silencio |
| Expansión de texto | El alemán y el español crecen 20-35% sobre el inglés: los huecos de tiempo tienen que tolerarlo |
| Subtítulos | Mismo ID que el audio. Un ID sin subtítulo es un bug de accesibilidad |
| Sin doblar | Idiomas con subtítulo solo: definir explícitamente cuáles y que la mezcla lo contemple |

**La expansión de texto es el problema práctico más común.** Una línea que calza justo en inglés se pasa 30% en alemán, y si hay una animación fija o un hueco de gameplay, no entra. Presupuestar el hueco contra el idioma más largo del target, no contra el inglés.

## Procesamiento por lotes

El VO llega en crudo y necesita el mismo tratamiento en miles de archivos. Lo que debe ser automatizado, no manual:

1. **Recorte de silencios** con umbral consistente
2. **Normalización de loudness** a un target común
3. **De-noise / de-click** si la fuente lo pide
4. **Fades** de entrada y salida cortos
5. **Verificación**: sample rate, bit depth, canales, duración vs restricción
6. **Reporte** de los que no cumplen

El paso 5 y 6 son los que hay que exigir: sin verificación automática, los assets que no cumplen se descubren en integración.

## Lipsync

- **Basado en fonemas** (extraído del audio o del texto) o **basado en amplitud** (más barato, mucho peor)
- Si hay lipsync, el **texto tiene que coincidir exactamente** con lo grabado — una improvisación del actor rompe la sincronía
- La localización necesita lipsync regenerado por idioma, o aceptar el desfasaje explícitamente
- Los pickups tienen que regenerar el lipsync de la línea afectada

---

## Proceso

1. **Definir el naming** y congelarlo. Este paso primero, sin excepción
2. **Armar el script** con contexto y dirección por línea
3. **Planificar las sesiones** por personaje/escena, con los gritos al final
4. **Definir la estructura** de localización y el fallback
5. **Definir el pipeline** de batch con su paso de verificación
6. **Definir barks** con variantes, cooldown y bus
7. **Escribir** — preguntar "¿Escribo el pipeline a `<path>`?" antes de usar Write

---

## Verdict

- **READY** — naming congelado, script con contexto y dirección, estructura de localización con fallback, pipeline de batch con verificación automática
- **CONCERNS** — el pipeline existe pero el script no tiene contexto por línea, o la expansión de texto no se presupuestó, o los barks no tienen cooldown
- **BLOCKED** — el naming no está definido: cualquier grabación antes de eso genera trabajo que se va a rehacer

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-mix` para el bus de diálogo y el ducking
- `/audio-spec` para el contrato de eventos de barks (concurrencia y cooldown)
- `/audio-audit` para verificar los assets entregados contra el spec
- `/middleware-integration` para los banks de idioma
