# Audio Spec — Anti-patterns

## Spec sin números

"Impacto potente y satisfactorio" no es producible. Duración, envolvente, bandas de frecuencia y nivel relativo sí. Si el campo no tiene número o rango, no está especificado.

## Duración como valor único

"200 ms" fuerza al sound designer a mentir o a pedir aprobación. Un rango (180-260 ms) le da lugar a que el sonido termine donde tiene que terminar.

## Eventos sin concurrencia

El spec dice "sonido de casquillo al caer". Llegan 40 enemigos, 300 casquillos, el voice budget explota y el mix desaparece. Todo evento que puede dispararse más de una vez por frame necesita máximo de instancias y política de descarte.

## Cooldown ausente en eventos de UI

Navegación rápida en un menú dispara el mismo tick 15 veces en 200 ms. Suena como un glitch. Cooldown mínimo, siempre.

## Una variante

Un sonido sin variantes se vuelve audible como *sonido* en vez de como evento en unos 20 minutos de juego. Si el evento es frecuente, mínimo 4-5 variantes o randomización de pitch, y preferentemente ambas.

## Pitch randomization exagerada

±3% es variación. ±20% cambia el objeto: el arma parece otra arma. Rango chico y round-robin le gana a rango grande.

## Specs 3D sin curva

Marcar "3D" y no definir min/max distance ni forma de la curva deja la atenuación en el default del middleware, que casi nunca es el correcto. El sonido se oye a 200 m o desaparece a 3 m.

## Especificar antes de decidir procedural

Escribir 360 spec sheets de footsteps es trabajo perdido si la respuesta correcta era síntesis. Evaluar el eje frecuencia × dimensiones antes de especificar.

## Event list sin stop condition

Los loops son la fuente número uno de audio colgado. Todo sonido que loopea necesita decir explícitamente quién lo para y qué pasa si el objeto dueño se destruye primero.

## Prioridades todas iguales

Si todo es prioridad alta, el voice limiter descarta al azar y se cae el feedback de la acción del jugador antes que un ambiente lejano. Las prioridades solo sirven si están diferenciadas.

## IDs que no siguen el naming del bible

`shotgun2_FINAL_v3` rompe búsqueda, batch processing y automatización de banks. El ID sale del pattern del bible, sin excepciones.
