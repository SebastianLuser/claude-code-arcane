---
name: user-persona
description: "Genera user personas + Jobs-To-Be-Done + pain points + empathy maps. Output en Notion/Coda para alinear equipos de producto. Usar para: persona, user research, JTBD, empathy map, target user, segmento de usuarios."
---

# user-persona — User Persona & JTBD Generator

Genera **personas documentadas**, **Jobs-To-Be-Done**, **empathy maps** y **pain/gain analysis** para guiar decisiones de producto en Educabot (Alizia, Tuni, Vigía, Tich).

## Cuándo usar

- Nuevo producto o vertical que necesita definir target
- Feature grande que requiere empatía profunda con el usuario
- PRD nuevo sin persona clara (hand-in con `/product-spec`)
- Re-assessment del ICP (Ideal Customer Profile) existente
- Onboarding de nuevos PMs/designers al contexto de usuarios

## Cuándo NO usar

- Si ya hay persona validada vigente — refinar, no recrear
- Para stakeholders internos (usar stakeholder map aparte)
- Bugs o issues técnicos

## Filosofía

Una persona útil cumple 3 criterios:

1. **Basada en data real** — no en asunciones. Interviews, analytics, surveys.
2. **Actionable** — ayuda a decidir qué hacer / qué no hacer
3. **Memorable** — el equipo la recuerda y referencia en decisiones

Persona malas:
- Demografía irrelevante ("mujer de 25-45 años que ama el café") — no decide nada
- Copy-paste de competidor
- 15 personas diferentes → nadie se recuerda de ninguna

## Preguntas previas

1. **Producto**: Alizia / Tuni / Vigía / Tich / nuevo
2. **Persona primaria o secundaria?**
3. **¿Hay research existente?** (interviews, surveys, analytics, NPS comments)
4. **Cantidad de personas a generar**: 1-3 recomendado, max 5
5. **Contexto educativo**: Primaria / Secundaria / Univ / Adultos / Formal / No-formal

## Workflow

### Paso 1 — Recolectar evidencia
Preguntar al user por inputs:
- Links a user interviews (Notion, grabaciones)
- Exports de analytics (Mixpanel, GA)
- Tickets de soporte recurrentes
- Data de CRM / Hubspot
- Competidor research

Si no hay data → proponer plan de discovery antes:
- 5-7 interviews con users
- Survey cuantitativo (50+ respuestas)
- 2 semanas mínimo antes de persona

### Paso 2 — Segmentar
Identificar dimensiones clave que separen comportamientos:
- **Rol**: docente / estudiante / director / padre
- **Nivel educativo**: primaria / secundaria / univ
- **Tipo de institución**: pública / privada / mixta
- **Tech-savviness**: low / mid / high
- **Contexto de uso**: aula física / remoto / híbrido

### Paso 3 — Escribir persona usando template
(ver abajo)

### Paso 4 — Validar con equipo
- Research / Data team revisa
- PM + Design aprueban
- Si no resuena → iterar

### Paso 5 — Publicar y vincular
- Publicar en Notion/Coda (hub de personas)
- Linkear desde PRDs, Figma files
- Printables para pegar en paredes (opcional pero efectivo)

## Template de Persona (formato Educabot)

