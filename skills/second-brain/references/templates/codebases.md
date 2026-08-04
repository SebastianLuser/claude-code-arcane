---
created: {{date:YYYY-MM-DD}}
type: codebases
---

# Codebases

Puente del vault al código. Las notas de hub y de proyecto declaran `repos:` en su frontmatter; esta tabla dice qué es cada repo y dónde está en esta máquina.

**El vault apunta, no copia.** Acá no va arquitectura, ni estructura de carpetas, ni explicaciones de módulos: eso vive en el repo y se desactualiza el día que alguien mergea. Acá va solo lo que el repo no te puede decir: dónde está local, cómo se corre, y qué te vas a llevar puesto.

| Repo | Path local | Rama | Cómo correr | Grafo | Notas |
|---|---|---|---|---|---|
| `<repo>` | `~/code/<repo>` | `main` | `npm run dev` | `graphify` | `<gotcha en una línea>` |

## Antes de explorar un repo, consultá su grafo

Si el repo tiene un grafo de código consultable, **esa es la primera parada, no un subagente explorando**. Un relevamiento de arquitectura con subagentes cuesta del orden de 100k tokens y minutos; una consulta al grafo cuesta uno o dos mil y es instantánea.

```bash
graphify query "que conecta X con Y" --budget 2000
graphify explain "<Simbolo>"
```

Y si el repo tiene una capa curada de arquitectura (por ejemplo `exploracion/ARQUITECTURA.md`), leela después del grafo: ahí viven las decisiones y los gotchas que un AST no ve. Si tu cambio invalida algo de lo que documenta, actualizarla es parte del cambio.

## Qué va en el vault y qué va en el repo

| Pregunta | La responde |
|---|---|
| ¿Qué hace esto y para quién? | El vault: el hub del tema |
| ¿Por qué está hecho así? | El vault: la decisión, en una nota atómica |
| ¿Qué archivos toco? | El repo: el grafo |
| ¿Qué se rompe si cambio esto? | El repo: el grafo |
| ¿Cómo lo corro y qué me va a explotar? | Esta tabla |

Si te encontrás copiando arquitectura al vault, la pregunta que estabas contestando era del repo.
