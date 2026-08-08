# UI Sound Design — Anti-patterns

## Sonidos de UI al nivel del gameplay

Un click a −3 dB compite con la acción del juego y agota en minutos. El UI va entre −18 y −24 dB. Es el error más frecuente y el más fácil de arreglar.

## Todo al mismo nivel

Si el hover y el error de transacción suenan igual de importantes, no hay jerarquía y el usuario deja de prestar atención a los dos. Nivel y duración proporcionales a la importancia del evento.

## Todo duckea

Si cada navegación de menú baja la música, la música desaparece. Solo el nivel crítico duckea.

## Sin cooldown en navegación

Recorrer un menú rápido con el stick dispara el mismo tick veinte veces en 300 ms. Suena a glitch. Cooldown mínimo en todo evento de navegación.

## Tonos sostenidos en 2-6 kHz

Es la banda más sensible del oído y la que más fatiga. Un tono sostenido ahí cansa en una sesión. Transientes cortos.

## Ignorar la sesión de audio en móvil

Entra una llamada, la app pierde el audio y no lo recupera. O el juego suena con el switch de silencio activado. Los dos son rechazo de store. Manejar interrupciones y cambios de ruta explícitamente.

## Forzar volumen por encima del sistema

Normalizar hacia arriba o imponer un piso de volumen ignora una decisión explícita del usuario. Nunca.

## Éxito y error que solo se distinguen por timbre

Con pérdida de agudos, en un speaker malo o con el volumen bajo, los dos suenan igual. La diferencia tiene que estar en el contorno: ascendente para éxito, descendente para error.

## Audio como único canal de información crítica

Un usuario con hipoacusia, con el sonido apagado o en un lugar ruidoso pierde la información. Siempre acompañado de señal visual.

## Haptic y audio desfasados

Arriba de ~30 ms se perciben como dos eventos y se siente roto. Y si el haptic está desactivado, el evento no puede quedarse sin ningún feedback.

## Duplicar información entre audio y haptic

Si el haptic ya comunica intensidad, subir el audio para "reforzar" solo agrega molestia.

## Depender del grave en dispositivos chicos

Un sonido de UI cuyo peso vive en 80 Hz no existe en el speaker de un teléfono. Con haptics, el grave es trabajo del haptic; sin haptics, el sonido tiene que leerse en medios.

## Un set sin toggle

Los sonidos de navegación repetitivos tienen que poder apagarse, y apagarlos no debe silenciar los críticos. Controles de volumen separados de música y SFX.

## Diseñar el set sin probar navegación real

Un sonido aprobado clic por clic se vuelve insoportable cuando el usuario recorre seis pantallas en cuatro segundos. Probar con flujos reales, a velocidad real.
