# Audio Bible — Anti-patterns

## Dirección vacía

**Síntoma:** "El juego suena oscuro e inmersivo."

Cualquier sonido pasa ese filtro, así que no filtra nada. Una statement útil excluye: "Todo suena grabado dentro de una habitación de concreto — nada nace limpio, todo tiene el cuarto encima." Eso rechaza el 90% de una library.

## Paleta sin fuentes

Listar adjetivos (cálido, agresivo, etéreo) sin decir de dónde sale el sonido deja la decisión al sound designer, que es exactamente lo que el bible debería resolver. Nombrar fuentes: instrumentos, materiales, técnicas de grabación, cadenas de procesamiento.

## Frequency allocation ausente

Se produce todo, se llega al mix, y diálogo compite con música y SFX en 500 Hz-2 kHz. La solución tardía es EQ quirúrgico que adelgaza todo. La solución temprana es asignar bandas antes de producir.

## Copiar la referencia entera

"Suena como Hollow Knight" sin decir qué se toma produce pastiche. Para cada referencia: qué tomar y qué evitar explícitamente.

## Emotional targets que no se distinguen

Si exploración y tensión comparten instrumentación, tempo y densidad, el jugador no lee el estado por audio. Test: describir los estados sin nombrarlos y ver si son distinguibles.

## Standards no producibles

"Audio de alta calidad, sin artefactos" no es un standard. Sample rate, bit depth, formato por plataforma, naming pattern, target de loudness con tolerancia, headroom y budget de voces sí lo son.

## El silencio sin documentar

Los juegos con mejor audio usan silencio deliberadamente. Si el bible no dice dónde y por qué, alguien va a llenar cada segundo con ambiente.

## Ignorar la plataforma

Un bible que asume monitores de estudio falla en el speaker de un handheld o en earbuds bluetooth. Los targets de loudness y la allocation de frecuencias cambian por plataforma — documentar cuáles importan.

## Bible que nadie gatea

Si no hay un paso de review que compare assets contra el bible, es decoración. Conectarlo con `/audio-audit` y hacerlo condición de entrega.
