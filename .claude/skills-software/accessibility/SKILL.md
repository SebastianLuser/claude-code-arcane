---
name: accessibility
description: "Accesibilidad web/mobile para apps Educabot (React+Vite/RN): WCAG 2.2 AA, ARIA, keyboard nav, focus management, screen readers (NVDA/VoiceOver/TalkBack), contraste, motion-reduce, forms, testing automatizado (axe/Lighthouse) + manual. Foco educativo: alumnos con discapacidad. Usar para: a11y, accessibility, wcag, aria, screen reader, keyboard, contrast, inclusive design."
---

# accessibility — Web & Mobile Accessibility

Guía de accesibilidad para apps Educabot. Mercado: estudiantes con discapacidad visual, motora, auditiva, cognitiva. Target: **WCAG 2.2 nivel AA** mínimo. EdTech tiene obligación moral y legal (Ley 26.378 AR, LBI BR, Section 508 US).

## Cuándo usar

- Cualquier UI con usuarios reales (todas)
- Nuevas pantallas/componentes
- Audits previo a release
- Reportes de usuarios con asistencia técnica
- Componentes en `packages/ui` (impacto multiplicado)

## Cuándo NO usar

- Herramientas internas de un equipo small + sano (igual conviene básicos)
- POCs throwaway

---

## 1. WCAG 2.2 AA — los 13 esenciales

| # | Criterio | Ejemplo de fallo |
|---|----------|------------------|
| 1.1.1 | Alt text en imágenes informativas | `<img src="logo.png">` sin alt |
| 1.3.1 | Estructura semántica | `<div onclick>` en vez de `<button>` |
| 1.4.3 | Contraste 4.5:1 texto / 3:1 grandes | gris claro sobre blanco |
| 1.4.10 | Reflow 320px sin scroll horizontal | layout fijo 1280px |
| 1.4.11 | Contraste 3:1 en componentes/iconos | borde gris pálido en input |
| 2.1.1 | Todo accesible por teclado | dropdown solo hover |
| 2.4.3 | Focus order lógico | tab order salta sin sentido |
| 2.4.7 | Focus visible | `outline: none` sin reemplazo |
| 2.4.11 | Focus no oculto por sticky | navbar tapa el botón focuseado |
| 2.5.5 | Touch target 24x24 (AA) o 44x44 (mejor) | iconos de 16px en mobile |
| 3.3.1 | Errores identificables | "error" sin decir cuál |
| 3.3.2 | Labels en forms | input sin label |
| 4.1.2 | Roles/states correctos | toggle sin `aria-pressed` |

Lista corta — si se cumplen, evitás 80% de issues comunes.

---

## 2. HTML semántico primero

ARIA es para parchear. Lo nativo siempre gana.

```tsx
// ❌ mal
<div className="btn" onClick={save}>Guardar</div>

// ✅ bien
<button type="button" onClick={save}>Guardar</button>

// ❌ mal — checkbox custom sin role
<div className="check" onClick={toggle}>{ok ? '✓' : ''}</div>

// ✅ bien — input nativo, estilo via :checked
<label>
  <input type="checkbox" checked={ok} onChange={toggle} />
  Acepto términos
</label>
```

Reglas clave:
- `<button>` para acciones, `<a href>` para navegación
- `<form>` siempre, no `<div>` con submit handler
- Headings jerárquicos: 1 `<h1>` por página, no saltear niveles
- Listas con `<ul>/<ol>` no `<div>` repetidos
- Tablas con `<th scope>` para headers

---

## 3. ARIA — solo cuando hace falta

> **Primera regla de ARIA: no uses ARIA.** (W3C)

Casos legítimos:
- Componentes sin equivalente nativo (tabs, combobox, treeview)
- Estados dinámicos (`aria-expanded`, `aria-busy`)
- Live regions (`aria-live="polite"` para notificaciones)

```tsx
// modal accesible mínimo
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <h2 id="modal-title">Confirmar acción</h2>
  <p id="modal-desc">Esta acción no se puede deshacer.</p>
  <button onClick={cancel}>Cancelar</button>
  <button onClick={confirm}>Confirmar</button>
</div>
```

Anti-patterns:
- `aria-label="button"` en un `<button>` (redundante)
- `role="button"` en un `<button>` (redundante)
- ARIA mal usado peor que sin ARIA — hace inválido el HTML para AT

---

## 4. Keyboard navigation

### Reglas
- Todo lo clickeable es focuseable y activable con Enter/Space
- Tab order = orden visual (no `tabIndex` raros)
- Escape cierra modals/menus
- Arrow keys dentro de menus/tabs/listas (composite widget)
- Focus trap en modals (no escapar por tab)
- Focus restore al cerrar modal (volver al disparador)

### Focus trap (modal)
```tsx
import { useFocusTrap } from '@mantine/hooks'; // o react-focus-lock

const trapRef = useFocusTrap(open);
return open ? <div ref={trapRef} role="dialog">...</div> : null;
```

### Skip link (top de la página)
```tsx
<a href="#main-content" className="sr-only-focusable">Saltar al contenido</a>
<main id="main-content">...</main>
```

