# Release Setup Guide

Arcane usa **semantic-release** para publicar automaticamente a npm en cada push a `main`. Esta guia explica como configurar los secrets necesarios para que el pipeline funcione.

## Arquitectura del release

```
Push a main → GitHub Actions → build + test → semantic-release → npm publish + GitHub Release
```

semantic-release analiza los commits (conventional commits) para determinar la version:
- `fix:` → patch (1.0.0 → 1.0.1)
- `feat:` → minor (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → major (1.0.0 → 2.0.0)
- `chore:`, `docs:`, `test:`, `refactor:` → no release

## Prerequisitos

- Cuenta en [npmjs.com](https://www.npmjs.com) con acceso al paquete `claude-code-arcane`
- Acceso de admin al repositorio en GitHub

## Paso 1: Crear token en npm

1. Ir a **https://www.npmjs.com** y loguearse
2. Click en el avatar (arriba a la derecha) → **Access Tokens**
3. Click **Generate New Token** → elegir **Granular Access Token**
4. Configurar:
   - **Token name:** `arcane-release`
   - **Expiration:** sin expiracion (o la que se prefiera)
   - **Packages and scopes:** seleccionar **Read and write**
   - **Select packages:** elegir `claude-code-arcane`
5. Click **Generate Token**
6. **Copiar el token** — solo se muestra una vez

## Paso 2: Agregar secret en GitHub

1. Ir a [Settings > Secrets > Actions](https://github.com/SebastianLuser/Claude-Code-Arcane/settings/secrets/actions)
2. Click **New repository secret**
3. Completar:
   - **Name:** `NPM_TOKEN`
   - **Secret:** pegar el token copiado en el paso anterior
4. Click **Add secret**

> **Nota:** `GITHUB_TOKEN` se provee automaticamente por GitHub Actions, no hace falta configurarlo.

## Paso 3: Verificar

1. Hacer un push a `main` con un commit tipo `feat:` o `fix:`
2. Ir a [Actions](https://github.com/SebastianLuser/Claude-Code-Arcane/actions) y verificar que el workflow **Release** corre exitosamente
3. Verificar en npm que la nueva version aparece: `npm view claude-code-arcane version`
4. Verificar que se creo un [GitHub Release](https://github.com/SebastianLuser/Claude-Code-Arcane/releases) con changelog automatico

## Archivos de configuracion

| Archivo | Proposito |
|---------|-----------|
| `.releaserc.json` | Configuracion de semantic-release (plugins, branches) |
| `.github/workflows/release.yml` | Workflow de GitHub Actions que ejecuta semantic-release |
| `.github/workflows/ci.yml` | CI separado (build + test + typecheck) |

## Troubleshooting

### El workflow falla con "NPM_TOKEN is not set"
El secret no esta configurado. Seguir el Paso 2.

### El workflow corre pero no publica
semantic-release solo publica si hay commits que justifiquen un bump de version. Commits tipo `chore:`, `docs:`, `test:` no generan release. Usar `feat:` o `fix:`.

### Error "npm ERR! 403 Forbidden"
El token no tiene permisos de escritura sobre el paquete, o expiro. Regenerar siguiendo el Paso 1.

### El CHANGELOG.md no se actualiza
semantic-release commitea el changelog automaticamente con `[skip ci]` para no generar un loop. Si no aparece, verificar que el plugin `@semantic-release/git` este en `.releaserc.json`.

## Hybrid Distribution

Ademas del release automatico, Arcane soporta distribucion hibrida:

- **GitHub source:** `npx arcane install backend-ts --source github` baja contenido directamente del repo
- **Cache local:** contenido descargado se cachea en `~/.arcane/cache/`
- **Bundled fallback:** si GitHub no esta disponible, usa el contenido empaquetado en npm
- **Auto:** `--source auto` (default) intenta GitHub → cache → bundled

Variable de entorno: `ARCANE_SOURCE=bundled|github|auto`

## Smart Update

`arcane update` compara el contenido instalado con la ultima version disponible:

```bash
arcane update            # actualiza contenido (three-way merge)
arcane update --dry-run  # muestra que cambiaria sin aplicar
arcane update --force    # sobreescribe incluso archivos modificados localmente
```

El three-way merge detecta:
- Cambios upstream que no fueron tocados localmente → **actualiza**
- Archivos customizados localmente sin cambios upstream → **preserva**
- Conflictos (ambos cambiaron) → **backup + actualiza + avisa**
