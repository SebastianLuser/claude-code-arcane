# Checklist & Output Template

## Post-generation checklist

- [ ] Uses the project's existing components (does not reinvent them)
- [ ] Color tokens mapped to the project's variables
- [ ] Typography consistent with the design system
- [ ] Responsive at the project's breakpoints
- [ ] No hardcoded values (uses tokens/variables)
- [ ] Accessible (semantic HTML, aria labels)
- [ ] Interaction states implemented

## Output Template

```markdown
## Generated components

| File | What it is | Reused components |
|---------|--------|------------------------|
| `src/components/FeatureName.tsx` | Main component | Button, Card |

## Mapped tokens
| Figma | Project |
|-------|---------|
| #3B82F6 | `--color-primary` / `text-blue-500` |

## Decisions made
- [Decision 1: why X was used instead of Y]

## TODOs
- [ ] [Something that needs input from the designer/user]
```
