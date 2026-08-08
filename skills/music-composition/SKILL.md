---
name: music-composition
description: "Composicion musical: armonia, melodia, forma, groove, orquestacion. Traduce problemas creativos vagos en movimientos compositivos concretos con cifrados, grados de escala y voicings. Usar para: progresiones, melodias, modulacion, arreglo, analisis musical. NO genera audio ni MIDI ni opera DAW."
category: "audio"
argument-hint: "[harmony|melody|form|groove|orchestration|analyze]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# music-composition — Decisiones Musicales

Resuelve problemas de composición con salida accionable: cifrados concretos, melodías en grados de escala, bocetos de groove, voicings específicos.

**La teoría es un mapa de efectos posibles, no una lista de mandamientos.** Cada técnica se presenta con *qué efecto produce* y *por qué*, para que la elección sea informada y no obediente.

## Alcance

**Sí:** armonía, melodía, contrapunto, ritmo/groove, forma, orquestación, idioma instrumental, análisis, songwriting.

**No:** generar archivos MIDI (→ `/midi-compose`), generar audio, operar DAW, mixing/mastering (→ `/audio-mix`), sound design (→ `/sfx-design`), notación en Sibelius/Dorico.

## Cuándo usar

- Problemas técnicos: "qué escala va sobre Cm7", "cómo modulo de C a Eb"
- Problemas de craft: "esta melodía no se pega", "el estribillo se siente flojo"
- Problemas vagos: "la transición es incómoda", "suena genérico" — traducirlos a movimientos compositivos es exactamente el trabajo de esta skill
- Música de juego: temas, variaciones, material que después se vuelve adaptativo

---

## Método

### 1. Traducir el problema

El usuario casi nunca llega con vocabulario técnico. Antes de proponer nada, convertir la queja en un diagnóstico:

| Queja | Diagnóstico probable | Dónde mirar |
|---|---|---|
| "El estribillo se siente flojo" | No hay contraste de registro/densidad/ritmo armónico con la estrofa | `references/form.md` |
| "Suena genérico" | Progresión y ritmo armónico predecibles, melodía sin perfil | `references/harmony.md`, `references/melody.md` |
| "No se me pega" | Falta un gesto repetible: motivo corto, salto identificable, ritmo asimétrico | `references/melody.md` |
| "La transición es incómoda" | Salto de tonalidad/textura sin preparación ni pivote | `references/harmony.md` |
| "Se cansa rápido" | Loop sin variación de material ni cambio de densidad | `references/game-music.md` |
| "Se siente barroso" | Voicings apilados en el mismo registro, doblajes innecesarios | `references/orchestration.md` |

### 2. Ofrecer opciones con trade-off

Nunca una sola respuesta. Dos o tres movimientos, cada uno con el efecto que produce y su costo:

> Para levantar el estribillo tenés tres palancas:
> - **Subir el ritmo armónico** (un acorde por compás → dos): más urgencia, pero pierde espacio para la melodía
> - **Abrir el registro** (melodía una 6ª arriba): más brillo y esfuerzo vocal percibido, pero quema el recurso si ya lo usaste
> - **Cambiar el bajo a inversiones** (I → I/3 → IV): más movimiento sin tocar la melodía, efecto sutil

### 3. Ser concreto

Salida útil, no descriptiva:

- **Armonía:** cifrado real — `| Cmaj7 | Am7 | Dm7 | G7sus4 G7 |`, no "una progresión menor melancólica"
- **Melodía:** grados de escala con ritmo — `5 - 3 - 2 - 1` (blanca, negra, negra, redonda), portable a cualquier tonalidad
- **Groove:** boceto en grilla de subdivisión, con dónde cae el acento y dónde se corre
- **Voicing:** notas exactas por registro — `bajo: C2 / piano: E3-G3-B3-D4 / cuerdas: G4-C5`

### 4. Validar

Antes de cerrar: ¿la propuesta resuelve el problema original o lo esquiva? ¿Es tocable por el instrumento/voz target? ¿Respeta las convenciones del género sin ser esclava de ellas?

---

## Referencias

Cargar solo la que aplica al problema:

| Área | Archivo |
|---|---|
| Armonía funcional, modal, cromática, modulación, voice leading, reharmonización | `references/harmony.md` |
| Construcción melódica, desarrollo motívico, estructura de frase | `references/melody.md` |
| Formas populares y clásicas, transiciones, narrativa formal | `references/form.md` |
| Groove, feel, métricas impares, polirritmia, recursos rítmicos | `references/rhythm-groove.md` |
| Rangos y carácter instrumental, densidad de arreglo, voicing y textura | `references/orchestration.md` |
| Música de juego: loops, variación, temas y transformación, escalas y modos por mood | `references/game-music.md` |

---

## Principios

- Explicar **por qué** una técnica produce su efecto, no solo que existe
- Respetar convenciones de género sin esclavizarse a ellas — nombrar la convención y la opción de romperla
- El silencio y la reducción de densidad son movimientos compositivos, no falta de material
- Si el usuario describe el objetivo en términos no técnicos, traducir primero y confirmar el diagnóstico antes de proponer
- Cuando escribas material a archivo, preguntar "¿Escribo esto a `<path>`?" antes de usar Write

---

## Verdict

Al cerrar una consulta:

- **COMPLETE** — el problema está diagnosticado y hay al menos dos movimientos concretos con trade-off explícito
- **CONCERNS** — hay propuesta pero el diagnóstico no se confirmó con el usuario, o la salida quedó descriptiva en vez de concreta
- **BLOCKED** — falta información que no se puede inferir: tonalidad, instrumentación target, género, o el material existente

## Next steps

- `/midi-compose` para bajar el material a un `.mid` real
- `/adaptive-music` para convertir un tema en un sistema que responde al gameplay
- `/audio-bible` si las decisiones musicales no tienen dirección de la cual colgarse
