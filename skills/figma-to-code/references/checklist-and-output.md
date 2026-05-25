# Checklist & Output Template

## Checklist post-generacion

- [ ] Usa componentes existentes del proyecto (no reinventa)
- [ ] Tokens de color mapeados a variables del proyecto
- [ ] Typography consistente con el design system
- [ ] Responsive en los breakpoints del proyecto
- [ ] Sin valores hardcodeados (usa tokens/variables)
- [ ] Accesible (semantic HTML, aria labels)
- [ ] Estados de interaccion implementados

## Output Template

```markdown
## Componentes generados

| Archivo | Qué es | Componentes reutilizados |
|---------|--------|------------------------|
| `src/components/FeatureName.tsx` | Componente principal | Button, Card |

## Tokens mapeados
| Figma | Proyecto |
|-------|---------|
| #3B82F6 | `--color-primary` / `text-blue-500` |

## Decisiones tomadas
- [Decisión 1: por qué se usó X en vez de Y]

## TODOs
- [ ] [Algo que necesita input del diseñador/usuario]
```
