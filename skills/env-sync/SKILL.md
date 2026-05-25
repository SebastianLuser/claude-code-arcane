---
name: env-sync
description: "Compara .env.example vs .env real, detecta variables faltantes, extra o con valores default. Usar cuando se mencione: env, variables de entorno, .env, environment variables, config check, setup."
category: "operations"
argument-hint: "[path to .env root, default .]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---
# Environment Sync Checker

Verifica que las variables de entorno estén sincronizadas entre `.env.example` y `.env`.

## Process

### 1. Detectar archivos

Buscar en el directorio actual:
- `.env.example` / `.env.sample` / `.env.template`
- `.env` / `.env.local` / `.env.development` / `.env.production`
- `docker-compose.yml` (extraer variables de `environment:`)
- `config/` o archivos de config que referencien env vars

### 2. Parsear variables

De cada archivo, extraer:
- Nombre de la variable
- Valor (o vacío)
- Si tiene comentario explicativo

### 3. Comparar

| Check | Detalle |
|-------|---------|
| **Faltantes en .env** | Variables en .example que no están en .env |
| **Extra en .env** | Variables en .env que no están en .example (posible leak de config vieja) |
| **Valores default** | Variables en .env que todavía tienen el valor de ejemplo ("your-key-here", "changeme", etc.) |
| **Vacías requeridas** | Variables sin valor que probablemente son requeridas |
| **Secrets en .example** | Valores que parecen tokens/keys reales en el .example (red flag) |

### 4. Verificar .gitignore

```bash
# Asegurar que .env NO está trackeado
git ls-files --error-unmatch .env 2>/dev/null
```

Si `.env` está trackeado → **ALERTA CRÍTICA**.

### 5. Cross-check con código

Buscar en el código variables de entorno que NO están en .env.example:

```bash
# Go
grep -rn 'os.Getenv\|viper.Get' --include="*.go" | grep -oP '"[A-Z_]+"'

# Node.js
grep -rn 'process.env\.' --include="*.ts" --include="*.js" | grep -oP '\.[A-Z_]+'

# Python
grep -rn 'os.environ\|os.getenv' --include="*.py" | grep -oP '"[A-Z_]+"'
```

### 6. Reporte

```markdown
# Env Sync Report — [fecha]

## Estado: [OK / WARN / CRITICAL]

## Variables faltantes en .env (necesitás agregar)
| Variable | Descripción | Valor sugerido |
|----------|-------------|----------------|

## Variables con valor default (revisar)
| Variable | Valor actual | Acción |
|----------|-------------|--------|

## Variables extra en .env (posiblemente obsoletas)
| Variable | Valor |
|----------|-------|

## Variables en código sin .env.example
| Variable | Archivo | Línea |
|----------|---------|-------|

## Seguridad
- .env en .gitignore: [SI/NO]
- .env trackeado en git: [SI/NO]
- Secrets en .env.example: [lista]
```

### 7. Fix automático (si el usuario acepta)

- Agregar variables faltantes a `.env` con valores de ejemplo
- Agregar variables del código faltantes a `.env.example`
- Agregar `.env` a `.gitignore` si falta

## Rules
- NUNCA mostrar valores de secrets reales en el output
- Si hay secrets en .env.example → advertir inmediatamente
- En español
