---
name: i18n-setup
description: "Internacionalización para apps Educabot (React+Vite/RN/Go/TS): i18next, react-i18next, expo-localization, ICU MessageFormat, pluralización, fechas/números (Intl), RTL, lazy-load de locales, backend i18n, extracción automática. Usar para: i18n, l10n, translations, locales, multi-idioma, ES/PT/EN, Argentina/Brasil."
---

# i18n-setup — Internationalization

Guía para soportar múltiples idiomas en apps Educabot. Mercados: **ES (AR/MX/CO/CL)**, **PT (BR)**, **EN** (international). Foco: separar contenido del código, pluralización correcta, formatos locales.

## Cuándo usar

- App con usuarios en >1 país o idioma
- Contenido dinámico de backend (emails, notifs, errores API)
- Formatos locales (fechas, moneda, números, plurales)
- UI con flexibilidad a RTL futuro (árabe/hebreo)

## Cuándo NO usar

- MVP monolingüe sin roadmap multi-país → hardcode ES, agregá i18n cuando haga falta
- Contenido user-generated (no se traduce — se muestra en su idioma original)

---

## 1. Stack — decisión

| Capa | Herramienta | Notas |
|------|-------------|-------|
| **Web (React+Vite)** | `i18next` + `react-i18next` | Default Educabot |
| **Mobile (RN/Expo)** | `i18next` + `react-i18next` + `expo-localization` | Mismo core, device locale auto-detect |
| **Backend (Go)** | `go-i18n/v2` (nicksnyder) | ICU-ish, bundles por locale |
| **Backend (TS)** | `i18next` server-side o `intl-messageformat` | Reutilizar bundles del front si simétrico |
| **Formatos** | `Intl.*` nativo (DateTimeFormat, NumberFormat, RelativeTimeFormat) | No imports externos |

**Alternativas consideradas:**
- `react-intl` (FormatJS): potente ICU, más verboso
- `lingui`: AOT extraction, bueno para teams grandes
- `next-intl`: solo Next — **no usar** (stack es Vite)

---

## 2. Estructura de archivos

```
locales/
├── es/
│   ├── common.json          # botones, labels, errores genéricos
│   ├── auth.json
│   ├── courses.json
│   └── notifications.json
├── pt-BR/
│   └── ...
└── en/
    └── ...
```

**Namespaces por feature** → lazy-load por ruta (bundle chico).

Convención de keys: `feature.component.element` o `feature.action.state`.
```json
{
  "courses.list.empty": "No tenés cursos todavía",
  "courses.create.button": "Crear curso",
  "courses.create.success": "Curso creado",
  "courses.create.error.duplicate": "Ya tenés un curso con ese nombre"
}
```

Evitar: keys genéricas como `button1`, `text_here` — se vuelven ilegibles.

---

## 3. Setup — React + Vite

```ts
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    supportedLngs: ['es', 'pt-BR', 'en'],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },  // React ya escapa
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
```

```tsx
// main.tsx
import './i18n';
```

### Uso
```tsx
import { useTranslation } from 'react-i18next';

function CoursesList() {
  const { t } = useTranslation('courses');
  return <h1>{t('list.empty')}</h1>;
}
```

### Lazy-load por feature
```tsx
const { t } = useTranslation('courses', { useSuspense: true });
```

---

## 4. Setup — React Native / Expo

```ts
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? 'es';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    'pt-BR': { translation: ptBR },
    en: { translation: en },
  },
  lng: deviceLocale,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
```

Para apps grandes: bundler split + dynamic import por locale (ahorro bundle).

---

## 5. Pluralización (ICU-ish)

```json
{
  "courses.count_one": "Tenés {{count}} curso",
  "courses.count_other": "Tenés {{count}} cursos",
  "courses.count_zero": "No tenés cursos"
}
```

```tsx
t('courses.count', { count: 0 })  // → "No tenés cursos"
t('courses.count', { count: 1 })  // → "Tenés 1 curso"
t('courses.count', { count: 5 })  // → "Tenés 5 cursos"
```

i18next usa reglas CLDR — arabic, russian, polish tienen más de 2 formas.

### Interpolación segura
```json
{ "welcome": "Hola <strong>{{name}}</strong>" }
```
```tsx
<Trans i18nKey="welcome" values={{ name: user.name }} components={{ strong: <strong /> }} />
```

