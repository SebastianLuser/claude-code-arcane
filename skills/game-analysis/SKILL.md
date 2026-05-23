---
name: game-analysis
description: "Balance analysis y playtest reports: DPS, economía, progresión, outliers, estrategias degeneradas."
category: "gamedev"
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

> → Read references/balance-report-format.md for [output format del reporte de balance]

### Fix & verify

Después del reporte: ofrecer corregir valores. Después de cada fix, re-correr checks relevantes para verificar que no se introdujeron nuevos outliers.

---

## 2. Playtest Report

### Modo template (`playtest new`) / Modo análisis (`playtest analyze [path]`)

> → Read references/playtest-template.md for [template de secciones, modo análisis y categorización de findings]

---

> → Read references/anti-patterns-checklist.md for [anti-patterns y checklist de validación]
