# Output Template & Finding Format

## Plantilla de reporte

```markdown
# Auditoría del GDD — [fecha]
**Fecha:** [hoy]
**Estado:** [SALUDABLE / NECESITA ATENCIÓN / CRÍTICO]
**Scope:** [qué se auditó contra qué]

## RESUMEN EJECUTIVO
[2-3 oraciones: salud general, problema más grande, próximo paso recomendado]

## 1. CONTRADICCIONES
[Tabla, ordenada por severidad]

## 2. GAPS / CONTENIDO FALTANTE
[Agrupado por Bloqueante / Importante / Nice to Have]

## 3. COHERENCIA Y LÓGICA
[Issues de edge cases, terminología, lógica]

## 4. BALANCE RED FLAGS
[Problemas de balance con escenarios ejemplo]

## 5. DECISIONES PENDIENTES
[Lista priorizada con opciones y recomendaciones]

## 6. LO QUE ESTÁ BIEN
[Qué funciona bien — no solo criticar, reconocer buen diseño]

## 7. PRÓXIMOS PASOS
[Action items concretos, ordenados por prioridad]
```

## Formato de hallazgos

Cada hallazgo del reporte debe seguir formato PAS condensado (ver `/doc-pas`):

```markdown
### [Título del hallazgo] — [CRITICAL/HIGH/MEDIUM]

**Problema:** [1-2 oraciones: qué está mal y qué impacto tiene]
**Análisis:** [1-2 oraciones: por qué pasa]
**Solución:** [1-2 oraciones: qué hacer, con valores concretos]
```

NO escribir párrafos largos explicando el problema. NO divagar con recomendaciones genéricas. Bullet points y números concretos.
