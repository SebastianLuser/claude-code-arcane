---
name: onboard
description: "Generate project onboarding guide: stack, setup instructions, structure, conventions, useful links."
category: "workflow"
argument-hint: "[project path, default .]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---
# Onboarding Guide Generator

Genera una guía completa para que un dev nuevo pueda arrancar a trabajar en el proyecto.

## Process

### 1. Escanear proyecto

Leer en paralelo:
- README.md, CONTRIBUTING.md, CLAUDE.md
- Package manager config (go.mod, package.json, pyproject.toml, etc.)
- Docker config (Dockerfile, docker-compose.yml)
- CI config (.github/workflows/)
- .env.example
- Makefile / scripts/
- Estructura de carpetas (2-3 niveles)

### 2. Generar guía

```markdown
# Guía de Onboarding — [Proyecto]
**Última actualización:** [fecha]

## Qué es este proyecto
[1-2 párrafos: qué hace, para quién, por qué existe]

## Stack tecnológico
| Componente | Tecnología | Versión |
|------------|------------|---------|
| Lenguaje | Go 1.26 | 1.26.1 |
| Framework | Gin | 1.12.0 |
| Base de datos | PostgreSQL | 16 |
| ORM | GORM | 1.31.1 |

## Prerequisitos
- [ ] [Tool 1] instalado (link a docs)
- [ ] [Tool 2] instalado
- [ ] Acceso a [servicio] (pedir a [persona])

## Setup paso a paso

### 1. Clonar y configurar
```bash
git clone [repo-url]
cd [proyecto]
cp .env.example .env
# Editar .env con tus valores
```

### 2. Levantar servicios
```bash
[comando para DB, docker, etc.]
```

### 3. Instalar dependencias
```bash
[go mod download / npm install / etc.]
```

### 4. Correr migrations
```bash
[comando de migrations]
```

### 5. Arrancar el servidor
```bash
[comando para development server]
```

### 6. Verificar que funciona
```bash
curl http://localhost:[port]/health
# Debe responder: {"status": "ok"}
```

## Estructura del proyecto
```
[árbol de directorios con descripción de cada carpeta]
```

## Convenciones de código
- [Naming, estructura de archivos, patrones usados]

## Comandos útiles
| Comando | Qué hace |
|---------|----------|
| `make test` | Correr tests |
| `make lint` | Lint |
| `make build` | Build |

## Git workflow
- Branches: [convención]
- Commits: [formato]
- PRs: [proceso]

## Links útiles
- Jira: [link]
- Figma: [link]
- Staging: [link]
- Docs: [link]

## Contactos
| Área | Persona | Contacto |
|------|---------|----------|
```

### 3. Output

Guardar como `docs/ONBOARDING.md` o `ONBOARDING.md` en la raíz.

## Rules
- Solo incluir info que se puede verificar del código actual
- Si falta info (como links a staging), dejar placeholder con [TODO]
- Probar mentalmente que los pasos de setup funcionan en orden
- En español
