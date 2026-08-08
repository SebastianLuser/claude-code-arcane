# Audio Procedural — Anti-patterns

## Síntesis por elegancia

Procedural no es mejor por ser procedural. Para un sonido hero, un sample bien diseñado gana en calidad, en control y en tiempo de producción. La síntesis rinde donde samplear no escala; en el resto es trabajo extra con peor resultado.

## Confundir el presupuesto de frame con el de callback

"1-2 ms por footstep" leído como "se puede hacer inline en el update" es el error de cálculo más frecuente. El audio entero dispone de 0.8-1.7 ms por frame a 60 fps. El footstep hay que amortizarlo: precomputar, cachear, o generarlo en el thread de audio con buffer.

## No medir, estimar

Los costos de referencia son puntos de partida, no promesas. El costo real depende de plataforma, compilador y qué más corre. Medir con el profiler del middleware antes de comprometer la arquitectura.

## Un solo parámetro sin curva

Mapear intensidad 0-1 linealmente a amplitud produce una respuesta que se siente muerta en la mitad del rango. La percepción de volumen y de brillo es logarítmica: la curva importa tanto como el rango.

## Parámetros sin clamp

Un valor de velocidad que llega en 3.7 cuando el modelo espera 0-1 produce ruido blanco a todo volumen. Normalizar y clampear en el boundary, del lado de gameplay.

## Sintetizar el ambiente entero

El ambiente puramente sintético suena sintético. La sensación de "vivo" viene de la distribución temporal y espacial de los detalles, no de generarlos. Bed sampleado + detalles posicionados proceduralmente gana.

## Variación sin límites perceptuales

Randomizar los parámetros con rango amplio produce pasos que suenan a materiales distintos entre sí. La variación tiene que ser suficiente para no repetir y chica para no romper la identidad.

## Sin fallback de plataforma

El modelo entra cómodo en PC y no entra en el target más bajo. Si eso se descubre en certificación, hay que rehacer el sistema contra reloj. El camino de samples reducido se decide en el diseño.

## Reemplazar todo de golpe

Migrar el sistema de audio entero a procedural en un paso hace imposible saber qué regresión vino de dónde. Un sistema por vez, midiendo antes y después.

## Ignorar que sigue siendo una fuente 3D

Un footstep procedural igual necesita posición, atenuación y — si son varios personajes — límite de voces. La síntesis resuelve la memoria, no la gestión de voces.

## Modelo sin parámetros expuestos

Si el modelo está hardcodeado, no es procedural: es un sample generado en runtime, con todos los costos y ninguna ventaja. El valor está en que gameplay pueda modularlo.
