---
name: client-screen
description: "Score the risk of an Upwork client before spending Connects: payment verification, hire rate, budget vs scope, and red flags in the post. Produces a verdict, what to ask, and a recorded decision even when the answer is do not apply. Triggers: screenear cliente, vale la pena postularme, este cliente es confiable, red flags de esta oferta, riesgo del cliente, me conviene gastar connects."
argument-hint: "[job-url | nota de aplicación | texto del post pegado]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Task
---

# Client Screen - Riesgo del cliente antes de gastar Connects

Evaluás al cliente **antes** de que se escriba una propuesta. Es el paso que no existe en la búsqueda de empleo y el que más plata ahorra: en Upwork postularse cuesta Connects, y un cliente malo cuesta además semanas y reputación.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Oferta indicada: `$ARGUMENTS`

## Inputs

- **El job post**: URL → WebFetch (la página pública de la oferta suele ser accesible), texto pegado, o una nota existente de `03-Aplicaciones/`.
- **Los datos públicos del cliente**, que están en la misma página: payment method verificado o no, total gastado, cantidad de contrataciones, hire rate, promedio pagado por hora, reviews que dejó, país, antigüedad de la cuenta.
- **El piso de tarifa** de `01-Perfiles/`, para comparar contra el presupuesto ofrecido.

Si faltan los datos del cliente, **pedilos antes de opinar**. Un screen con la mitad de los datos es peor que ninguno: da falsa tranquilidad. Decí exactamente qué falta y dónde se ve en la página.

## Proceso

### 1. Recolectar los datos duros

Extraer del post y del panel del cliente. Anotar lo que no se pudo obtener, explícitamente.

### 2. Presupuesto contra alcance

Estimar qué pide el post en serio (usar `/estimate` si el alcance es técnico y grande) y compararlo con lo que ofrece pagar, neto de comisión de Upwork.

Si hay brecha, cuantificala: "pide ~60h de trabajo, ofrece 300 USD = 5 USD/h, tu piso es 40". Ese número decide más que cualquier lectura de tono.

### 3. Lanzar el agente `client-screener`

Contexto fresco, adversarial por diseño: arranca de la hipótesis de que el trabajo es un problema y busca la evidencia. Pasale inline el post completo y los datos del cliente. Devuelve nivel de riesgo, evidencia, brecha de presupuesto, qué preguntar y riesgo de JSS.

Existe como agente porque el sesgo del usuario apunta al otro lado: necesita trabajo, el post suena bien, y quiere que salga. Alguien tiene que empujar en contra, y no puede ser el que ya se entusiasmó leyendo la oferta.

Si el rol implica una llamada y el usuario quiere prepararla, ofrecer también `discovery-call`.

### 4. Veredicto

`BAJO` · `MEDIO` · `ALTO` · `NO POSTULARSE`

Ante datos faltantes, el veredicto es el que corresponde a los datos que hay, no el optimista.

### 5. Registrar la decisión, cualquiera sea

Con approval del usuario, crear o actualizar la nota en `03-Aplicaciones/` (template `Propuesta`, `tipo: freelance`):

- **Si se avanza:** `estado: screeneado`, sección `## Screen del cliente` con los datos duros, el nivel de riesgo, la brecha de presupuesto y las preguntas a hacer.
- **Si NO se avanza:** `estado: descartado` y el motivo en `## Notas`. **Esto no es opcional.** Un descarte sin registrar es un dato perdido, y `/freelance-pipeline` necesita los descartes para decirte si tu criterio de selección funciona o si estás filtrando mal.

## Las señales que más importan

| Señal | Peso |
|---|---|
| Payment method sin verificar | El riesgo más caro. Sin verificación no hay garantía de pago |
| Presupuesto incoherente con el alcance | Expectativa desalineada, no oportunidad de negociar |
| Hire rate bajo con muchos posts publicados | Publica y no contrata: Connects a una oferta que quizá nunca se llene |
| Alcance difuso ("y otras tareas", "vamos definiendo") | Sin límite escrito no hay límite |
| Pedido de trabajo real gratis como "prueba" | Distinto de un test acotado y razonable |
| Presión para pagar fuera de la plataforma | Viola ToS, te deja sin protección de pago y arriesga tu cuenta |
| Reviews que el cliente dejó a otros freelancers | Si califica mal a todos, el patrón es él |

Detalle y cómo leer cada una: `references/red-flags.md`.

## Reglas

- **Nunca inventar datos del cliente.** Si no se conoce el hire rate, se pide; no se estima.
- **No evaluar la propuesta acá.** Eso es de `/upwork-proposal`.
- **Un cliente limpio es riesgo bajo, y decirlo también es el trabajo.** Marcar todo como riesgoso vuelve el screen inútil y el usuario deja de correrlo.
- Sin guiones largos en el texto agregado a las notas.
- Nunca marcar `propuesta_enviada`: eso lo hace `/job-outcome` después del envío manual.

## Handoff

Pedí aprobación (approval) antes de escribir la nota. Screen COMPLETE cuando la decisión quedó registrada, incluso si fue descartar. Si se avanza, el siguiente paso es `/estimate` para el esfuerzo y después `/upwork-proposal`; si se descarta, `/upwork-scan` para seguir con la cola.
