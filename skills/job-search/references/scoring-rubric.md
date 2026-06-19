# Job Scoring Rubric

Score ponderado 0–100 para decidir dónde invertir esfuerzo. El objetivo no es aplicar a todo: es concentrarte en ofertas con match real. Umbral default **≥75** (configurable por perfil en `match_score_minimo`).

## Dimensiones y pesos (default)

| Dimensión | Peso | Cómo puntuar |
|---|---:|---|
| **Match de stack/skills** | 30 | % de must-haves que cumplís. 30 si cubrís todos los core; baja proporcional. |
| **Seniority** | 15 | 15 si el nivel encaja. Penalizar over-qualified (aburrimiento/rechazo) y under-qualified (filtro). |
| **Modalidad + elegibilidad** | 20 | Remoto/híbrido/presencial según preferencia; zona horaria; visa/eligibility. Si hay bloqueo duro de elegibilidad → cap fuerte al score. |
| **Salario** | 15 | 15 si ≥ tu objetivo; proporcional hasta tu mínimo; 0 si por debajo del mínimo. Si no publican, neutro (≈8) y marcar. |
| **Empresa/cultura/etapa** | 10 | Encaje con preferencia (startup vs enterprise, producto vs consultora, valores). |
| **Calidad de la oferta** | 10 | Claridad del JD, recencia (fresca > vieja), pocos aplicantes, proceso definido. |

Sumá las dimensiones → score 0–100.

## Ajustes / banderas

- **Frase gatillo positiva** (ej. "code-forward", "high autonomy", stack que amás): +2–5 si refuerza tu fit.
- **Red flag en el JD** (ego, "rockstar", scope imposible, "trabajamos como familia"): −5–10 y nota de cautela.
- **Cierre inminente:** no cambia el score, pero sube la **prioridad** de acción.
- **Elegibilidad bloqueada** (visa que no tenés, zona horaria incompatible obligatoria): cap el score a <50 aunque el resto sea perfecto.

## De score a acción

| Score | Acción |
|---|---|
| **≥85** | Prioridad alta. Aplicar con CV custom + cover letter + outreach. |
| **75–84** | Aplicar; CV custom sí, outreach si hay contacto fácil. |
| **60–74** | Borderline. Aplicar solo si hay tiempo o un ángulo fuerte (referido). |
| **<60** | Skip salvo razón estratégica. |

## Prioridad (distinta del score)

`prioridad` en el frontmatter combina score + urgencia + elegibilidad:
- **alta:** score ≥85, o ≥75 con cierre inminente / referido caliente.
- **media:** 75–84 sin urgencia.
- **baja:** borderline o a la espera de validar requisitos.

## Registro

Guardá el `score` en el frontmatter de la nota de `03-Aplicaciones/` y reflejá las activas en `00-Dashboard.md` agrupadas por prioridad. Anotá el breakdown si el score fue borderline — ayuda a decidir y a re-evaluar después.