Nunca interpolar HTML crudo en `t()` — XSS.

---

## 6. Fechas, números, monedas — Intl nativo

```ts
// helpers/format.ts
export const formatDate = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);

export const formatMoney = (amount: number, locale: string, currency: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

export const formatRelative = (d: Date, locale: string) => {
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  // ... etc
};
```

No hardcodear formatos. `Intl` está en todos los browsers modernos + Node 20+.

Para RN: habilitar Hermes intl (`jsEngine: "hermes"` + `intl: true` en `app.json`).

### Monedas por país
- AR → ARS
- BR → BRL
- MX → MXN
- Internacional → USD

Siempre guardar en DB: `amount` (integer minor units) + `currency` (ISO 4217). No convertir en runtime sin tasas.

---

## 7. Backend — Go

```go
import (
  "github.com/nicksnyder/go-i18n/v2/i18n"
  "golang.org/x/text/language"
)

bundle := i18n.NewBundle(language.Spanish)
bundle.RegisterUnmarshalFunc("json", json.Unmarshal)
bundle.LoadMessageFile("locales/es.json")
bundle.LoadMessageFile("locales/pt-BR.json")

// por request
lang := c.GetHeader("Accept-Language")
localizer := i18n.NewLocalizer(bundle, lang, "es")

msg, _ := localizer.Localize(&i18n.LocalizeConfig{
  MessageID: "course.created",
  TemplateData: map[string]string{"Name": course.Name},
  PluralCount: 1,
})
```

### Respuestas de error traducidas
```go
type APIError struct {
  Code    string `json:"code"`         // "course.duplicate"
  Message string `json:"message"`      // ya traducido
}
```

Alternativa: backend devuelve solo `code`, frontend traduce. Preferible para errores con UI compleja.

---

## 8. Emails / notificaciones (backend multi-canal)

Template por locale:
```
templates/
  course_assigned/
    es.mjml
    pt-BR.mjml
    en.mjml
```

Resolver locale del user al enviar:
```ts
const locale = user.preferredLocale ?? user.tenant.defaultLocale ?? 'es';
const html = renderTemplate('course_assigned', locale, data);
```

Siempre **fallback** a default si falta una key — nunca fallar silencioso.

Ver skills `/email-service` y `/notification-service`.

---

## 9. Detección + persistencia de idioma

Orden típico:
1. Query param (`?lng=pt-BR`) — útil para links compartidos
2. User preference (DB — si logged in)
3. Cookie / localStorage (session anterior)
4. Browser / device locale
5. Fallback `es`

```ts
// al login, sincronizar
await api.patch('/me', { preferredLocale: i18n.language });
```

Al cambiar idioma: `i18n.changeLanguage('pt-BR')` + persistir.

---

## 10. RTL (futuro-proof)

Hoy Educabot no tiene locales RTL, pero:
- Usar `start`/`end` en CSS en vez de `left`/`right` (`margin-inline-start`)
- No asumir dirección del texto en componentes
- Test con `dir="rtl"` para detectar leaks tempranos

```tsx
document.documentElement.dir = i18n.dir(i18n.language);  // 'ltr' | 'rtl'
```

---

## 11. Extracción automática de keys

Evitar mantener JSONs a mano. Opciones:

### i18next-parser
```json
{
  "scripts": {
    "i18n:extract": "i18next-parser 'src/**/*.{ts,tsx}' -o 'locales/$LOCALE/$NAMESPACE.json'"
  }
}
```

Corre en CI → fail si hay keys en código sin existir en JSON.

### Lingui (alternativa)
Macro en build-time, AOT, buena DX para teams grandes.

---

## 12. Flujo de traducción (proceso)

```
Dev agrega key → ES source (canónico)
  ↓
i18n:extract → detecta keys nuevas en JSON
  ↓
Export a plataforma (Crowdin / Lokalise / POEditor)
  ↓
Traductores completan
  ↓
Import back → PR automatizado
  ↓
Review + merge
```

**Crowdin** / **Lokalise** integran con GitHub via Actions. Para teams pequeños, Google Sheets + script custom funciona.

Mantener **ES como fuente de verdad** — todas las keys se crean primero en ES.

### Context para traductores
```json
{
  "courses.create.button": {
    "message": "Crear curso",
    "description": "Botón principal en /courses, abre modal"
  }
}
```

