# Música Adaptativa — Anti-patterns

## Crossfade como única transición

Fundir dos piezas en tonalidades o tempos distintos suena a error, no a transición. El crossfade solo funciona si el material comparte armonía y grid. Si no, hace falta sync point + segmento de transición.

## Transiciones inmediatas por default

Cortar al instante es responsivo y musicalmente destructivo. Reservarlo para muerte del jugador y cortes deliberados. El default sano es siguiente compás.

## Umbrales sin histéresis

El caso clásico: el jugador camina en el borde de un radio de detección y la música de combate entra y sale seis veces en diez segundos. Umbrales asimétricos + tiempo mínimo en estado + debounce. Siempre.

## Capas que dependen entre sí

Si la capa de melodía se escribió asumiendo que la de armonía suena, al quitar la armonía la melodía queda flotando sin contexto. Cada capa tiene que funcionar sola y con cualquier subconjunto de las de abajo.

## Stingers en la tonalidad equivocada

El error más audible del sistema. Si el fondo modula y el stinger es tonal y fijo, va a chocar. Versiones por tonalidad, o stingers tonalmente neutros.

## Stingers sin cooldown

Cinco kills en dos segundos disparan cinco stingers superpuestos. Suena a bug.

## Contar los stems y no la memoria

Ocho stems estéreo a 48 kHz sonando simultáneos es mucho más que "ocho archivos". Si van descomprimidos en memoria, el número crece rápido. Verificar el budget antes de comprometer la arquitectura vertical.

## Diseñar el sistema después de componer

Si el compositor entregó una pieza lineal de tres minutos con clímax, convertirla en capas es imposible sin rehacerla. El sistema se diseña primero y define la restricción compositiva.

## Un estado por situación

Veinte estados de música para veinte situaciones de gameplay produce una matriz de transiciones de 400 celdas que nadie va a autorear bien. Agrupar situaciones por emotional target: la mayoría de los juegos vive bien con 4-6 estados.

## Loop que cierra con cadencia auténtica

Cada vuelta suena a arranque forzado. Cerrar abierto: semicadencia, pedal, cadencia plagal.

## Música ocupando el rango del diálogo

Si el arreglo vive en 500 Hz-2 kHz y hay VO, uno de los dos pierde, y el ducking agresivo se escucha. Se resuelve en el arreglo, no en el mix.

## Ignorar el estado inicial y el retorno

Se diseña explore → combat con cuidado y se olvida combat → explore. El retorno es la transición que el jugador escucha más veces.

## Probar solo en el editor

El editor de middleware permite disparar estados a mano, en el orden correcto, sin ruido. El jugador real dispara transiciones en secuencias imposibles. Probar con gameplay, no con botones.
