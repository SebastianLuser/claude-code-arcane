---
name: changelog
description: "Genera changelog desde git log entre dos tags/commits, agrupado por tipo (feat/fix/refactor/docs/test/chore). Usar cuando se mencione: changelog, release notes, qué cambió, historial de cambios."
argument-hint: "[range: vX..vY | vX | last-week | N | empty]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Changelog Generator

Genera un changelog profesional desde el historial de git.

## Input

Argumento opcional: `$ARGUMENTS`

Formatos aceptados:
- `v1.0.0..v1.1.0` — entre dos tags
- `v1.2.0` — desde ese tag hasta HEAD
- `last-week` / `last-month` — por fecha
- `10` — últimos N commits
- (vacío) — desde el último tag hasta HEAD

## Process

### 1. Determinar rango

```bash
# Si hay tags
git tag --sort=-v:refname | head -5

# Si no hay tags, usar los últimos 20 commits
git log --oneline -20
```

### 2. Extraer commits

```bash
git log [rango] --pretty=format:"%h|%s|%an|%ad" --date=short
```

### 3. Clasificar por tipo

Parsear el prefijo del mensaje de commit (conventional commits):

| Prefijo | Categoría |
|---------|-----------|
| `feat:` / `feature:` | Nueva funcionalidad |
| `fix:` / `bugfix:` | Corrección de bugs |
| `refactor:` | Refactorización |
| `docs:` | Documentación |
| `test:` | Tests |
| `chore:` / `ci:` / `build:` | Mantenimiento |
| `perf:` | Performance |
| `style:` | Estilo de código |
| `BREAKING CHANGE` | Cambios que rompen compatibilidad |
| Sin prefijo | Otros |

### 4. Generar changelog

Formato de salida:

```markdown
# Changelog — [proyecto] — [fecha]
**Rango:** [tag1] → [tag2/HEAD]
**Commits:** [N total]

## Breaking Changes
- [hash] descripción (@autor)

## Nueva funcionalidad
- [hash] descripción (@autor)

## Correcciones
- [hash] descripción (@autor)

## Refactorización
- [hash] descripción (@autor)

## Performance
- [hash] descripción (@autor)

## Documentación
- [hash] descripción (@autor)

## Tests
- [hash] descripción (@autor)

## Mantenimiento
- [hash] descripción (@autor)

## Otros
- [hash] descripción (@autor)

---
**Estadísticas:**
- X archivos modificados
- +Y líneas / -Z líneas
- N contribuidores
```

### 5. Output

- Mostrar en pantalla
- Si el usuario pide guardarlo → escribir en `CHANGELOG.md` (append al inicio)

## Rules
- Omitir categorías vacías
- Si no usa conventional commits, intentar clasificar por contenido del mensaje
- Incluir link al commit si el repo tiene remote configurado
- En español
