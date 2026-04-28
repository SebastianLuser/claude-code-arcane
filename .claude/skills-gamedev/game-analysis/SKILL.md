---
name: game-analysis
description: "Análisis de balance y playtesting. Balance: DPS, economía, progresión, loot, outliers, estrategias degeneradas. Playtest: template, análisis estructurado, categorización de findings. Usar para: balance report, check balance, playtest, playtest report, analizar balance, economia rota, DPS."
argument-hint: "[balance [system]|playtest [new|analyze path]]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# game-analysis — Balance + Playtesting

Dos modos: análisis de balance numérico y reportes de playtesting.

---

## 1. Balance Check

### Identificar dominio

Del argumento o preguntando al usuario:

| Dominio | Qué analizar |
|---------|-------------|
| **Combat** | DPS por tier, time-to-kill, opciones dominantes, estados unkillable, interacciones damage/resistance |
| **Economy** | Faucets/sinks con flow rates, acumulación en el tiempo, loops infinitos, gold sinks vs generación, items que nunca vale comprar |
| **Progression** | Curva XP/power, dead zones (sin progresión útil), power spikes, content gates vs player power, skip/grind exploits |
| **Loot** | Tiempo esperado por rarity tier, pity timer math, loot inútil en algún stage, inventory pressure vs acquisition rate |

### Proceso

1. Leer data files (`assets/data/`, `design/balance/`, SO assets)
2. Leer GDD del sistema para entender targets de diseño
3. Correr análisis domain-specific (tablas arriba)
4. Comparar valores actuales vs intención del GDD

### Formato del reporte

```markdown
## Balance Check: [Sistema]

### Data Sources
- [archivos leídos]

### Health: [HEALTHY / CONCERNS / CRITICAL]

### Outliers
| Item/Valor | Rango esperado | Actual | Problema |
|-----------|---------------|--------|----------|

### Estrategias degeneradas
- [Descripción y por qué es problemática]

### Recomendaciones
| Prioridad | Issue | Fix sugerido | Impacto |
|-----------|-------|-------------|---------|
```

### Fix & verify

Después del reporte: ofrecer corregir valores. Después de cada fix, re-correr checks relevantes para verificar que no se introdujeron nuevos outliers.

---

## 2. Playtest Report

### Modo template (`playtest new`)

Generar template con estas secciones:

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

### Modo análisis (`playtest analyze [path]`)

Leer notas raw, cross-referenciar con GDDs, estructurar en el template. Flaggear observaciones que contradicen la intención de diseño.

### Categorización de findings

| Categoría | Qué | Siguiente paso |
|-----------|-----|---------------|
| **Design changes** | Fun issues, confusión del jugador, mecánicas rotas | Actualizar GDD, evaluar impacto downstream |
| **Balance adjustments** | Números incorrectos, difficulty spikes/dips | Correr `/game-analysis balance [system]` |
| **Bug reports** | Defectos de implementación reproducibles | Issue tracker |
| **Polish items** | Fricción, feel issues, no bloquean progreso | Backlog para fase de polish |

---

## Anti-patterns

- Analizar balance sin leer data files (opinión en lugar de datos)
- Cambiar valores sin re-verificar impacto en otros sistemas
- Playtest reports sin severity en pain points — todo parece igual de urgente
- No comparar findings contra intención del GDD — "funciona mal" sin definir qué era "bien"
- Ignorar "lo que funciona" — solo reportar problemas

---

## Checklist

```markdown
### Balance
- [ ] Dominio identificado, data files leídos
- [ ] GDD del sistema leído (baseline de "correcto")
- [ ] Outliers con rango esperado vs actual
- [ ] Estrategias degeneradas identificadas
- [ ] Recomendaciones priorizadas con fix concreto

### Playtest
- [ ] Session info completa (build, duración, tester)
- [ ] Pain points con severity
- [ ] Findings categorizados (design/balance/bug/polish)
- [ ] Top 3 prioridades definidas
- [ ] Comparado contra intención del GDD
```
