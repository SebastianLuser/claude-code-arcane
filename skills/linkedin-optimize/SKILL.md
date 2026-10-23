---
name: linkedin-optimize
description: "Optimize a LinkedIn profile to attract recruiters and rank in search - headline, About, experience with KPIs, keywords, value proposition and a 30-second pitch. No LinkedIn Premium needed. Triggers: optimizar LinkedIn, mejorar perfil LinkedIn, headline LinkedIn, about LinkedIn, LinkedIn para reclutadores, LinkedIn SEO, pitch profesional."
argument-hint: "[section | full] (paste your current profile)"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# LinkedIn Optimize - Perfil que atrae oportunidades

Optimizás un perfil de LinkedIn para que (1) ranquee en las búsquedas de recruiters y (2) convenza al humano que lo abre. Trabajás contra el **perfil maestro** (`01-Perfiles/`) y lo que el usuario pega de su perfil actual.

> **Importante:** Claude no accede a LinkedIn ni edita el perfil directamente. El usuario pega/sube el contenido actual; vos generás el texto optimizado para que lo copie/pegue.

## Cómo traer tu perfil a Claude

La forma más completa: en LinkedIn → **Recursos / More → Save to PDF** (exporta el perfil entero) y subí ese PDF a Claude. Alternativa: copiar/pegar headline + About + experiencia. Con el PDF, podés pedir una **auditoría contra JDs reales**:

> "Audita mi perfil de LinkedIn (adjunto) contra JDs de [rol] senior en [empresas objetivo]. Encontrá gaps en headline, About y Experience: keywords faltantes, framing de identidad equivocado, credenciales enterradas. Después reescribí headline y About para posicionarme como **builder**, optimizado para la búsqueda de recruiters."

**Framing de identidad:** posicionate como alguien que *construye/entrega* (builder), no como una lista de tareas. El headline y el About deben gritar resultados e identidad, no responsabilidades.

## Las 7 áreas de optimización

Cubrí estas siete (el usuario puede pedir una con `[section]` o todas con `full`):

### 1. Headline (titular)
- Usá todo el largo que permite el editor (muestra el contador; hoy ronda los 220 caracteres). No solo el puesto: **rol + valor + keywords**.
- Evitá abrir con "Helping X do Y" / "Ayudo a X a Y": la mitad de los perfiles arranca así. Dá tres opciones.
- Patrón: `{Rol} | {especialidad/stack} | {valor o a quién ayudás}`.
- Las keywords del headline pesan fuerte en el ranking de búsqueda.

### 2. About (sección "Acerca de")
- Las primeras 2 líneas son lo único que se ve sin "ver más": para la mayoría de los lectores son todo el About. Que digan qué resolvés y para quién. Sin "apasionado por", sin bio en tercera persona, sin abrir con tu nombre.
- Estructura: gancho → qué hacés y para quién → 2-3 logros con número → stack/keywords → CTA suave.
- Primera persona, tono humano, escaneable (párrafos cortos o bullets). Apuntá a menos de ~1.400 caracteres aunque entre más.

### 3. Experiencia con KPIs
- Cada rol con bullets de **logros cuantificables**, no responsabilidades.
- Mismo principio que el CV: verbo de acción + métrica + impacto.
- Incluí keywords de tu industria/rol en los bullets.

### 4. Keywords estratégicas (LinkedIn SEO)
- Identificá las keywords que los recruiters de tu rol buscan.
- Distribuilas en headline, About, experiencia, y la sección Skills.
- Las **Skills** (hasta 100) alimentan el match con búsquedas y endorsements. Las primeras que se ven tienen que ser las tres por las que querés que te contraten; el resto es ruido.

### 5. Propuesta de valor única
- Qué te diferencia: combinación de skills, dominio, resultados. Una frase clara que sintetiza "por qué vos".

### 6. Pitch de 30 segundos
- Versión hablada de tu propuesta de valor: quién sos, qué hacés/resolvés, qué buscás. Para mensajes, networking y el "contame de vos".

### 7. Review ATS / searchability
- Foto profesional, banner, URL personalizada, "Open to work" configurado (público o solo-recruiters), ubicación y rol objetivo seteados.
- Perfil completo = más alcance (LinkedIn premia completitud).
- Sin gaps inexplicados; títulos consistentes con cómo se busca el rol.

## Score de 100 puntos

En modo `full`, puntuá el perfil **antes** de reescribir y mostrá la tabla. Sé honesto: la mayoría de los perfiles queda en 30-40 en la primera pasada, y un score generoso no le sirve a nadie.

| Ítem | Pts | Puntaje completo |
|---|---|---|
| Headline | 12 | Dice a quién ayudás o qué resolvés, trae una prueba, no es solo el puesto, usa el largo disponible |
| About, primeras 2 líneas | 10 | Nombran el problema del lector; sin "apasionado por", sin tercera persona |
| About, cuerpo | 10 | A un lector: su problema, qué hacés, un número como prueba, qué hacer después |
| Rol actual | 10 | Una línea de alcance + 2-3 bullets de resultados con número (no tareas) |
| Actividad | 10 | Posteó o comentó en los últimos 7 días; un feed vacío parece perfil abandonado |
| Featured | 8 | Tres ítems: el mejor post, una prueba (proyecto, demo), la forma de contactarte |
| Profundidad de experiencia | 8 | Últimos dos roles detallados; lo de más de 10 años, una línea |
| Recomendaciones | 8 | Al menos tres de los últimos dos años, que nombren un resultado concreto |
| Banner | 6 | Una línea de posicionamiento y una forma de contacto; no el default |
| Foto | 6 | La cara ocupa buena parte del cuadro, ojos visibles, de los últimos dos años |
| Skills | 6 | Las primeras que se ven son las tres por las que te quieren contratar |
| Contacto | 6 | URL personalizada, email o link que funcione, mismo handle que en GitHub/portfolio |

Reescribí en orden de **puntos perdidos**, no todo junto: el usuario tiene que pegar cada parte. Al final re-puntuá y mostrá el delta real: si llega a 88, decí 88 y qué falta (recomendaciones, banner, historial de actividad: nada que una reescritura pueda crear).

## Proceso

1. Leer el perfil maestro + lo que el usuario pega de su LinkedIn actual.
2. Definir el/los **rol(es) objetivo** y sus keywords (reusá `cv-tailor/references/ats-keywords.md` para el método).
3. En `full`: score de 100 puntos.
4. Generar el contenido optimizado por sección (la/s que pida), pasado por `/content-humanizer` (`.claude/skills/content-humanizer/scripts/humanize.py` + `detect.py` de la misma carpeta) antes de mostrarlo.
5. Entregar listo para copiar/pegar + un checklist de la review (área 7) + el re-score.
6. Opcional: guardar el output en `01-Perfiles/LinkedIn.md` para versionarlo.

## Idioma

LinkedIn en **inglés** si apuntás a roles internacionales (mayor alcance), español si tu mercado es local. Se puede tener el About bilingüe.

## Reglas

- No inventar logros ni métricas - todo debe ser defendible.
- Keywords naturales, no stuffing.
- Recordar que no se puede acceder/editar LinkedIn: el output es para copiar/pegar.
- Rubric y orden de reescritura adaptados de linkedin-agent-skill de Jake Schincariol (MIT).

## Handoff

Pedí aprobación (approval) antes de escribir `01-Perfiles/LinkedIn.md`. Cuando el contenido está READY para copiar/pegar, un buen siguiente paso es `/portfolio-site` para alinear el portfolio web.
