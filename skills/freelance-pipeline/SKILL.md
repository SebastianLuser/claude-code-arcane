---
name: freelance-pipeline
description: "Diagnose the freelance business, not one proposal: Connects ROI, proposal funnel, real effective hourly rate net of unbilled hours, utilization, client concentration and scope drift on active contracts. Triggers: como va mi pipeline freelance, cuanto gano por hora de verdad, roi de connects, por que no me responden las propuestas, utilizacion, scope creep de un contrato."
argument-hint: "[--desde YYYY-MM-DD]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, Task
---

# Freelance Pipeline - Diagnóstico del negocio

Mirás el negocio entero, no la propuesta de mañana. La pregunta que contestás es si esto funciona como negocio, y si no, qué **una** cosa cambiar.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Ventana: `$ARGUMENTS` (vacío = todo el historial).

## Inputs

- `03-Aplicaciones/` con `tipo: freelance` - **todas**, incluidas las `descartado`. Los descartes dicen si tu criterio de selección funciona; sin ellos el diagnóstico está sesgado a las que sí mandaste.
- `08-Contratos/` - activos y cerrados: estimado contra real, milestones, horas, change orders.
- El ledger de Connects en `07-Recursos/` - gasto por propuesta y resultado.
- `01-Perfiles/` - el piso de tarifa neto y la capacidad semanal declarada.

## El guard de volumen (primero, obligatorio)

Contar antes de afirmar.

- **Menos de 10 propuestas resueltas:** no hay embudo. Entregar solo lo descriptivo (cuántas, Connects gastados, tiempo de respuesta) y nombrar la hipótesis más barata de testear. **Nada de patrones.**
- **10 a 25:** tendencias, con la muestra a la vista en cada afirmación ("3 de 14").
- **25+:** tasas de conversión.

Tres propuestas sin respuesta no son un patrón. Tratarlas como tal manda al usuario a bajar la tarifa, que es el peor movimiento posible y el más difícil de revertir.

## Las cinco métricas

### 1. ROI de Connects

`Connects gastados / contratos ganados` = costo de adquisición. Y el número que más duele: **cuántos Connects se fueron en ofertas que nunca contrataron a nadie**. Esa pérdida es evitable con mejor screening, así que se reporta aparte.

### 2. Embudo

```
oferta vista → screen pasado → propuesta enviada → cliente responde → llamada → contrato
```

La etapa clave es **enviada → responde**. Cruzarla con el score cambia el diagnóstico:

| Sin respuesta + score alto | Sin respuesta + score bajo |
|---|---|
| Problema de propuesta: apertura, precio, plantilla detectable | Problema de targeting: te postulás a lo que no te corresponde |
| Va a `/freelance-proposal` | Va a `/freelance-scan` y `/freelance-profile` |

### 3. Tarifa efectiva real

`total cobrado / (horas facturadas + horas de propuestas + llamadas + admin)`, **neto de comisión**.

No es la tarifa del contrato y casi siempre es bastante menor. Es el número que dice si el negocio funciona. **Si quedó abajo del piso declarado, ese es el hallazgo principal** y todo lo demás es secundario.

### 4. Utilización y concentración

- Horas facturables contra capacidad declarada. Muy baja = problema de pipeline. Muy alta sostenida = riesgo de burnout y de no tener tiempo para vender, que es cómo se llega al mes siguiente sin nada.
- **Concentración**: porcentaje de ingresos del cliente más grande. Arriba de la mitad, no es un negocio: es un empleo sin sus protecciones y sin su estabilidad.

### 5. Scope drift en contratos activos

Contratos donde las horas reales superan lo estimado **sin change order**. Cada uno es trabajo regalado.

El patrón importa más que el caso: si pasa en casi todos, el problema está en cómo se escriben los alcances (va a `/contract-and-proposal-writer`), no en los clientes. Por cada contrato con drift, ofrecer redactar el change order - alcance nuevo, precio nuevo (regla 3 de `freelance-guardrails`).

## Proceso

1. **Recolectar y contar.** Aplicar el guard de volumen y decir en qué banda estamos.
2. **Calcular las cinco métricas.** Mostrarlas en el chat con la muestra explícita, antes de interpretar nada.
3. **Lanzar `pipeline-strategist`** (contexto fresco, read-only) si hay 10+ propuestas resueltas. Devuelve punto de fuga, hipótesis con cómo testearlas, UN cambio recomendado y qué no tocar. Con menos volumen, saltear: el agente lo va a rechazar igual.
4. **Reporte** en `07-Recursos/Pipeline - YYYY-MM-DD.md`, con approval del usuario sobre las métricas:
   - Frontmatter: `tipo: pipeline`, `fecha`, `propuestas_analizadas`, `contratos_analizados`, `ventana`.
   - Las cinco métricas con su muestra.
   - El punto de fuga y su evidencia, con wikilinks a las notas que lo sostienen.
   - El cambio recomendado y a qué skill se le pasa.
   - Si existe un reporte anterior, sección "Desde el último reporte": qué se movió y qué no.
5. **No editar** notas de propuestas ni de contratos. Solo crear el reporte y, si el usuario lo pide, los change orders de los contratos con drift.

## Reglas

- **Datos antes que consejos.** Cada afirmación se apoya en un conteo o en una cita del feedback registrado.
- **UN cambio recomendado, no un plan de 8 puntos.** Si se cambian cinco cosas no se sabe cuál funcionó.
- **Bajar la tarifa nunca es la primera palanca.** Solo entra si la evidencia dice que el posicionamiento está mal, y con ese fundamento explícito.
- Nunca fabricar métricas: si falta el dato (horas no registradas, Connects sin anotar), reportar el hueco y qué habría que empezar a registrar.
- Sin guiones largos, con wikilinks a las notas fuente.

## Handoff

Reporte COMPLETE en `07-Recursos/`. El siguiente paso es el que salga del punto de fuga: `/freelance-proposal` (propuesta), `/freelance-scan` o `/freelance-profile` (targeting y posicionamiento), `/client-screen` (criterios de descarte), o `/contract-and-proposal-writer` (alcances y change orders).
