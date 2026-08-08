# Audio Espacial — Anti-patterns

## HRTF en todas las fuentes

50 fuentes × 2 ms = 100 ms de CPU, contra un frame de 16.6 ms a 60 fps. No es costoso: es seis veces imposible. El presupuesto real es 3-5 fuentes con HRTF y el resto por Ambisonics o panning.

## HRTF en speakers

HRTF asume auriculares. En speakers el crosstalk entre canales destruye las claves binaurales y suena peor que un panning honesto. Si no hay auriculares garantizados, hace falta detección de ruta o se descarta.

## Volumen como única clave de distancia

Un sonido que solo baja de volumen se percibe como "más silencioso", no como "más lejos". Hacen falta los cuatro componentes: volumen, low-pass creciente, spread decreciente y más reverb.

## Confundir oclusión con obstrucción

Aplicar oclusión total donde había obstrucción hace que un enemigo detrás de una columna sea inaudible. Obstrucción baja el directo y mantiene el reflejado; oclusión baja los dos.

## Raycasts sin presupuesto

La parte cara de la oclusión es el raycast, no el filtro. Con 30 fuentes haciendo raycast por frame el costo se dispara. Limitar, repartir entre frames, cachear.

## Oclusión sin interpolar

Aplicar el valor de golpe produce un salto muy audible cada vez que el jugador cruza el borde de una geometría. Interpolar siempre hacia el target.

## Curvas sin min/max distance

Dejar el default del middleware produce sonidos audibles a 200 m o que desaparecen a 3 m. Los dos valores y la forma de la curva son parte del spec.

## Reverb de zona con cambio instantáneo

El salto de preset se escucha como un corte. Crossfade en la transición, y dejar que la cola anterior termine.

## Música y UI espacializadas

No tienen posición en el mundo. Espacializarlas produce paneos raros y costo inútil.

## Diálogo tratado como una fuente 3D más

Si el diálogo importante se ocluye y se atenúa como cualquier SFX, el jugador pierde información. Suele necesitar un tratamiento pseudo-3D: dirección sí, oclusión no.

## Presupuestar contra la plataforma más alta

El modelo entra en PC y no en el target más bajo. El presupuesto se hace contra el piso, no contra el techo.

## Ambisonics para fuentes puntuales importantes

Ambisonics brilla en campo difuso y ambiente. Para la fuente crítica que el jugador tiene que localizar con precisión, no reemplaza a HRTF.

## Ignorar el presupuesto más ajustado de VR

90 fps deja ~11 ms de frame. Un plan de espacialización calculado para 60 fps no entra.