### Focus visible custom
```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}
button:focus:not(:focus-visible) { outline: none; }  /* no focus ring por click */
```

Nunca `outline: none` sin reemplazo.

---

## 5. Forms accesibles

```tsx
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  required
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : 'email-help'}
  autoComplete="email"
/>
<p id="email-help">Te enviaremos un código de confirmación.</p>
{error && <p id="email-error" role="alert">{error}</p>}
```

Checklist:
- [ ] Cada input tiene `<label>` (no placeholder como label)
- [ ] `autoComplete` con tokens correctos (`email`, `name`, `current-password`)
- [ ] `inputmode` para teclados mobile (`numeric`, `decimal`, `tel`)
- [ ] Errores con `role="alert"` o `aria-live="assertive"`
- [ ] Errores ligados via `aria-describedby`
- [ ] Required marcado tanto visualmente (*) como con `required`
- [ ] Submit deshabilitado con razón comunicada (no solo `disabled`)
- [ ] Mensajes claros: "Email inválido" mejor que "Error 400"

---

## 6. Color & contraste

### Targets
- Texto normal (<18pt): **4.5:1**
- Texto grande (≥18pt o ≥14pt bold): **3:1**
- UI components (bordes input, iconos significativos): **3:1**

### Tools
- Chrome DevTools → Inspect → ratio se calcula
- `axe DevTools` flagea fallos
- Figma plugins: Stark, Able

### No color-only
La info NO puede transmitirse solo por color:
```tsx
// ❌ mal — colorblind no distingue
<span style={{color: status === 'ok' ? 'green' : 'red'}}>●</span>

// ✅ bien — color + ícono + texto
{status === 'ok'
  ? <><Icon name="check"/> OK</>
  : <><Icon name="x"/> Error</>}
```

### Dark mode
Diseñar contraste para ambos. No invertir colores brutalmente — cada tema es su diseño.

---

## 7. Motion & animaciones

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// React: detectar
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
{reduced ? <Static /> : <Animated />}
```

- No autoplay video con sonido
- No flashing > 3x/sec (riesgo de epilepsia fotosensitiva)
- Parallax/scroll-jacking → opt-in

---

## 8. Screen readers

### Cómo funcionan
NVDA (Win), JAWS (Win), VoiceOver (Mac/iOS), TalkBack (Android). Recorren el árbol de accesibilidad (DOM + ARIA + semántica).

### Anuncios dinámicos
```tsx
// notificación que aparece — lectura sin perder foco
<div role="status" aria-live="polite">{message}</div>

// error crítico — interrumpe
<div role="alert">{criticalError}</div>
```

### Texto solo para AT
```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```

```tsx
<button>
  <Icon name="trash" aria-hidden="true" />
  <span className="sr-only">Eliminar curso</span>
</button>
```

### Imágenes
- Decorativas: `alt=""` (no `alt="image"`)
- Informativas: `alt` describe función/contenido
- Charts complejos: `alt` corto + `<figcaption>` o `aria-describedby` largo

---

## 9. React Native / Expo

```tsx
<Pressable
  accessible
  accessibilityRole="button"
  accessibilityLabel="Eliminar curso"
  accessibilityHint="Borra el curso permanentemente"
  accessibilityState={{ disabled: loading, busy: loading }}
  onPress={onDelete}
>
  <Icon name="trash" />
</Pressable>
```

### Roles importantes
`button`, `link`, `header`, `image`, `imagebutton`, `text`, `search`, `adjustable` (slider).

### Live regions
```tsx
<View accessibilityLiveRegion="polite">{message}</View>
```

### TalkBack/VoiceOver testing
- iOS Simulator: `Cmd+F5` → VoiceOver
- Android emulator: Settings → Accessibility → TalkBack
- Probar con device real al menos 1x por release

---

## 10. Touch targets (mobile)

WCAG 2.2 SC 2.5.8: mínimo **24×24px**, ideal **44×44px** (Apple HIG) o **48×48dp** (Material).

```tsx
// hit slop en RN
<Pressable hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
  <Icon size={20} />
</Pressable>
```

Espaciado entre targets: 8px mínimo para evitar mistaps.

---

## 11. Internationalization & a11y

- `<html lang="es">` (o el correcto del user) — lectores cambian voz
- `<span lang="en">React</span>` para palabras en otro idioma
- RTL: usar `dir="rtl"` + CSS logical (skill `/i18n-setup`)
- Números/fechas con `Intl` (lectores los dicen mejor)

---

## 12. Testing

### Automatizado (cubre ~30%)
```ts
// vitest + jest-axe
import { axe } from 'jest-axe';