```markdown
# Persona: <Nombre ficticio + rol>

**Tipo**: Primaria / Secundaria / Anti-persona
**Producto**: Alizia / Tuni / <...>
**Última validación**: <YYYY-MM-DD>
**Research base**: <N interviews, N surveys>
**Owner**: <PM name>

---

## 📸 Snapshot

| | |
|---|---|
| **Nombre** | Florencia "Flor" Gutiérrez |
| **Rol** | Docente de Matemática de Secundaria |
| **Edad** | 38 |
| **Ubicación** | Córdoba, Argentina |
| **Institución** | Colegio público de barrio |
| **Años de experiencia** | 12 |
| **Tech-savviness** | Medio |

*Usar foto libre de derechos (Unsplash) o avatar generado. Nombre ficticio pero creíble.*

---

## 🎯 Jobs-To-Be-Done (JTBD)

Formato: `Cuando <situación>, quiero <motivación>, para <outcome esperado>`.

### Functional jobs (lo que tiene que hacer)
- **JTBD1**: Cuando preparo una clase de fracciones, quiero encontrar ejercicios diferenciados por nivel, para atender a los chicos que van más adelantados y los que van atrás al mismo tiempo.
- **JTBD2**: Cuando corrijo pruebas, quiero que la plataforma detecte errores recurrentes, para reforzar eso en la próxima clase.

### Emotional jobs (cómo quiere sentirse)
- Sentirse **capaz de dar una buena clase** sin quedarse hasta las 11 pm planeando
- **No quedar atrás** de colegas más jóvenes que usan tech

### Social jobs (cómo quiere ser visto)
- Ser **vista como profe innovadora** por directores y colegas
- No pasar vergüenza delante de los alumnos por no saber usar la herramienta

---

## 😣 Pain Points

### Dolores actuales
1. **Tiempo**: Planeamiento de clases le consume 6-8hs/semana extra no pagas
2. **Materiales**: Recursos online están desordenados, tiene 4 pestañas abiertas
3. **Diversidad**: 30 alumnos con niveles distintos, no puede personalizar
4. **Correcciones**: Corregir es mecánico, no aporta insights

### Frustraciones con soluciones actuales
- Google Classroom es genérico, no entiende pedagogía
- Libros son caros y desactualizados
- Plataformas en inglés la expulsan

### Anti-pains (lo que NO quiere)
- **No quiere otra herramienta más** que aprender
- **No quiere dar clases en pantalla** — le gusta el aula
- **No quiere reemplazar el libro físico**, solo complementar

---

## 🎁 Gains

### Deseados
- Recuperar tiempo de planificación
- Alumnos más enganchados
- Datos para justificar su trabajo al director

### Inesperados (delight)
- Comunidad con otros docentes compartiendo recursos
- Reconocimiento de su institución
- Desarrollo profesional / upskilling

---

## 🗺️ Contexto de uso

### ¿Cuándo usa el producto?
- Domingos por la tarde (planeamiento semanal)
- Recreos (preparación de última hora)
- Noches después de corregir (análisis)

### ¿Dónde?
- Casa (notebook propia, WiFi regular)
- Escuela (sala de profes, PC compartida, WiFi malo)
- Transporte público (celu con data limitada)

### ¿Con qué dispositivos?
- Notebook: 70% del uso
- Celular: 25%
- Tablet institucional: 5%

### ¿Solo o con otros?
- Sola al planear
- Con colegas al intercambiar recursos (por WhatsApp)
- Con alumnos al usar en clase

---

## 💬 Quotes reales

> "Yo no necesito más cosas que aprender, necesito que me ahorre tiempo."

> "Si mañana me pongo con esto y mis alumnos se aburren, yo quedé como tonta."

> "El director pide informes de rendimiento pero nadie me dice cómo sacarlos."

*Citas textuales de interviews. Linkear a transcript si es posible.*

---

## 🧠 Empathy Map

### Ve
- Su aula con 30 chicos
- Recursos de otras profes en Instagram
- Capacitaciones obligatorias que no sirven

### Escucha
- A sus alumnos diciendo "esto es aburrido"
- A colegas mayores diciendo "antes era más fácil"
- A su director pidiendo mejores resultados

### Piensa y siente
- **Piensa**: "Tengo que hacer esto mejor pero no tengo tiempo"
- **Siente**: Orgullo por sus alumnos, frustración con sistema, ansiedad los domingos

### Dice y hace
- **Dice**: "Amo enseñar pero estoy agotada"
- **Hace**: Arma Google Docs compartidos con otras profes, busca en Pinterest

### Pains
- Horarios imposibles
- Burocracia
- Sueldo desfasado

### Gains
- Alumnos motivados
- Reconocimiento
- Tiempo libre

---

## 🚫 Anti-patterns (cosas que ESTA persona rechaza)

- Gamificación infantil que subestima a sus alumnos
- Features "cool" que no resuelven problemas reales
- Planes premium caros sin trial
- Onboarding largo (> 10 min)
- Apps que dependen de WiFi fuerte

---

## 📏 Métricas clave para esta persona

| Métrica | Target |
|---------|--------|
| Tiempo a primera clase armada | < 15 min |
| NPS | > 50 |
| Retención mes 3 | > 60% |
| Clases armadas por semana | > 2 |

---

## 🧪 Cómo testeamos hipótesis con esta persona

- Recruit: profes secundaria con 5+ años de experiencia, instituciones públicas
- Canal: contactos del CS team, campañas en FB grupos docentes
- Incentivo: $20 USD o plan premium 1 mes
- Frecuencia: 1 round cada feature grande

---

## 🔗 Referencias

- Interviews: <link Notion folder>
- Survey results: <link>
- Analytics cohort: <link>
- PRDs donde aparece: <links>
- Figma frames: <link>
```

---

## Anti-persona Template

Útil para definir explícitamente **para quién NO es el producto**.

```markdown
# Anti-persona: <Nombre>

## Quién es
<Descripción rápida>

## Por qué NO es nuestro target
- <Razón 1 — no resolvemos su dolor principal>
- <Razón 2 — su contexto no matchea>
- <Razón 3 — tendría churn alto>

## Señales de que un lead es anti-persona
- <Señal en demo / sales / onboarding>

## Qué hacer cuando aparece
- Sales: deflect con honestidad
- Support: no priorizar requests de feature
- Product: no construir para ellos
```

---

## JTBD Canvas (si solo se necesita eso)

Alternativa más ligera que la persona completa:

```markdown
# JTBD Canvas — <Feature/Context>

## Job Statement
Cuando <situación>, quiero <motivación>, para <outcome esperado>.

## Forces diagram
**Push** (qué los empuja a buscar solución):
- <force>

**Pull** (qué los atrae hacia nuestra solución):
- <force>

**Anxiety** (qué los frena):
- <concern>

**Habits** (qué los mantiene en solución actual):
- <habit>

## Success criteria
Cómo sabe el usuario que el job se hizo bien:
- <criterio>
- <criterio>
```

Cuándo usar JTBD solo vs persona completa:
- **JTBD**: feature específica, equipo ya conoce el user
- **Persona**: onboarding, producto nuevo, re-alignment

---

## Rules of thumb

- **Max 3-5 personas** por producto. Más y nadie se acuerda.
- **Una primaria, max 2 secundarias**. Si hay 3 primarias, probablemente son productos distintos.
- **Refrescar cada 6-12 meses** o cuando haya cambio grande (pivot, nuevo segmento)
- **Evidencia siempre** — si no hay interview, marcar como hipótesis
- **Cada feature debe mapear a una persona** — si no, cuestionar la feature
- **Usar en meetings** — "pero Flor no haría eso" es señal de que funciona

---

## Integración con otros skills

- Output va a Notion/Coda (hub de personas del producto)
- Linkea desde `/product-spec` (PRDs)
- Base para `/doc-pas` o `/doc-gdd`
- Informa `/figma-to-code` (design decisions)

## Delegación

**Coordinar con:** `product-manager`, `ux-lead`, `chief-product-officer`
**Reporta a:** `chief-product-officer`

**Skills relacionadas:**
- `/product-spec` — PRD que usa la persona
- `/notion`, `/coda` — publicar hub
- `/meeting-to-tasks` — convertir interviews en insights