Muchas plataformas soportan comments/context — clave para traducciones buenas.

---

## 13. Testing

### Unit
```ts
// forzar locale en test
i18n.changeLanguage('pt-BR');
expect(t('courses.list.empty')).toBe('Você ainda não tem cursos');
```

### Missing keys
Configurar `saveMissing: true` en dev + hook que falle CI si se detectan missing.

### Visual regression
Screenshots en cada locale para detectar overflows (alemán/portugués tienden a ser más largos).

### Pseudo-localization
Locale `xx-XX` que agrega acentos y alarga strings → detectar hardcodes sin traducir:
```
"Create course" → "[Çrȩȧțȩ çǿųřşȩ - !!! ]"
```

---

## 14. Performance

- **Lazy-load namespaces** por ruta (no cargar todo el diccionario)
- **Pre-render** del locale del user en SSR si aplica
- **CDN** para archivos de locale (cache larga, cache-bust por versión)
- **Tree-shake** Intl.Collator si no se usa (raro)

---

## 15. Seguridad

- [ ] Nunca interpolar HTML del user en `t()` — usar `<Trans>` + components
- [ ] Validar locale recibido del cliente contra allowlist (evitar `../../../etc/passwd`)
- [ ] Templates de email: escape default, permitir solo tags seguros
- [ ] Logs con datos del user: loggear key + locale, no el texto renderizado (PII potencial)

---

## 16. Anti-patterns

- ❌ Hardcodear strings mezclados con `t()` (inconsistencia)
- ❌ Concatenar strings traducidos (`t('hello') + ' ' + userName`) → usar interpolación
- ❌ Keys genéricas (`label1`, `error_here`) → ilegibles para traductores
- ❌ No usar plurales de i18next → "1 cursos" en UI
- ❌ Formatear fecha/moneda a mano en vez de `Intl`
- ❌ Backend devuelve mensaje en un solo idioma y el front lo muestra tal cual
- ❌ Sin fallback → key faltante = UI rota
- ❌ Cambiar idioma sin persistir → pierde al recargar
- ❌ Subir JSONs editados a mano a prod sin review de traductor
- ❌ Asumir que 1 idioma = 1 locale (es-AR ≠ es-MX para moneda/fechas)
- ❌ Mezclar locale BCP47 con ISO 639 (usar siempre BCP47: `pt-BR`, no `pt_br`)

---

## 17. Checklist review

```markdown
- [ ] Stack elegido (i18next para web+mobile, go-i18n para backend)
- [ ] Namespaces por feature
- [ ] Pluralización con keys `_one`/`_other`/`_zero`
- [ ] Formatos con Intl (fechas, números, moneda)
- [ ] Detección + persistencia de idioma (user.preferredLocale)
- [ ] Templates email/notifs por locale con fallback
- [ ] Extracción automática en CI
- [ ] Missing keys fallan en CI
- [ ] Pseudo-locale para testing
- [ ] Plataforma de traducción integrada (Crowdin/Lokalise)
- [ ] ES como fuente de verdad
```

---

## 18. Output final

```
✅ i18n setup — Alizia (web + RN)
   🌍 Locales: es (AR default), pt-BR, en
   📦 i18next + react-i18next + expo-localization
   🗂️  Namespaces: common, auth, courses, notifications (lazy por ruta)
   🔢 Plurales CLDR + Intl.NumberFormat/DateTimeFormat
   🔤 Backend Go: go-i18n/v2, emails con templates por locale
   🤖 Extracción: i18next-parser en CI, missing → fail
   🌐 Crowdin conectado a GitHub (PR auto al completar)

Próximos pasos:
  1. Pseudo-locale xx-XX en staging para detectar hardcodes
  2. Visual regression por locale (skill /visual-regression)
  3. Playbook para agregar nuevo locale (roadmap: MX, CO)
```

## Delegación

**Coordinar con:** `frontend-architect`, `mobile-architect`, `backend-architect`, `product-manager`, `content-ops`
**Reporta a:** `frontend-architect`

**Skills relacionadas:**
- `/email-service` — templates multi-locale
- `/notification-service` — mensajes por canal y locale
- `/feature-flags` — rollout de nuevo idioma gradual
- `/visual-regression` — detectar overflows por locale
- `/accessibility` — lang attribute, screen reader correcto
