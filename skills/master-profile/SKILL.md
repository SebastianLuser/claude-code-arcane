---
name: master-profile
description: "Build and maintain the master professional profile — the single source of truth (experience, skills with levels, projects, education, references, bios) that every CV, LinkedIn profile and portfolio derives from. Triggers: perfil maestro, master resume, cronologia laboral, single source of truth CV, mi experiencia profesional."
argument-hint: "[build | update | derive <role>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Master Profile — Single Source of Truth

Construís y mantenés el **perfil maestro**: el documento del que derivan todos los CVs, el LinkedIn y el portfolio. La regla de oro: **si algo cambia, se cambia acá primero** y de acá se sincroniza al resto.

Vive en `01-Perfiles/Perfil Maestro.md` dentro del career workspace. Los perfiles por rol (`Backend.md`, `Frontend.md`, etc.) son **vistas filtradas** del maestro, no fuentes independientes.

## Por qué existe

Mantener N CVs sincronizados a mano es la causa #1 de errores (fechas que no coinciden, logros que faltan en una versión). Con un maestro: editás un lado, derivás el resto. `/cv-tailor`, `/linkedin-optimize` y `/portfolio-site` consumen este archivo.

## Estructura del perfil maestro

Generá el archivo con estas secciones (todas las que apliquen):

1. **Personal info** — nombre, display name, headline actual, ubicación, email público vs personal, teléfono, LinkedIn, GitHub, portfolio. (El email *público* puede diferir del personal.)
2. **Bios** — tres largos: corto (hero/one-liner), medio (2–3 oraciones para "About"), largo (about page completo).
3. **Work experience** (más reciente primero) — por cada rol: empresa, período, ubicación/modalidad, producto, stack, manager/referencia, y **bullets de logros con número→contexto→resultado**.
4. **Education** — institución, período, foco.
5. **Certifications** — nombre, año, estado (completo/in progress).
6. **Skills consolidados con nivel** — agrupados (lenguajes, frameworks, infra, tooling) con nivel (Expert/Advanced/Proficient/…) y opcionalmente % para el portfolio.
7. **Projects** — tech, rol, highlights, link en vivo.
8. **Achievements / highlights** — premios, showcases, hitos.
9. **Languages** — idioma + nivel.
10. **References** — nombre, rol, relación, contacto.

## Modos

### `build` — Crear el maestro desde cero
1. Si no existe el workspace, sugerir `/job-hunt setup` primero.
2. Recolectar info por sección — preferí **entrevistar al usuario por bloques** (no un cuestionario gigante). Empezá por experiencia y skills.
3. Para cada logro, empujar a la forma **cuantificable**: "¿qué número podés ponerle? ¿comparado con qué? ¿qué resultado tuvo?". Un bullet sin métrica es una oportunidad perdida.
4. Escribir `01-Perfiles/Perfil Maestro.md`.
5. Sugerir derivar el primer perfil por rol: `/master-profile derive <role>`.

### `update` — Mantener al día
1. Leer el maestro actual.
2. Aplicar el cambio (nuevo rol, nuevo logro, ascenso, proyecto).
3. **Avisar qué derivados quedan desactualizados** (CVs por rol, LinkedIn, portfolio) y ofrecer re-derivarlos.

### `derive <role>` — Vista por rol
1. Leer el maestro.
2. Crear/actualizar `01-Perfiles/<Role>.md` con el template `Perfil` (ver `Templates/Perfil.md`): filtrar y reordenar la experiencia/skills/proyectos hacia ese rol, definir keywords objetivo, score mínimo y mercado.
3. Este perfil por rol es el `perfil_base` que después usa `/cv-tailor`.

## Principios de redacción

- **Logros, no responsabilidades.** "Reduje latencia de servidor 25%" > "Encargado del servidor".
- **Verbos de acción + métrica + impacto.** Owned, shipped, led, reduced, increased, scaled.
- **Verdad verificable.** Nada que no puedas defender en una entrevista.
- **Inglés para roles internacionales**, español cuando aplique. El maestro puede tener los valores en inglés (van directo a CV/portfolio) y las meta-notas en español.

## Reglas

- Una sola fuente de verdad: no dejar que un CV por rol "evolucione" por fuera del maestro.
- No inventar logros ni métricas — si el usuario no tiene el número, marcarlo como pendiente, no fabricarlo.
- Separar email público de personal; no exponer datos sensibles en archivos que vayan a un remoto.

## Handoff

Confirmá con el usuario (approval) antes de escribir el perfil maestro o pisar derivados. Cuando el maestro está READY, derivá perfiles por rol y seguí con `/cv-tailor`, `/linkedin-optimize` o `/portfolio-site`.
