---
name: linkedin-optimize
description: "Optimize a LinkedIn profile to attract recruiters and rank in search — headline, About, experience with KPIs, keywords, value proposition and a 30-second pitch. No LinkedIn Premium needed. Triggers: optimizar LinkedIn, mejorar perfil LinkedIn, headline LinkedIn, about LinkedIn, LinkedIn para reclutadores, LinkedIn SEO, pitch profesional."
argument-hint: "[section | full] (paste your current profile)"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# LinkedIn Optimize — Perfil que atrae oportunidades

Optimizás un perfil de LinkedIn para que (1) ranquee en las búsquedas de recruiters y (2) convenza al humano que lo abre. Trabajás contra el **perfil maestro** (`01-Perfiles/`) y lo que el usuario pega de su perfil actual.

> **Importante:** Claude no accede a LinkedIn ni edita el perfil directamente. El usuario pega/sube el contenido actual; vos generás el texto optimizado para que lo copie/pegue.

## Cómo traer tu perfil a Claude

La forma más completa: en LinkedIn → **Recursos / More → Save to PDF** (exporta el perfil entero) y subí ese PDF a Claude. Alternativa: copiar/pegar headline + About + experiencia. Con el PDF, podés pedir una **auditoría contra JDs reales**:

> "Audita mi perfil de LinkedIn (adjunto) contra JDs de [rol] senior en [empresas objetivo]. Encontrá gaps en headline, About y Experience: keywords faltantes, framing de identidad equivocado, credenciales enterradas. Después reescribí headline y About para posicionarme como **builder**, optimizado para la búsqueda de recruiters."

**Framing de identidad:** posicionate como alguien que *construye/entrega* (builder), no como una lista de tareas. El headline y el About deben gritar resultados e identidad, no responsabilidades.

## Las 7 áreas de optimización

Cubrí estas siete (el usuario puede pedir una con `[section]` o todas con `full`):

### 1. Headline (titular)
- 220 caracteres. No solo el puesto: **rol + valor + keywords**.
- Patrón: `{Rol} | {especialidad/stack} | {valor o a quién ayudás}`.
- Las keywords del headline pesan fuerte en el ranking de búsqueda.

### 2. About (sección "Acerca de")
- Primera 2–3 líneas son las que se ven sin "ver más": que enganchen.
- Estructura: gancho → qué hacés y para quién → 2–3 logros con número → stack/keywords → CTA suave.
- Primera persona, tono humano, escaneable (párrafos cortos o bullets).

### 3. Experiencia con KPIs
- Cada rol con bullets de **logros cuantificables**, no responsabilidades.
- Mismo principio que el CV: verbo de acción + métrica + impacto.
- Incluí keywords de tu industria/rol en los bullets.

### 4. Keywords estratégicas (LinkedIn SEO)
- Identificá las keywords que los recruiters de tu rol buscan.
- Distribuilas en headline, About, experiencia, y la sección Skills.
- Las **Skills** (hasta 50, fijá las 3 top) alimentan el match con búsquedas y endorsements.

### 5. Propuesta de valor única
- Qué te diferencia: combinación de skills, dominio, resultados. Una frase clara que sintetiza "por qué vos".

### 6. Pitch de 30 segundos
- Versión hablada de tu propuesta de valor: quién sos, qué hacés/resolvés, qué buscás. Para mensajes, networking y el "contame de vos".

### 7. Review ATS / searchability
- Foto profesional, banner, URL personalizada, "Open to work" configurado (público o solo-recruiters), ubicación y rol objetivo seteados.
- Perfil completo = más alcance (LinkedIn premia completitud).
- Sin gaps inexplicados; títulos consistentes con cómo se busca el rol.

## Proceso

1. Leer el perfil maestro + lo que el usuario pega de su LinkedIn actual.
2. Definir el/los **rol(es) objetivo** y sus keywords (reusá `cv-tailor/references/ats-keywords.md` para el método).
3. Generar el contenido optimizado por sección (la/s que pida).
4. Entregar listo para copiar/pegar + un checklist de la review (área 7).
5. Opcional: guardar el output en `01-Perfiles/LinkedIn.md` para versionarlo.

## Idioma

LinkedIn en **inglés** si apuntás a roles internacionales (mayor alcance), español si tu mercado es local. Se puede tener el About bilingüe.

## Reglas

- No inventar logros ni métricas — todo debe ser defendible.
- Keywords naturales, no stuffing.
- Recordar que no se puede acceder/editar LinkedIn: el output es para copiar/pegar.

## Handoff

Pedí aprobación (approval) antes de escribir `01-Perfiles/LinkedIn.md`. Cuando el contenido está READY para copiar/pegar, un buen siguiente paso es `/portfolio-site` para alinear el portfolio web.
