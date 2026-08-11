# Voice Pipeline — Anti-patterns

## Grabar antes de definir el naming

El error más caro del pipeline. Renombrar 4.000 archivos × 12 idiomas, y actualizar script, subtítulos y referencias en el middleware, no es una tarea: es un proyecto. El naming se congela primero.

## Idioma en el nombre del archivo

`vo_kira_line_003_es.wav` obliga a lógica de resolución de nombre en runtime. El idioma va en la ruta o en el bank; el nombre del archivo es idéntico en todos los locales.

## Renumerar IDs

Se corta una línea y se renumeran las siguientes para "que quede ordenado". Se rompe el vínculo con subtítulos, traducciones y assets ya grabados. Los huecos en la numeración son gratis.

## Script sin contexto

El actor graba líneas sueltas en orden alfabético sin saber a quién le habla ni qué acaba de pasar. El material no sirve y hay que reconvocarlo. El contexto por línea es obligatorio.

## Grabar en orden de ID

El orden es por personaje y por escena. Y los gritos al final de la sesión: desgastan la voz y arruinan todo lo que venga después.

## Casting por timbre solamente

El personaje que grita en el acto tres necesita un actor con rango para gritar sin perder la voz. Y si dos personajes suenan parecido, el jugador que no ve quién habla se confunde.

## Actor imposible de reconvocar

Siempre hay pickups. Un actor sin disponibilidad futura es un riesgo de producción, no un detalle de contrato.

## Presupuestar los huecos contra el inglés

El alemán y el español crecen 20-35%. Una línea que calza justo en inglés no entra en alemán, y si hay animación fija, no hay arreglo. Presupuestar contra el idioma más largo del target.

## Fallback a silencio

Falta el asset en un idioma y no suena nada. El fallback es el idioma base, siempre.

## Subtítulo sin el mismo ID

Si el subtítulo no comparte la llave con el audio, mantener los dos sincronizados pasa a ser manual. Y una línea sin subtítulo es un bug de accesibilidad, no un pendiente.

## Barks con pocas variantes

Un bark repetido es lo primero que el jugador nota. Mínimo 5-8 por intención.

## Barks sin cooldown

Tres enemigos gritan la misma frase simultáneamente y suena a bug. Cooldown global por personaje y por tipo.

## Barks en el bus de diálogo

Cada bark de combate duckea la música. Bus separado.

## Barks que no se interrumpen

El personaje muere y su grito sigue sonando desde un cadáver.

## Batch sin verificación

Procesar miles de archivos sin un paso que valide sample rate, canales y duración deja que lo que no cumple se descubra en integración, cuando ya es tarde.

## Lipsync con texto que no coincide

El actor improvisó y el texto de referencia quedó viejo. La sincronía se rompe y nadie sabe por qué. El texto grabado y el de referencia son el mismo o el lipsync miente.

## Localización sin regenerar lipsync

O se regenera por idioma, o se acepta el desfasaje explícitamente como decisión. Lo que no se puede es descubrirlo en certificación.
