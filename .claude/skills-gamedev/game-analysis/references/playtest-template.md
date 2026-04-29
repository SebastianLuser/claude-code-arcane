# Playtest Report Template & Analysis

## Template Sections (`playtest new`)

| Sección | Campos |
|---------|--------|
| **Session info** | Fecha, build/version, duración, tester, plataforma, input method, tipo de sesión |
| **Test focus** | Qué features/flows se testean |
| **First impressions** (5 min) | Entendió goal? Controles? Respuesta emocional |
| **Gameplay flow** | Qué funcionó, pain points (con severity), puntos de confusión, momentos de deleite |
| **Bugs** | Tabla: descripción, severity, reproducible |
| **Feature feedback** | Por feature: entendió propósito? Engaging? Sugerencias |
| **Quantitative** | Deaths, tiempo por área, items usados, features descubiertas vs missed |
| **Overall** | Jugaría de nuevo? Dificultad, pacing, duración de sesión preferida |
| **Top 3 prioridades** | Los 3 findings más importantes |

## Modo análisis (`playtest analyze [path]`)

Leer notas raw, cross-referenciar con GDDs, estructurar en el template. Flaggear observaciones que contradicen la intención de diseño.

## Categorización de findings

| Categoría | Qué | Siguiente paso |
|-----------|-----|---------------|
| **Design changes** | Fun issues, confusión del jugador, mecánicas rotas | Actualizar GDD, evaluar impacto downstream |
| **Balance adjustments** | Números incorrectos, difficulty spikes/dips | Correr `/game-analysis balance [system]` |
| **Bug reports** | Defectos de implementación reproducibles | Issue tracker |
| **Polish items** | Fricción, feel issues, no bloquean progreso | Backlog para fase de polish |
