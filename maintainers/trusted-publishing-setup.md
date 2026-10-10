# Migración a Trusted Publishing (OIDC) — guía futura

> **Estado actual (jun 2026):** el paquete se publica con un **token `NPM_TOKEN`** (Classic Automation, saltea 2FA) cargado como secret en GitHub Actions. Funciona y es estable. Este documento describe cómo migrar a **Trusted Publishing (OIDC)** cuando convenga.

---

## 1. Qué es y por qué migrar

**Trusted Publishing** usa **OpenID Connect (OIDC)**: GitHub Actions se autentica contra npm con una **identidad efímera por run** (un id-token de corta vida), en vez de un token de larga duración guardado como secret.

| | Token (actual) | Trusted Publishing (OIDC) |
|---|---|---|
| Secret de larga vida | Sí (`NPM_TOKEN`) | **No** |
| Expira / hay que rotar | Sí (vence **2026-09-01**) | **No** |
| Riesgo si se filtra | Alto (válido hasta expirar) | Bajo (token efímero por run) |
| Provenance / attestations | Manual | **Automático** |
| Mantenimiento | Rotar token periódicamente | Cero |

**Motivo principal para migrar:** eliminar la rotación del token y el riesgo de que un release falle sin aviso cuando el token expire.

---

## 2. ⚠️ Por qué HOY (jun 2026) no se hizo

El setup actual está varias piezas por debajo de lo que OIDC requiere. **Verificar y resolver estos puntos ANTES de migrar:**

| Requisito OIDC | Estado al jun-2026 | Acción |
|---|---|---|
| `@semantic-release/npm` **≥ 13.1.0** (soporte OIDC, oct-2025) | **12.0.2** (bundleado por `semantic-release@24.2.9`) — **no soporta OIDC** | Forzar upgrade del plugin |
| **npm ≥ 11.5.1** en el CI | Node 22 trae **npm 10.x** | Agregar step que actualice npm |
| `permissions: id-token: write` en el job | No está | Editar `release.yml` |
| Trusted publisher configurado en npm | No está | Configurar en la web de npm |
| Paquete ya existe en npm | ✅ (`claude-code-arcane@1.0.0`) | OK — OIDC **no** permite el *primer* publish, pero ya está hecho |

**Bugs conocidos a revisar antes de migrar** (pueden estar resueltos en versiones nuevas):
- [semantic-release/npm#1069](https://github.com/semantic-release/npm/issues/1069) — `ENONPMTOKEN` aún pide token en `verifyConditions` (reportado ene-2026).
- [semantic-release/npm#1023](https://github.com/semantic-release/npm/issues/1023) — falla el primer publish desde maintenance branch.

> Antes de empezar, chequear que estos issues estén cerrados o tengan workaround claro.

---

## 3. Setup paso a paso

### Paso 1 — Actualizar dependencias

Asegurar `@semantic-release/npm` ≥ 13.1.0. Como `semantic-release@24.x` puede seguir bundleando una versión vieja, declararlo como dependencia directa:

```bash
npm install -D @semantic-release/npm@latest semantic-release@latest
```

Verificar que quedó ≥ 13.1.0:

```bash
npm ls @semantic-release/npm
```

### Paso 2 — Editar `.github/workflows/release.yml`

Dos cambios: **(a)** agregar el permiso `id-token: write`, **(b)** actualizar npm a ≥ 11.5.1 antes del release.

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write          # ← NUEVO: habilita OIDC

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm install -g npm@latest   # ← NUEVO: npm >= 11.5.1 para OIDC
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # NPM_TOKEN ya NO es necesario una vez que OIDC funcione.
          # Dejarlo como fallback durante la transición; quitarlo al confirmar.
        run: npx semantic-release
```

> **Importante:** durante la transición, **no borrar** el secret `NPM_TOKEN` todavía. Token y OIDC pueden coexistir; el token queda como red de seguridad.

### Paso 3 — Configurar el Trusted Publisher en npm

1. Ir a [npmjs.com](https://www.npmjs.com) → paquete **claude-code-arcane** → **Settings**.
2. Sección **Trusted Publishers** (o *Publishing access*).
3. **Add trusted publisher** → GitHub Actions:
   - **Organization / user:** `SebastianLuser`
   - **Repository:** `claude-code-arcane`
   - **Workflow filename:** `release.yml`
   - **Environment:** (dejar vacío salvo que el job use un `environment:`)
4. Guardar.

### Paso 4 — Release de prueba (additive, sin riesgo)

Con el token todavía presente como fallback:

```bash
git commit --allow-empty -m "fix: test trusted publishing via OIDC"
git push origin main
```

Revisar el log del step **Release** en Actions:
- ✅ Si publica vía OIDC (suele loguear `provenance` / autenticación OIDC) → migración OK.
- ❌ Si falla pidiendo token (`ENONPMTOKEN`) → el soporte aún tiene asperezas; **revertir** y seguir con token.

### Paso 5 — Quitar el token (solo si el Paso 4 fue verde)

1. En GitHub → Settings → Secrets → borrar `NPM_TOKEN`.
2. En npm → Access Tokens → borrar el token de automatización.
3. Commit confirmando que ya no se usa el token.

---

## 4. Rollback

Si algo falla después de migrar:

1. Recargar el secret `NPM_TOKEN` (regenerar token Classic Automation en npm).
2. Revertir los cambios del `release.yml` (`git revert` del commit de migración).
3. El release vuelve a funcionar con token como antes.

---

## 5. Checklist rápido

- [ ] `@semantic-release/npm` ≥ 13.1.0 instalado y verificado
- [ ] Issues #1069 / #1023 cerrados o con workaround
- [ ] `id-token: write` agregado al workflow
- [ ] Step `npm install -g npm@latest` agregado
- [ ] Trusted publisher configurado en npm (repo + `release.yml`)
- [ ] Release de prueba publicó vía OIDC (con token aún presente)
- [ ] Token `NPM_TOKEN` eliminado de GitHub y npm
- [ ] Documentado el cambio en CHANGELOG / README

---

## Referencias

- [npm trusted publishing GA — GitHub Changelog](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [Trusted publishing for npm packages — npm Docs](https://docs.npmjs.com/trusted-publishers/)
- [@semantic-release/npm releases (v13.1.0 = soporte OIDC)](https://github.com/semantic-release/npm/releases)
- [Issue #1069 — ENONPMTOKEN con OIDC](https://github.com/semantic-release/npm/issues/1069)
- [Issue #1023 — primer publish desde maintenance branch](https://github.com/semantic-release/npm/issues/1023)
