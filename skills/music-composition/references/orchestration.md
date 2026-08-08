# Orquestación

## Rangos y carácter

Rangos prácticos (no extremos virtuosos). El **carácter cambia por registro** en el mismo instrumento — es lo que más se ignora.

| Instrumento | Rango práctico | Registro grave | Registro agudo |
|---|---|---|---|
| Flauta | C4 – C7 | Aireado, débil, se tapa | Brillante, penetrante |
| Clarinete | D3 – C6 | Oscuro, cálido, único | Estridente si se fuerza |
| Oboe | B♭3 – G6 | Nasal, presente | Tenso |
| Fagot | B♭1 – E5 | Sombrío, cómico | Vulnerable, expresivo |
| Corno | F2 – F5 | Noble, difuso | Heroico, esfuerzo audible |
| Trompeta | E3 – C6 | Sólido | Brillante, corta cualquier textura |
| Trombón | E2 – F4 | Grave, potente | Cantabile |
| Violín | G3 – E7 | Cálido (cuerda G) | Brillante; muy agudo = tensión |
| Viola | C3 – E6 | Ronco, melancólico | Delgado |
| Cello | C2 – C6 | Profundo | El registro más expresivo de la orquesta |
| Contrabajo | E1 – G4 | Fundamento | Raro, tenso |
| Voz (soprano) | C4 – A5 | Débil | Potente, esfuerzo audible |
| Voz (barítono) | A2 – F4 | Cómodo | Intenso |

## Densidad de arreglo

**La regla que resuelve el 80% de los problemas: menos elementos, mejor definidos.**

| Nivel | Elementos simultáneos | Uso |
|---|---|---|
| Íntimo | 1-2 | Momentos de máxima atención |
| Cámara | 3-5 | Estándar de gameplay sostenido |
| Pleno | 6-10 | Clímax |
| Tutti | todo | Una vez, y corto |

En música de juego, el nivel de densidad es la palanca adaptativa más eficiente: subir y bajar capas sin cambiar el material.

## Voicing y textura

- **Espaciado natural** — intervalos amplios abajo, cerrados arriba. Copia la serie armónica; suena limpio automáticamente
- **No apilar en el mismo registro** — cuatro instrumentos entre C4 y C5 producen barro. Separar por octavas
- **Doblar con intención** — al unísono para peso, a la octava para brillo, en 3ªs/6ªs para dulzura. Doblar todo es no doblar nada
- **Registro medio saturado** — 500 Hz-2 kHz es donde vive el diálogo. En un juego, la música debería *dejar ese rango relativamente libre* si hay VO simultáneo (ver `/audio-mix`)

## Combinaciones que funcionan

| Combinación | Efecto |
|---|---|
| Cello + corno (unísono) | Calidez con peso |
| Clarinete grave + viola | Oscuridad ambigua |
| Flauta + violín (octava) | Brillo aireado |
| Pizzicato + arpa/mallets | Puntillismo, curiosidad |
| Cuerdas con sordina + coro suave | Distancia, memoria |
| Trompas en 5ªs abiertas | Épica; cliché si se abusa |
| Solo + silencio | Máxima atención |

## Escritura coral / vocal

- Rango cómodo, no extremo: la tesitura sostenida importa más que la nota más alta
- Voice leading estricto: las voces internas se mueven lo mínimo
- Texto inteligible pide notas más largas y registro medio
- Vocales abiertas (a, o) para agudos y notas largas; cerradas (i, u) suenan tensas arriba

## Producción-aware

Si el material va a un mix con SFX y diálogo encima:

- Dejar espacio en 500 Hz-2 kHz cuando puede haber VO
- El sub (20-60 Hz) suele estar reservado a impactos — no llenarlo con música
- Los transientes agudos compiten con feedback de UI: si el arreglo tiene mucho hi-hat/percusión brillante, el UI se pierde
- Arreglos densos sobreviven mal a la compresión lossy de plataforma: el detalle en 6-20 kHz es lo primero que se va
