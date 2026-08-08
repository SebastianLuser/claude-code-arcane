# Audio Audit — Anti-patterns

## Medir en el editor

El editor dispara eventos en orden, uno por vez, sin ruido de fondo. El jugador produce combinaciones que nadie planificó. Las mediciones del editor no predicen nada.

## Medir en la plataforma más alta

El presupuesto cierra cómodo en PC y revienta en el handheld. La auditoría se hace contra el piso del target.

## Medir loudness de un asset

Los targets de LUFS son del programa completo en gameplay representativo. Medir un `.wav` no dice nada sobre cumplimiento.

## Sesión de medición demasiado corta

Treinta segundos de exploración tranquila da un LUFS que no representa el juego. La medición tiene que cubrir exploración, combate y diálogo.

## Confiar en un target memorizado

Las recomendaciones de plataforma se revisan. Confirmar el vigente antes de certificación.

## Medir peak de sample en vez de true peak

Un mix que llega a 0 dBFS en PCM puede generar picos por encima al codificarse en lossy. El −1 dBTP existe justamente por eso.

## No buscar leaks

El contador de game objects registrados que crece durante dos horas y nunca baja es el hallazgo más frecuente, y solo se ve en sesiones largas. Una prueba de cinco minutos no lo encuentra.

## Aceptar el pico de voces al límite

Si el pico toca el límite configurado, cualquier situación un poco peor empieza a descartar sonidos. Y si lo que se descarta es feedback de la acción del jugador, el juego se siente roto sin ningún error visible.

## Ignorar qué se descarta

El número de descartes por sí solo no dice nada. Lo que importa es la prioridad de lo descartado: perder un ambiente lejano está bien, perder el disparo del jugador no.

## Fuente 3D en estéreo

El hallazgo más silencioso: el middleware la colapsa o la trata distinto, y la localización espacial se degrada sin que aparezca ningún error. Verificar canales por categoría de uso.

## Mezcla de sample rates

44.1 y 48 kHz en el mismo proyecto obliga a resampleo en runtime, que cuesta CPU y puede introducir artefactos. Un solo sample rate por proyecto.

## Silencio al inicio del asset

Retrasa el ataque y se percibe como lag de input, aunque el código responda instantáneo. Se detecta automáticamente y casi nunca se busca.

## Hallazgo sin número

"El audio suena saturado" no es un hallazgo. Qué se midió, valor medido, valor esperado, dónde. Sin eso, nadie puede arreglarlo ni verificar que se arregló.

## Auditar a mano miles de assets

La conformidad de sample rate, canales, naming y duración es mecánica: se automatiza. La inspección manual de 4.000 archivos garantiza que algo se pase por alto.

## Fallar cuando falta una herramienta externa

Si el chequeo profundo necesita una herramienta que no está instalada, reportar `[SKIP]` y seguir. Abortar la auditoría entera por una dependencia opcional deja al usuario sin los chequeos que sí se podían correr.

## Dejar el checklist de plataforma para el final

El comportamiento en background y el switch de silencio en iOS son causas concretas de rechazo. Descubrirlos en certificación cuesta una release.
