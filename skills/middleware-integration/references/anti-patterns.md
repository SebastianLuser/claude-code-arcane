# Middleware Integration — Anti-patterns

## Un evento por sonido

500 eventos donde alcanzaban 40 con Switches. El código termina conociendo el nombre de cada asset, que es exactamente lo que el middleware venía a evitar. Un evento por *acción de gameplay*.

## ShareSet por objeto

Cada sonido con su propia atenuación y su propia conversión. Cambiar el rango de audición del juego pasa de ser un cambio a ser 300. Definir los ShareSets primero y reusarlos.

## State donde va Switch

Usar un State global para la superficie bajo el personaje produce el bug clásico: todos los personajes caminan sobre la superficie del jugador. Propiedad de objeto = Switch.

## Switch sin default

Si el Switch no está seteado cuando llega el evento, el sonido no suena, y el bug es invisible hasta que alguien nota el silencio. Todo Switch group con default.

## Random puro en vez de shuffle

Random repite: con 4 variantes hay 25% de escuchar la misma dos veces seguidas. Shuffle/round-robin excluyendo la última.

## RTPC sin clamp del lado del código

Un valor de salud que llega en 150 cuando el RTPC espera 0-100 deja el parámetro pegado al extremo. Normalizar y clampear en el boundary de gameplay.

## Loops sin stop explícito

La fuente número uno de audio colgado. Todo sonido que loopea necesita un stop, y tiene que detenerse cuando el objeto dueño se destruye.

## Game objects sin des-registrar

Cada enemigo muerto deja su game object registrado. A las dos horas de juego hay miles. Leak clásico, y arruina el profiling.

## Todo en un bank

Un bank monolítico se carga entero aunque el nivel use el 10%. Y cualquier cambio obliga a redistribuirlo completo. Init + Global + por nivel + por personaje.

## SFX en streaming

Un sonido corto y frecuente en streaming llega tarde y genera accesos a disco. Streaming es para música, diálogo largo y ambientes.

## Música en memoria

Se come el budget de audio entero. Streaming con prefetch.

## Fallo de evento que rompe el frame

Un bank no cargado tira una excepción que llega a gameplay. El audio degrada en silencio, siempre.

## Jerarquía por tipo de sonido

`Impacts/` con todos los impactos del juego mezclados no se navega ni se mezcla. Organizar por sistema de gameplay.

## Un solo work unit

Dos personas trabajando producen conflictos de merge irresolubles en un archivo binario o XML gigante. Work units por sistema.

## Confiar en el editor en vez del profiler

Disparar eventos a mano desde el editor no dice nada sobre voces activas, CPU o memoria en gameplay real. El profiler es la única fuente de verdad.

## Profilear game objects sin activar la captura

Sin la captura activa en la vista de Game Object antes de disparar los eventos, no se registra nada y parece que el sistema no funciona.

## Automatizar sobre el proyecto de producción

Las herramientas de autoría en batch vía WAAPI son potentes y las de terceros están mayormente en estado experimental. Probar en un proyecto descartable; el proyecto real no es el lugar.
