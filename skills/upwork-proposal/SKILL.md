---
name: upwork-proposal
description: "Write an Upwork proposal that survives the list view and price it above your net floor rate: hook in the first two lines, proof instead of adjectives, fixed vs hourly, risk buffer and platform fee. Reviewed by a fresh-context agent before spending Connects. Triggers: escribir propuesta upwork, cover letter upwork, cuanto cobrar por este proyecto, bid, cotizar proyecto freelance, propuesta freelance."
argument-hint: "[nota de aplicación | job-url]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Task
---

# Upwork Proposal - Propuesta y bid

Escribís la propuesta y le ponés precio. Dos cosas en una skill porque en Upwork van juntas: el bid es parte de la propuesta y una no se defiende sin la otra.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Oferta indicada: `$ARGUMENTS`

## Precondición: el screen

**No redactar una propuesta sin la nota de `/client-screen`.** Si no existe, pedirla y correr ese skill primero.

Si el screen dio riesgo alto o `NO POSTULARSE` y el usuario quiere postularse igual, se puede - **pero se le dice qué falló y se registra en la nota** (regla 1 de `freelance-guardrails`). Los Connects son plata: gastarlos a ciegas es distinto de gastarlos con los ojos abiertos.

## Inputs

- **El job post completo** y la nota de `03-Aplicaciones/` con el screen.
- **El perfil base** de `01-Perfiles/` - de ahí salen la prueba y el **piso de tarifa neto**.
- **La estimación** de `/estimate` si el alcance es grande.
- Trabajos previos comparables (`08-Contratos/` cerrados) para calibrar precio contra realidad, no contra deseo.

## Parte 1 - La propuesta

### Cómo la lee el cliente

Tiene 30 propuestas en una lista y ve **las dos primeras líneas de cada una**. Todo lo que no esté ahí, no existe todavía. Esa es la única restricción de formato que importa.

### Estructura

1. **Dos primeras líneas (el 80% del trabajo).** Algo que solo se sabe habiendo leído *este* post: el problema real detrás del pedido, una observación técnica concreta, o el resultado que podés traer. Si la apertura serviría para cualquier otro trabajo del rubro, está muerta.
2. **Prueba, 2-3 oraciones.** Un proyecto comparable con número o link. No adjetivos: "expert in React" es ruido, "migré un checkout de 40k usuarios a React, bajé el tiempo de carga 60%" es prueba.
3. **Cómo lo harías, 3-4 puntos.** Suficiente para mostrar que ya lo pensaste, no tanto que regales la consultoría.
4. **El precio, justificado.** Ver Parte 2. Un número suelto invita a regatear.
5. **Una pregunta concreta** sobre el proyecto. Sin pregunta no arranca conversación, y demuestra que leíste el post.

**150-300 palabras.** Arriba de 300 casi nunca se lee entera.

### Requisitos explícitos del post

Muchos posts piden algo puntual: empezar con una palabra clave, responder una pregunta específica, mandar un link. **Buscalo siempre y cumplilo.** Es descarte automático y es el error más barato de evitar.

### Anti-patrones (cortar siempre)

- "I have X years of experience in..." como apertura. El cliente no contrata experiencia, contrata la solución de un problema que ya tiene.
- "Dear Sir/Madam", "I hope this message finds you well".
- Recitar el perfil en prosa.
- Adjetivos sin evidencia: passionate, detail-oriented, fast learner.
- Frases que delatan plantilla o generación automática. Los clientes de Upwork las reconocen al instante y es la razón número uno de descarte.
- Prometer plazos que no podés cumplir para ganar el contrato.

## Parte 2 - El bid

### El piso es neto

El piso de tarifa de `01-Perfiles/` es **lo que te queda**, no lo que facturás. Upwork se queda una comisión, así que el bid tiene que cubrirla: con un piso de 40 USD/h y 10% de comisión, el bid mínimo es ~45.

**Si el bid calculado queda abajo del piso, decilo fuerte y no lo maquilles.** El trabajo correcto ahí es no postularse o cotizar lo que corresponde y perder la oferta - no bajar el piso. Bajar la tarifa es la palanca más fácil de ejecutar y la más difícil de revertir: baja el techo de todos los contratos siguientes.

### Fijo u hora

| Elegí fijo cuando | Elegí hora cuando |
|---|---|
| El alcance está escrito y acotado | El alcance es exploratorio o va a cambiar |
| Podés estimar con confianza media o alta | Hay dependencias del cliente que no controlás |
| Querés capturar valor arriba de tus horas | El cliente pide "iremos viendo" |

Alcance difuso + precio fijo es la combinación que más plata pierde. Si el screen marcó alcance difuso y el cliente insiste en fijo, el precio tiene que incluir el riesgo o el trabajo correcto es no tomarlo.

### El cálculo

1. Esfuerzo base de `/estimate`, en horas.
2. **Buffer de riesgo** según lo que dijo el screen: alcance claro y cliente con historial, +15%; alcance difuso o cliente nuevo, +40% o más. El buffer no es grasa, es el precio de la incertidumbre que el cliente te transfiere.
3. Horas no facturables del proyecto: reuniones, revisiones, ida y vuelta.
4. Multiplicar por la tarifa objetivo (no por el piso: el piso es el mínimo, no la meta).
5. Sumar la comisión de la plataforma.
6. Comparar contra el presupuesto del cliente. Si no cierra, es dato para la decisión, no para bajar el número.

Mostrar el desglose al usuario **antes** de escribirlo en la propuesta. Al cliente se le muestra el total y su razón, no la planilla.

## Proceso

1. Leer el post, el screen y el perfil. Verificar que el screen exista.
2. Calcular el bid (Parte 2) y mostrar el desglose. Si queda abajo del piso, avisar y parar a decidir.
3. Draftear la propuesta (Parte 1). Después cortar sin piedad todo lo genérico.
4. **Review con `proposal-reviewer`** (contexto fresco): pasale inline el post, el borrador y el bid. Aplicar sus reemplazos exactos e incorporar lo que corresponda. Una sola ronda. El que escribió leyó el post entero y ya está convencido de su propio gancho; el cliente ve dos líneas.
5. Con approval, guardar en la nota de `03-Aplicaciones/`, sección `## Propuesta`, con el bid y su justificación en `## Cotización`.
6. Si el usuario quiere ensayar la llamada, ofrecer `discovery-call`.

## Idioma

En el idioma del post. Si el post está en inglés, la propuesta va en inglés aunque la charla sea en español.

## Reglas

- Nunca inventar experiencia, clientes, plazos ni métricas.
- Nunca bidear abajo del piso neto sin decirlo explícitamente.
- Nunca enviar la propuesta: se muestra y el usuario copia y manda (regla 4 de `freelance-guardrails`).
- Nunca marcar `propuesta_enviada`: eso lo hace `/job-outcome` después del envío.
- Sin guiones largos en el texto de la propuesta ni de las notas.

## Handoff

Pedí aprobación (approval) antes de escribir la propuesta en la nota. Propuesta READY cuando pasó el review y el bid está sobre el piso. El siguiente paso es enviarla a mano y correr `/job-outcome` para registrar el envío y el gasto de Connects; si el cliente responde, `discovery-call` para ensayar y después `/contract-and-proposal-writer` para el SOW.
