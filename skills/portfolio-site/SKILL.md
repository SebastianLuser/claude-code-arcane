---
name: portfolio-site
description: "Build or update a personal portfolio website from a single source-of-truth profile. Two modes: sync content into an existing portfolio repo, or scaffold a new portfolio site. Triggers: portfolio web, pagina personal, actualizar portfolio, sincronizar portfolio, crear portfolio, sitio personal de desarrollador, portfolio React."
argument-hint: "[sync | scaffold] [repo-path | --new]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch
---

# Portfolio Site — Portfolio web desde el source-of-truth

Generás o actualizás un **portfolio web personal** a partir de un único source-of-truth (`portfolio/Datos Portfolio Web.md` en el career workspace, derivado del perfil maestro). La regla: **el contenido se edita primero en el `.md`** y de ahí se sincroniza al sitio.

## El source-of-truth

`portfolio/Datos Portfolio Web.md` contiene, en una estructura estable, todo lo que va al sitio: personal info (con email **público** separado del personal), bios (corto/medio/largo), experiencia, educación, certificaciones, skills con niveles/%, proyectos (con links en vivo), achievements, idiomas, referencias. Si no existe, derivalo del perfil maestro (`/master-profile`).

Convención: **valores en inglés** (van directo al sitio) y meta-instrucciones en español.

## Modos

### `sync` — Actualizar un portfolio existente
Para cuando ya hay un repo de portfolio (ej. una React SPA con el contenido en `src/pages/*.js`, `src/data/*`, o similar).

1. Leer el source-of-truth y el repo destino.
2. Mapear cada sección del `.md` a dónde vive en el sitio (componentes/datos).
3. Detectar **drift**: qué está desactualizado en el sitio vs el `.md` (roles nuevos, fechas, proyectos, nivel de idioma). El source-of-truth manda.
4. Aplicar los cambios al sitio respetando su arquitectura y estilo de código existentes.
5. Verificar (build/preview) y resumir el diff.

### `scaffold` — Crear un portfolio nuevo
Para cuando no hay sitio todavía.

1. Preguntar el stack preferido (default sugerido: **sitio estático simple** — HTML/CSS o un framework liviano como Astro/Vite — fácil de hostear en GitHub Pages/Netlify).
2. Preguntar secciones deseadas (hero, about, experiencia, proyectos, skills, contacto).
3. Generar el proyecto consumiendo el source-of-truth como contenido.
4. Configurar deploy (GitHub Pages / Netlify) si el usuario quiere.
5. Documentar cómo correr `sync` a futuro.

## Secciones típicas

- **Hero** — nombre, headline, bio corto, links (GitHub/LinkedIn/email público).
- **About** — bio medio/largo.
- **Experience** — roles con highlights.
- **Projects** — los destacados, con tech, descripción corta y link en vivo.
- **Skills** — agrupados, con nivel/%.
- **Contact** — email **público** (nunca el personal), formulario o links.

## Reglas

- **El `.md` es la fuente.** Nunca editar el sitio sin reflejarlo en el source-of-truth (si no, vuelve el drift).
- Email **público** en el sitio, jamás el personal/teléfono.
- Respetar la arquitectura y el estilo del repo existente en modo `sync` — no reescribir todo.
- En `scaffold`, mantenerlo simple y rápido de hostear salvo que el usuario pida otra cosa.
- No subir datos sensibles; el portfolio es público.

## Handoff

Pedí aprobación (approval) antes de escribir en el repo del portfolio o scaffoldear un sitio nuevo. Cuando el sitio está READY/sincronizado, volvé a `/job-hunt status` para seguir con las aplicaciones.
