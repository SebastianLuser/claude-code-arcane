# Anti-patterns

- Analizar balance sin leer data files (opinión en lugar de datos)
- Cambiar valores sin re-verificar impacto en otros sistemas
- Playtest reports sin severity en pain points — todo parece igual de urgente
- No comparar findings contra intención del GDD — "funciona mal" sin definir qué era "bien"
- Ignorar "lo que funciona" — solo reportar problemas

# Checklist

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
