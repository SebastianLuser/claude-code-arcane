# Música de Juego

## La restricción central

La música de juego se escucha **muchas más veces que la música lineal, en duración desconocida, y compitiendo con SFX y diálogo**. Eso cambia las decisiones compositivas, no solo la implementación.

Consecuencias directas:

1. **Lo que en música lineal es "interesante" acá es "fatigante".** Un gesto llamativo cada 8 compases se vuelve insoportable a la vigésima repetición
2. **La duración es indefinida.** No hay clímax garantizado; el arco tiene que funcionar cortado en cualquier punto
3. **El registro medio no es tuyo.** Diálogo y feedback de UI viven ahí
4. **El silencio es barato y potente.** Es el único recurso que no se gasta con la repetición

## Escribir para repetición

- **Loops largos con material corto** — un loop de 2 minutos construido con 4 células es menos fatigante que uno de 30 segundos con 12 ideas
- **Evitar el gesto firma dentro del loop** — guardar los eventos distintivos para stingers o para capas que entran ocasionalmente
- **Ritmo armónico lento** — la progresión que se puede escuchar 50 veces es la que no llama la atención sobre sí misma
- **Ambigüedad de fin** — si el loop cierra con cadencia auténtica, cada repetición suena a arranque forzado. Cerrar con semicadencia, pedal o cadencia plagal
- **Priorizar textura sobre melodía en gameplay sostenido** — la melodía fuerte es para momentos, no para fondo

## Composición por capas

La forma nativa. Escribir un mismo material en estratos que pueden entrar y salir sin romper nada:

| Capa | Rol | Entra cuando |
|---|---|---|
| **Bed** | Pad/textura sostenida, define tonalidad | Siempre |
| **Pulse** | Pulso rítmico mínimo | Hay actividad |
| **Harmony** | Movimiento armónico explícito | Sube la tensión |
| **Melody** | Tema identificable | Momento narrativo |
| **Intensity** | Percusión densa, metales, disonancia | Combate/clímax |

**Regla de composición:** cada capa tiene que sonar bien sola y en cualquier combinación con las de abajo. Eso se logra escribiéndolas todas contra la misma armonía y el mismo grid, y no dejando que ninguna dependa de otra para tener sentido.

## Temas y transformación

Un tema, N estados de juego. Las transformaciones más rentables:

| Transformación | Estado que representa |
|---|---|
| Aumentación + reducción de densidad | Memoria, calma, safe zone |
| Modo menor / ♭6 | Amenaza, pérdida |
| Fragmentación + aumento de tempo | Persecución, urgencia |
| Reorquestación a solo | Intimidad, muerte de personaje |
| Sobre pedal disonante | Corrupción, algo está mal |
| Métrica cambiada | Extrañeza, otro plano |

Esto le da coherencia a una banda de sonido entera con una sola idea musical, y hace que el jugador "reconozca" sin saber por qué.

## Modos por mood

| Mood buscado | Recurso |
|---|---|
| Aventura, optimismo | Mixolidio, ♭7; cuartas y quintas abiertas |
| Melancolía sin tragedia | Dórico, ♮6 |
| Asombro, escala | Lidio, ♯4; acordes mayores por movimiento de terceras |
| Amenaza | Frigio, ♭2; tritono; cluster |
| Misterio | Escala de tonos enteros; armonía cuartal; ambigüedad de centro |
| Tensión sostenida | Pedal + disonancia que no resuelve |
| Vacío, desolación | Intervalos abiertos, silencio, un solo timbre |

## Enfoques generativos

Cuando el contenido tiene que exceder lo que se puede escribir a mano:

- **Cadenas de Markov** — melodía estocástica entrenada sobre material propio. Preserva el idioma; no genera estructura
- **L-systems / gramáticas recursivas** — generan *estructura* jerárquica (frases, secciones) por reescritura de reglas. Complemento natural de Markov, que no tiene forma
- **Restricciones de armonía** — capa de validación: el generador propone, las reglas de voice leading y función filtran
- **Selección estocástica de capas** — la variación viene de qué combinación suena, no de generar notas nuevas. Mucho más barato y más controlable

**Recomendación práctica:** la selección estocástica de capas resuelve el 90% de la necesidad real de variación en un juego, sin ninguno de los riesgos de calidad de la generación de notas. Ir a Markov/L-systems solo cuando la variación de capas ya no alcanza.

## Anti-patterns

- **Loop de 30 segundos con melodía fuerte** — el camino más rápido a que el jugador baje la música
- **Cadencia auténtica al final del loop** — cada vuelta suena a error
- **Melodía en 500 Hz-2 kHz durante diálogo** — pelea con VO y pierde
- **Todas las capas dependientes entre sí** — al quitar una, el resto suena incompleto
- **Un tema por zona sin relación entre ellos** — la banda de sonido no acumula significado
- **Componer a duración fija** — el gameplay no dura lo que dura tu pieza
- **Sub saturado de música** — se come el espacio de los impactos
