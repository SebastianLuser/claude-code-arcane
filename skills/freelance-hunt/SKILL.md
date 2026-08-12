---
name: freelance-hunt
description: "Entry point for the freelance skillset: extends the career workspace with contracts and a Connects ledger, then routes to the right skill. Triggers: freelance, upwork, buscar proyectos como freelancer, conseguir clientes, pipeline freelance, setup freelance workspace, cuanto gano por hora."
argument-hint: "[setup | status | next]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Freelance Hunt - Orquestador del pipeline freelance

Sos el punto de entrada de la suite freelance. Detectás (o extendés) el career workspace, entendés en qué etapa está el usuario, y ruteás al skill correcto. No hacés todo vos - orquestás.

## Un solo workspace, no dos

El perfil **reutiliza el career workspace** de `+job-hunt` (default `./career-workspace/`, o env `CAREER_WORKSPACE`). No crea uno paralelo, y esto es deliberado: `01-Perfiles/` es la única fuente de verdad de la experiencia del usuario. Dos workspaces serían dos perfiles maestros divergiendo, que es exactamente el problema que el perfil maestro resuelve.

Lo que agrega el perfil freelance:

```
career-workspace/
  03-Aplicaciones/         ← compartida: empleos Y propuestas (discrimina `tipo:`)
  04-Empresas/             ← compartida: empresas Y clientes
  08-Contratos/            NUEVA: contratos activos, milestones, horas, change orders
  07-Recursos/
    Connects - YYYY.md     NUEVO: ledger del costo de postularse (Connects en Upwork,
                           bids en otras plataformas, horas en outreach directo)
  Templates/
    Propuesta.md           NUEVO
    Contrato.md            NUEVO
```

Una propuesta **es** una aplicación: vive en `03-Aplicaciones/` con `tipo: freelance`. Un cliente **es** una empresa: vive en `04-Empresas/`. Así `/job-outcome`, `/cold-outreach` y `/master-profile` funcionan sobre las dos mitades sin cambios.

Si el usuario no tiene `+job-hunt` instalado, el modo `setup` crea el árbol completo igual: el workspace no depende del otro perfil, solo lo comparte.

## Vocabulario de estados

Frontmatter `estado` para `tipo: freelance`:

`interesado → screeneado → propuesta_enviada → en_conversacion → contrato_activo → entregado`

Cierres: `ganado_cerrado | sin_respuesta | rechazado | descartado | disputa`

`descartado` es una decisión activa y se registra igual que una propuesta enviada: los descartes son la mitad de los datos que `/freelance-pipeline` necesita (ver `freelance-guardrails`, sección Registro). Los estados los mueve `/job-outcome`; ninguna otra skill marca `propuesta_enviada`.

## Modos

### `setup` - Preparar el workspace

1. Detectar si ya existe el career workspace. Si existe, **extenderlo**; si no, crear el árbol completo (mismo que `/job-hunt setup`).
2. Crear `08-Contratos/` y copiar `Propuesta.md` y `Contrato.md` desde `references/templates/` a `Templates/`.
3. Crear el ledger `07-Recursos/Connects - <año>.md` desde `references/templates/Connects.md`.
4. Agregar al `00-Dashboard.md` las secciones freelance (propuestas activas, contratos en curso, Connects del mes). Si el dashboard no existe, crearlo.
5. Preguntar y registrar en `01-Perfiles/` los **dos números que gobiernan todo el perfil**: el piso de tarifa neto y la capacidad semanal de horas facturables. Sin el piso, `/freelance-proposal` no puede validar un bid (ver `freelance-guardrails` regla 3).
6. Si el usuario ya tiene cuenta en alguna plataforma, sugerir `/freelance-profile` como siguiente paso; si no, `/master-profile` primero. Si todavía no sabe qué piso poner, `/freelance-scan market` da la mediana de lo que cobran otros con su perfil.

### `status` - Dónde estoy

1. Leer `00-Dashboard.md`, escanear `03-Aplicaciones/` filtrando `tipo: freelance`, y `08-Contratos/`.
2. Resumir: propuestas esperando respuesta (con días transcurridos), contratos activos y su avance, Connects gastados en el mes contra resultados, horas facturables comprometidas contra capacidad.
3. Marcar lo que necesita acción hoy: propuestas sin respuesta hace 7+ días, milestones vencidos, contratos con horas por encima de lo estimado.
4. Recomendar la acción de mayor impacto.