test('no a11y violations', async () => {
  const { container } = render(<Login />);
  expect(await axe(container)).toHaveNoViolations();
});
```

```bash
# CLI
npx pa11y https://app.educabot.com/login
npx lighthouse https://app.educabot.com --only-categories=accessibility
```

CI: gate en PR si score < umbral o aparecen violations nuevas.

### Manual (cubre el resto)
**Checklist por PR de UI:**
1. Tab desde el top — todo lo interactivo es alcanzable
2. Enter/Space activa botones y links
3. Esc cierra modals
4. Zoom 200% sin layout roto
5. Modo monocromo (desat) — info se entiende sin color
6. Screen reader una vez por flujo nuevo
7. Mobile: targets ≥ 44px, gestos tienen alternativa de tap

### User testing
- Ideal: incluir usuarios con discapacidad en research (skill `/ux-research`)
- ONGs locales (FAICA AR, Fundación Dorina Nowill BR) consultan a cambio de donación

---

## 13. Componentes complejos — recetas

| Componente | Lib recomendada | Por qué |
|------------|-----------------|---------|
| Modal/dialog | Radix UI / Headless UI | Focus trap + ARIA correcto |
| Combobox/autocomplete | Radix Combobox / downshift | Standar WAI-ARIA pattern |
| Tabs | Radix Tabs | Roving tabindex correcto |
| Date picker | react-aria + react-aria-components | Adobe-grade a11y |
| Tooltip | Radix Tooltip | Hover + focus + escape |
| Dropdown menu | Radix DropdownMenu | Arrow nav + escape + focus restore |

**Regla:** no rolees tu propio combobox/datepicker/tree. La especificación WAI-ARIA es brutal; las libs maduras la implementan.

---

## 14. Documentación EdTech-específica

Estudiantes con discapacidad usan Educabot:
- **Dislexia:** fonts legibles (sans-serif, ≥16px), interlineado 1.5, evitar justificado, pesos no muy finos
- **Baja visión:** zoom 200%+, alto contraste, focus muy visible
- **Motora:** keyboard-only, voice control, switch (no clicks rápidos exigidos)
- **TEA/cognitiva:** UI predecible, sin animaciones intrusivas, lenguaje claro, no countdown agresivos en tareas

### En tareas/quizzes
- Tiempo extendido configurable por user/tenant
- Pause permitido salvo razón fuerte
- Lectura en voz alta de enunciados (TTS)
- Sin "trampas" UX (drag-only sin alternativa)

---

## 15. Anti-patterns

- ❌ `outline: none` sin focus alternativo visible
- ❌ Placeholder como label ("desaparece" al typear)
- ❌ Iconos sin label accesible (`<button><Icon/></button>` sin sr-only)
- ❌ Modal sin focus trap (tab escapa al fondo)
- ❌ `<div onClick>` en vez de `<button>`
- ❌ Texto en imágenes (no leíble, no traducible, no zoomeable)
- ❌ `tabIndex` positivos (rompen orden natural)
- ❌ ARIA contradiciendo la semántica (`role="button"` en `<a>`)
- ❌ Color-only para estados (verde/rojo sin texto/icono)
- ❌ Auto-rotate carousels sin pausa
- ❌ Toast que se va antes que screen reader lea
- ❌ Formularios sin `<form>` (Enter no envía)
- ❌ Touch targets < 24px en mobile
- ❌ Animaciones sin respetar `prefers-reduced-motion`
- ❌ "Accesible" probado solo con axe — falta validación real con AT

---

## 16. Checklist review

```markdown
- [ ] HTML semántico (button/a/form correctos)
- [ ] Headings jerárquicos sin saltos
- [ ] Labels en todos los inputs
- [ ] Contraste AA verificado (texto + UI)
- [ ] Focus visible y orden lógico
- [ ] Keyboard-only navegable end-to-end
- [ ] Modals con focus trap + escape + restore
- [ ] ARIA solo donde la semántica nativa no alcanza
- [ ] alt en imágenes (vacío si decorativas)
- [ ] Live regions para cambios dinámicos
- [ ] Touch targets ≥ 24px
- [ ] prefers-reduced-motion respetado
- [ ] Sin información solo por color
- [ ] axe-core en CI sin violations
- [ ] Manual test con NVDA o VoiceOver al menos 1x
- [ ] lang attribute correcto
```

---

## 17. Output final

```
✅ Accesibilidad — Alizia (web + RN)
   📜 Target: WCAG 2.2 AA
   🧱 Stack: Radix UI (web) + react-aria + accessibility props nativos (RN)
   🎨 Design system con contraste verificado, focus tokens
   ⌨️  Keyboard nav full + skip links + focus trap en modals
   🗣️  Screen reader: NVDA + VoiceOver checklist por PR de UI
   🤖 CI: jest-axe + lighthouse a11y score gate (≥95)
   🧪 Manual audit trimestral (incluye usuario AT real)

Próximos pasos:
  1. TTS integrado en lectura de enunciados (skill /tts-integration)
  2. Settings de tiempo extendido por tenant
  3. Game-day a11y: 1 día solo con teclado + screen reader
```

## Delegación

**Coordinar con:** `frontend-architect`, `mobile-architect`, `ui-lead`, `ux-researcher`, `product-manager`, `edtech-architect`
**Reporta a:** `ui-lead` / `accessibility-expert`

**Skills relacionadas:**
- `/design-system` — tokens de focus/contraste
- `/i18n-setup` — `lang` attribute + RTL
- `/ux-design` — research con usuarios AT
- `/qa-plan` — manual a11y checklist en regression
- `/component-library` — Radix/headless adoption
