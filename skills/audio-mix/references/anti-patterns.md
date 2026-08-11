# Audio Mix — Anti-patterns

## Mezclar en aislamiento

Aprobar cada categoría por separado y esperar que el conjunto funcione. El mix se valida jugando el caso peor: máxima densidad, con diálogo, con música de combate, en el dispositivo más chico.

## Release de ducking demasiado corto

La música sube y baja a cada palabra y se escucha el bombeo. El release siempre más largo que el attack: 300-500 ms para diálogo.

## Ducking como solución al masking

Si la música y el diálogo viven los dos en 500 Hz-2 kHz, hay que duckear tanto que el efecto es audible. Eso se resuelve en el arreglo, dejando el rango libre. El ducking es ajuste fino.

## Todo duckea a todo

Barks duckeando música, UI duckeando SFX, ambiente duckeando barks. El resultado es un mix que respira todo el tiempo y nunca está quieto. Definir qué duckea a qué, y que sea poco.

## Un solo bus de SFX

Con 40 enemigos, el feedback de la acción del jugador se pierde entre el resto. Separar `Player` de `World` es lo que permite protegerlo.

## Diálogo y barks en el mismo bus

Cada bark de combate duckea la música. Separarlos permite duckear por diálogo importante nada más.

## UI dentro de SFX

El UI tiene otro nivel (−18 a −24 dB) y suele necesitar control de usuario propio. Metido en SFX, hereda un volumen que no le corresponde.

## Mix states que saltan

Cambiar de snapshot instantáneamente se escucha como un corte. Interpolar 200-500 ms según el cambio.

## Estados sin prioridad

Combat y Low health quieren activarse a la vez y el resultado depende del orden de evaluación. Prioridad explícita.

## EQ correctivo en todo

Adelgazar cada fuente con EQ hasta que dejen de pelear produce un mix delgado y sin peso. El problema de raíz es la asignación de bandas, o hay demasiadas fuentes sonando.

## Confundir "suena chico" con problema de EQ

Cuando todo suena chico, casi siempre hay demasiadas voces activas y ninguna tiene lugar. Es un problema de voice count, y el EQ no lo arregla.

## Nada de headroom

Mezclar apuntando al caso promedio y clippear cuando coinciden explosión, música y diálogo. El margen se calcula contra el peor caso.

## Medir loudness en un asset aislado

Los targets de LUFS son del programa completo en gameplay representativo. Medir un archivo no dice nada del cumplimiento.

## Asumir un target sin verificar

Los targets de plataforma se revisan. Confirmar el vigente antes de certificación en vez de confiar en un número memorizado.

## Ignorar el true peak

Un mix que llega a 0 dBFS en PCM puede generar picos por encima al codificarse en lossy. −1 dBTP existe por eso.

## Mezclar solo con auriculares buenos

El mix suena perfecto en los monitores del sound designer y se cae en el speaker de un handheld. Validar en el dispositivo más chico del target.