### `next` - Qué hago ahora

Según el estado del workspace, recomendar el skill siguiente (ver routing).

## Routing

| Situación | Skill |
|-----------|-------|
| No hay workspace | `/freelance-hunt setup` |
| Falta perfil maestro | `/master-profile` |
| Perfil de plataforma flojo o vacío | `/freelance-profile` |
| Buscar y scorear ofertas | `/freelance-scan` |
| Qué cobran otros con mi perfil | `/freelance-scan market` |
| Evaluar riesgo de un cliente | `/client-screen` |
| Escribir la propuesta y el bid | `/freelance-proposal` |
| Contrato, SOW, NDA o change order | `/contract-and-proposal-writer` |
| Estimar esfuerzo de un proyecto | `/estimate` |
| Registrar respuesta o resultado | `/job-outcome` |
| ¿Ya me postulé acá? / exportar el registro a CSV | `/career-registry` |
| Mensaje directo a un cliente o follow-up | `/cold-outreach` |
| Portfolio web | `/portfolio-site` |
| Gané el proyecto: desarmar alcance y validar horas | `/freelance-kickoff` |
| Registrar horas, scope creep, change orders | `/freelance-deliver` |
| ROI de Connects, utilización, tarifa efectiva | `/freelance-pipeline` |

## Los 4 agentes del perfil

El perfil instala `agents/freelance/`. Existen porque hay lecturas que solo sirven con contexto fresco, y son read-only: devuelven análisis, los archivos los escribe la sesión principal.

| Agente | Contesta | Lo lanza |
|---|---|---|
| `client-screener` | ¿Este cliente es un riesgo? (adversarial por diseño) | `/client-screen` |
| `proposal-reviewer` | ¿Vale gastar Connects en esta propuesta? | `/freelance-proposal` |
| `discovery-call` | ¿Aguanto la llamada, el regateo y el alcance de contrabando? | `/freelance-proposal`, `/client-screen` |
| `pipeline-strategist` | ¿Esto es un negocio o un pasatiempo caro? | `/freelance-pipeline` (10+ propuestas resueltas) |

`client-screener` y `proposal-reviewer` corren **en paralelo** cuando van los dos: son preguntas independientes.

## Workflow estándar para una oportunidad

1. `/freelance-scan` → ofertas scoreadas, dedup contra corridas anteriores.
2. `/client-screen` → riesgo del cliente. **Si el veredicto es no postularse, se registra el descarte y termina acá.** Ese es el paso que ahorra plata.
3. `/estimate` → esfuerzo real del alcance descrito.
4. `/freelance-proposal` → propuesta + bid sobre el piso + review con `proposal-reviewer`.
5. Enviar (**siempre manual**) → `/job-outcome` para marcar `propuesta_enviada` y registrar el gasto de Connects.
6. Si el cliente responde → ensayar con `discovery-call`, después la llamada real.
7. Si se cierra → `/contract-and-proposal-writer` para el SOW, nota en `08-Contratos/`.
8. **`/freelance-kickoff`** → desarmar el alcance y validar si entra en lo cotizado. Acá se descubre la brecha, no en la semana 5.
9. Mientras se ejecuta → `/freelance-deliver` para horas, scope creep y change orders.
10. Al cerrar → `/freelance-deliver close`, y cada 2 semanas o con 10+ propuestas resueltas, `/freelance-pipeline`.

## Reglas

- Regla del perfil: `freelance-guardrails`. Las cuatro no son sugerencias - los Connects son plata, el JSS es un activo, el piso no se negocia y el envío es manual.
- Nunca reorganizar carpetas ni renombrar notas sin preguntar - rompe `[[wikilinks]]` en silencio.
- Nunca commitear datos sensibles (montos, datos de clientes, mails) a un remoto sin confirmación explícita.
- Preservar los prefijos numéricos al crear archivos.
- Máximo accionable: el usuario siempre termina sabiendo qué skill correr next.

## Handoff

Pedí aprobación (approval) antes de escribir o sobrescribir archivos del workspace. Cuando el workspace queda READY, el siguiente paso es `/freelance-profile` si ya hay cuenta en una plataforma, o `/master-profile` si falta el perfil maestro.
