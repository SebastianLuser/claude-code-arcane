# SFX Design — Anti-patterns

## Aprobar en aislamiento

El error más caro. Un sonido perfecto en solo desaparece bajo música y ambiente, o le tapa el ataque a otro. Todo efecto se juzga en contexto y al volumen real de juego.

## Apilar capas hasta que "suene grande"

Ocho capas no suenan más grandes que tres: suenan barrosas. La grandeza sale de la separación de bandas y del contraste con el silencio previo, no de la cantidad. Cuatro capas es el techo práctico.

## Dos capas en la misma banda

Si el sub y el punch pelean en 80 Hz, una de las dos está de más. Cada capa, su banda.

## Depender del sub para la fuerza

En el speaker de un handheld o en earbuds baratos no hay 40 Hz. Si toda la potencia del impacto vive ahí, en la mitad de los dispositivos el sonido es un chasquido. La fuerza tiene que leerse también en 100-300 Hz.

## Pitch randomization exagerada

±20% no es variación, es otro objeto. El arma parece cambiar de calibre entre disparos. ±2-4% y round-robin.

## Random puro en vez de round-robin

Random repite: con 4 variantes, la probabilidad de escuchar la misma dos veces seguidas es 25%. Y la repetición inmediata es exactamente lo que se quería evitar. Round-robin excluyendo la última.

## Una sola variante en eventos frecuentes

Se vuelve audible como sonido a los 20 minutos. Si el evento se dispara seguido, mínimo 4 variantes o layer swapping.

## Perseguir realismo

Un disparo real es poco impresionante y una puerta real suena a nada. El efecto comunica función de gameplay, no física. Si dos armas hacen daño distinto, tienen que sonar distinto en peso.

## Attack con pre-roll

50 ms de silencio o de aire antes del transiente hacen que la acción se sienta laggeada aunque el código sea instantáneo. El transiente va en los primeros milisegundos del archivo.

## Energía gratis en 2-6 kHz

Es la banda donde el oído es más sensible y la que fatiga más rápido. Sirve para definición y para feedback de UI; usada de más en todos los SFX, el juego se vuelve cansador en sesiones largas.

## Reverb bakeado en el asset

Si la cola trae el espacio grabado, el sonido no se puede reubicar: suena a catedral dentro de un armario. La cola propia va seca y el espacio lo pone el middleware por zona.

## Tail que ignora el 3D

Una cola larga en un sonido 3D sigue sonando cuando la fuente ya se alejó, o se corta abrupto al salir del rango. Definir la atenuación considerando la cola, no solo el ataque.

## Escalar por número de variantes

20 samples × 6 superficies × 3 intensidades = 360 archivos y ~180 MB, y aun así se escucha repetición. Cuando el problema tiene varias dimensiones, la respuesta es síntesis, no más grabaciones.
