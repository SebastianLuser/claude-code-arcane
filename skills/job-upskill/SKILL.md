---
name: job-upskill
description: "Aggregate skill gaps across all scored job applications, weigh them by lost match points, and build a prioritized study plan with real resources. Triggers: analizar mis gaps, plan de estudio, que me falta aprender, upskill, en que skills invertir, gaps de las postulaciones, heatmap de skills."
argument-hint: "[url | nota de aplicación]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Bash, WebFetch, WebSearch, Task
---

# /job-upskill - Análisis de gaps y plan de estudio

Detecta qué skills te están costando puntos de match en las ofertas reales y arma un plan de estudio priorizado. Adaptado del /upskill de MadsLorentzen/ai-job-search: en vez de un CSV, la evidencia sale del frontmatter y las secciones de las notas de `03-Aplicaciones/` del career workspace (rutas relativas al workspace: `--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Argumento: `$ARGUMENTS` (vacío = modo agregado; URL o nota = modo targeted)

## Antes del plan: ¿el gap es real o de presentación?

Este skill asume que la respuesta es estudiar. A veces no lo es: si la experiencia está en el perfil maestro pero no llega al CV, el plan de estudio manda al usuario a aprender meses lo que ya sabe.

En **modo agregado con 10+ aplicaciones resueltas**, lanzar primero el agente `career-strategist` (contexto fresco, read-only). Diagnostica el embudo completo y separa gap real de gap de presentación. Si el punto de fuga no es la etapa técnica, decílo antes del heatmap: el plan de estudio no es la palanca y conviene ir a `/cv-tailor` o `/interview-prep`.

Con menos de 10 resueltas, saltear: no hay volumen para un embudo y el propio agente lo va a rechazar. Seguí directo al modo agregado.

## Modo agregado (sin argumento)

1. **Recolectar evidencia.** Grep de `match_score:` en `03-Aplicaciones/*.md` (excluir `_index`; aceptar también el campo legacy `score:` de notas viejas). De cada nota leer: `match_score`, `estado`, `perfil`, y los gaps mencionados en las secciones "Match con mi perfil" / "Gaps reales" y los gaps reconocidos en `## Notas`.

2. **Canonicalizar.** Unificar sinónimos antes de agregar ("AWS" = "Amazon Web Services"; "K8s" = "Kubernetes"; "GCP" = "Google Cloud"). Un término canónico por gap.

3. **Ponderar.** `peso(gap) = Σ (100 - match_score)/100` sobre las notas que lo mencionan (la frecuencia queda implícita en la suma). Boost x1.5 por cada nota con `estado: rechazado` que lo mencione (señal real de mercado). Ofertas con score bajo exponen más gaps y pesan más.

4. **Clasificar** cada gap: `[tooling]` (frameworks, infra, CI/CD), `[domain]` (industria, arquitectura), `[soft]` (comunicación, liderazgo, idiomas), `[credential]` (títulos, certificaciones).

5. **Heatmap.** Ordenar por peso y cortar en Critical / High / Medium / Low por cuartiles (documentar los umbrales usados en el reporte). Mostrar el heatmap en el chat antes de seguir.

6. **Plan de estudio** solo para Critical y High (sumar Medium si hay menos de 5 gaps):
   - WebSearch por gap **incluyendo el año actual** en la query (ej. "best NestJS course 2026").
   - 2-3 recursos reales por gap, priorizando gratuitos/oficiales/hands-on. **Nunca inventar recursos: solo citar lo encontrado en resultados reales.**
   - Horas estimadas a proficiencia útil (rangos realistas, ej. "~20h") considerando la base existente del perfil (no arrancar de cero si ya hay fundamentos).
   - Secuenciar por ROI (peso/horas) y dependencias (prerequisitos primero, quick wins temprano).

7. **Reporte** en `07-Recursos/Upskill - YYYY-MM-DD.md`, previo approval del usuario sobre el heatmap:
   - Frontmatter: `tipo: upskill`, `fecha`, `aplicaciones_analizadas` (número), `perfiles` (lista).
   - Heatmap con peso y clasificación por gap.
   - Evidencia: por cada gap Critical/High, wikilinks a las notas de aplicación que lo mencionan.
   - Plan de estudio secuenciado con recursos, horas y dependencias.
   - Si existe un reporte anterior en `07-Recursos/`, sección "Desde el último reporte": gaps cerrados vs nuevos.

8. **No edita** notas de aplicaciones, perfiles ni dashboard. Solo crea el reporte.

## Modo targeted (`/job-upskill <url|nota>`)

1. Obtener el JD: nota existente → leer su "Match con mi perfil"; URL → `detail` del script que corresponda (`.claude/skills/job-scrape/scripts/getonbrd_search.py` o `linkedin_search.py`; si job-scrape no está instalado, WebFetch).
2. Comparar contra el perfil de `01-Perfiles/` que corresponda: gaps solo de esa oferta, clasificados.
3. Mini-plan: 1-2 recursos por gap (WebSearch, año actual), horas estimadas.
4. **Responder en el chat.** Guardar como `07-Recursos/Upskill - YYYY-MM-DD - <Empresa>.md` solo si el usuario lo pide (no llenar Recursos de reportes de una sola oferta).

## Reglas

- Nunca fabricar recursos ni estadísticas; todo sale de WebSearch real o de las notas.
- Reporte en el idioma de las notas del workspace, sin guiones largos, con wikilinks a las notas fuente.
- Los gaps `[credential]` (ej. título universitario) se reportan pero no entran al plan de estudio salvo pedido explícito (son decisiones de otra escala, no items de estudio semanal).

## Handoff

Reporte COMPLETE en `07-Recursos/`. Retomar el pipeline con `/job-aplicar` en las ofertas abiertas, o `/job-scrape` para una corrida nueva apuntando a los gaps que ya se están cerrando. Si el `career-strategist` ubicó la fuga fuera de la etapa técnica, el siguiente paso es ese (`/cv-tailor`, `/interview-prep` o `/job-search`), no el plan de estudio.
