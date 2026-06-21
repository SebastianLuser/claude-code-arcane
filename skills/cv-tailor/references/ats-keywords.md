# ATS Keywords — Cómo extraer y mapear

Los Applicant Tracking Systems (Greenhouse, Lever, Workday, Workable, etc.) hacen un primer filtro automático antes de que un humano vea el CV. Entender cómo "leen" cambia el resultado.

## Cómo funciona un ATS (modelo mental)

- Parsea el CV a texto plano y lo indexa.
- Hace matching de **strings** y variantes contra la oferta y/o contra criterios del recruiter.
- Rankea o filtra candidatos por densidad/relevancia de keywords y por campos estructurados (título, fechas, ubicación).
- **Lo que rompe el parseo:** tablas, columnas, text boxes, headers/footers con datos, gráficos, iconos en lugar de texto, PDFs escaneados (imagen).

## Extracción de keywords del JD

1. **Hard skills / tecnologías** — lenguajes, frameworks, DBs, cloud, herramientas. Copiá la forma **literal** (React.js ≠ React ≠ ReactJS para un match exacto; cuando puedas, incluí la variante que usa la oferta).
2. **Responsabilidades / verbos** — "design REST APIs", "lead a team", "CI/CD pipelines".
3. **Metodologías** — Agile, Scrum, TDD, clean architecture.
4. **Seniority y años** — "5+ years", "senior", "lead".
5. **Soft skills explícitos** — communication, ownership, cross-functional.
6. **Señales de cultura / frases gatillo** — ej. "code-forward", "startup mentality", "high autonomy". Suelen indicar qué valoran y dan ángulo para el summary y la cover letter.

## Mapeo contra el perfil

| Keyword del JD | ¿Lo tengo? | Dónde lo demuestro (bullet/proyecto) | Acción |
|---|---|---|---|
| React.js | Sí | "Built React + TS frontends @ X" | resaltar arriba |
| Kubernetes | Parcial | exposición en CI/CD | mencionar honesto |
| Go | No | — | gap; no inventar |

- **Must-have que tenés** → arriba, con espacio, con la palabra exacta.
- **Must-have parcial** → mencionar con honestidad ("exposure to…").
- **Must-have que no tenés** → gap real; no lo inventes. Decidí si igual aplicás.

## Inyección natural (no stuffing)

- Cada keyword vive en un **bullet verdadero** con contexto y resultado.
- Una sección "Skills" lista las tecnologías (bien para el ATS), pero las importantes también deben aparecer en la experiencia (bien para el humano y para el ranking).
- Evitá listas de 40 tecnologías sin contexto: lee como relleno y diluye el ranking.

## Checklist de formato ATS-safe

- [ ] Una sola columna, sin tablas/text boxes.
- [ ] Headers de sección estándar (Experience, Skills, Education…).
- [ ] Fechas consistentes MM/YYYY.
- [ ] Texto seleccionable (no imagen) — el export de `/cv-ats-export` ya lo garantiza.
- [ ] Nombre del archivo profesional (`Nombre_Apellido_Empresa.pdf`).
- [ ] Contacto en el cuerpo, no en el header/footer del documento.
