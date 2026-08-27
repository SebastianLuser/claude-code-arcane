# Frontmatter Specification -- Arcane Skills

Formato de frontmatter para todas las skills del repo Claude Code Arcane.

**Fuente de verdad:** la lista de campos que Claude Code realmente lee está en
`code.claude.com/docs/en/skills`. Este documento la refleja y agrega la única
convención local del repo (`category`). No inventar campos: un campo que no está
en la tabla de abajo lo ignora el runtime, y ese silencio es donde el drift se
esconde.

## Formato requerido

```yaml
---
name: skill-name
description: "Qué hace la skill y cuándo usarla, 1-2 oraciones."
category: "domain-name"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
```

## Campos oficiales de Claude Code

Todos son opcionales para el runtime; las columnas "Arcane" marcan lo que este
repo exige por convención propia.

| Campo | Arcane | Qué hace |
|-------|--------|----------|
| `name` | **requerido** | Etiqueta mostrada en los listados. En skills personales o de proyecto el comando sale del nombre del directorio, no de este campo. |
| `description` | **requerido** | Qué hace y cuándo usarla. Claude decide con esto si aplicar la skill. `description` + `when_to_use` se truncan juntos a 1.536 caracteres. |
| `when_to_use` | opcional | Contexto extra de invocación: frases gatillo, ejemplos de pedido. Se anexa a `description` y cuenta para el tope de 1.536. |
| `argument-hint` | opcional | Hint de autocompletado. Ej: `[issue-number]`, `[filename] [format]`. |
| `arguments` | opcional | Declaración estructurada de argumentos. |
| `user-invocable` | **requerido** | `false` cuando solo Claude debe invocarla: la oculta del menú `/`. Default `true`. |
| `disable-model-invocation` | opcional | `true` impide que Claude la cargue sola. También impide precargarla en subagentes. |
| `allowed-tools` | **requerido** | Tools que Claude puede usar sin pedir permiso durante el turno que invoca la skill. El permiso se limpia con el mensaje siguiente. |
| `disallowed-tools` | opcional | Denylist de tools. |
| `model` | opcional | Modelo para el turno en que la skill está activa. Con `context: fork`, define el modelo del subagente. |
| `effort` | opcional | Nivel de esfuerzo de razonamiento. |
| `context` | opcional | **Único valor válido: `fork`.** Corre la skill en un subagente forkeado. |
| `agent` | opcional | Qué tipo de subagente usar. **Solo tiene efecto si `context: fork` está puesto.** |
| `background` | opcional | Corre en background. |
| `hooks` | opcional | Hooks con alcance de esta skill. |
| `paths` | opcional | Paths asociados. |
| `shell` | opcional | Shell para los `` !`comando` `` del body: `bash` (default) o `powershell`. |
| `metadata` | opcional | Map YAML libre para datos propios. **Claude Code no actúa sobre su contenido** — es el lugar correcto para campos que solo lee tooling nuestro. Descarta el valor si no es un map. |
| `license` | opcional | Licencia. |
| `compatibility` | opcional | Compatibilidad declarada. |

### `category` — convención local, no campo oficial

`category` no existe en la doc de Claude Code: el runtime lo ignora. Arcane lo
exige igual porque `src/skills-catalog.ts` y los profiles lo usan para agrupar.
Es inocuo. Si en algún momento deja de usarse desde `src/`, moverlo a
`metadata:` en vez de dejarlo suelto.

Categorías estándar: `arcane`, `backend`, `frontend`, `ai`, `devops`,
`security`, `testing`, `gamedev`, `agile`, `business`, `marketing-content`,
`marketing-growth`, `marketing-seo`, `marketing-strategy`, `finance`,
`regulatory`, `git`, `clevel-advisors`, `clevel-operations`, `observability`,
`database`, `workflow`, `visualnovel`, `audio`.

## Reglas por campo

### `name`
- kebab-case, y tiene que coincidir con el directorio que contiene el SKILL.md.

### `description`
- 1-2 oraciones. Bajo 200 caracteres preferido, 300 máximo.
- Entre comillas dobles.
- No repetir solo el nombre de la skill.
- Poner el caso de uso principal primero: se trunca a 1.536 caracteres.

### `allowed-tools`
- Read-only: `Read, Glob, Grep, Bash`
- Authoring: `Read, Write, Edit, Bash, Glob, Grep`
- Orquestación: `Read, Write, Edit, Bash, Glob, Grep, Task`
- Nombres válidos: `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Task`,
  `WebFetch`, `WebSearch`, `NotebookEdit`

### `agent` + `context`
Van siempre juntos. `agent:` sin `context: fork` **no hace nada**:

```yaml
# MAL - el agente declarado nunca entra en juego
agent: qa-director

# BIEN
context: fork
agent: qa-director
```

Y el agente nombrado tiene que existir en `agents/` **y** su división tiene que
estar en la lista `agents:` de todos los profiles que traen la skill. Si no, el
fork cae en un agente genérico sin system prompt especializado.

## Inyección de contexto dinámico

No hay campo de frontmatter para esto. El mecanismo es `` !`comando` `` **en el
body**, y la salida reemplaza el placeholder antes de que Claude vea la skill:

```markdown
## Estado actual

- Branch: !`git branch --show-current`
- Sprints: !`ls production/sprints/ 2>/dev/null || echo "sin sprints"`
```

El `!` se reconoce solo al principio de línea o después de whitespace, y el
comando va entre backticks. `!echo foo` sin backticks es texto literal.

## Formato a convertir (legacy)

Si el frontmatter tiene `version`, `author`, `updated`, `python-tools` o
`tech-stack`, es formato importado y hay que convertirlo: esos campos no existen
en la doc oficial ni en Arcane.

**`license` y `metadata` NO son parte de este grupo** — los dos son campos
oficiales de Claude Code y no hay que tocarlos.
