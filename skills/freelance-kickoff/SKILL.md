---
name: freelance-kickoff
description: "Turn a won contract into an executable plan: break the scope into deliverables, write the acceptance criteria, and validate honestly whether what you promised fits the hours you quoted - before week five. Then hand off to the technical skills. Triggers: gane el proyecto, arrancar el contrato, kickoff, desarmar el alcance, criterios de aceptacion, me alcanzan las horas que cotice, planificar el proyecto freelance."
argument-hint: "[nota de contrato | cliente]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, WebFetch, Task
---

# Freelance Kickoff - Del contrato al plan

Ganaste el proyecto. Ahora hay que convertir la propuesta en algo ejecutable, y sobre todo **descubrir ahora y no en la semana 5** si lo que prometiste entra en las horas que cotizaste.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Contrato o cliente: `$ARGUMENTS`

## Por qué existe este paso

El resto del perfil te ayuda a conseguir el trabajo. Este es el primero que te ayuda a **hacerlo**, y existe porque el momento de mayor riesgo del freelance no es postularse: es la brecha entre lo que la propuesta dice y lo que el trabajo realmente pide.

Esa brecha se descubre siempre. La única variable es cuándo: acá, cuando todavía se puede renegociar, o en la semana 5, cuando ya es tu problema.

## Inputs

- **La nota del contrato** (`08-Contratos/`) y la propuesta que la originó (`03-Aplicaciones/`).
- **El SOW o contrato firmado** si existe, y si no, avisar: sin alcance escrito no hay alcance.
- La nota de `/client-screen`: lo que ahí quedó marcado como alcance difuso es exactamente lo que hay que cerrar ahora.
- El perfil de `01-Perfiles/` para el piso de tarifa y la capacidad semanal.

## Proceso

### 1. Desarmar el alcance en entregables

Cada entregable: qué es, qué incluye, **qué no incluye**, y de qué depende. Las dependencias importan porque las del lado del cliente (accesos, contenido, decisiones, aprobaciones) son la causa número uno de proyectos que se estiran sin que sea tu culpa - y sin que te lo paguen.

Lo que la propuesta decía en una línea acá se convierte en tres o cuatro items. Si no se puede desarmar, es que el alcance no está definido, y ese es el hallazgo.

### 2. Escribir los criterios de aceptación

Por cada entregable: **cómo sabemos que está terminado**, en términos verificables.

Sin esto, "terminado" lo define el cliente cuando quiera, y siempre está un poco más lejos. Es el mecanismo más barato que existe contra el scope creep, y casi nadie lo escribe.

Si el usuario no sabe qué poner, la pregunta que lo desbloquea es: *"¿qué tendría que pasar para que el cliente lo apruebe sin pedir cambios?"*

### 3. Estimar de verdad

Usar `/estimate` por entregable. Sumar además lo que nunca entra en la estimación y siempre pasa: reuniones, rondas de revisión, ida y vuelta por accesos, setup del entorno.

### 4. La validación honesta (el paso que justifica el skill)

Comparar el total estimado contra las **horas implícitas en lo cotizado** (monto acordado dividido tu tarifa objetivo).

| Resultado | Qué hacer |
|---|---|
| Entra con margen | Seguir. Registrar el margen para no regalarlo después |
| Entra justo | Seguir, avisando que cualquier imprevisto sale de tu bolsillo |
| **No entra** | **Parar y decirlo con el número** |

Cuando no entra, las opciones reales son tres, y hay que ponerlas sobre la mesa antes de escribir una línea de código: **recortar alcance** al que cabe, **renegociar** el monto o el plazo con el desarme como evidencia, o **absorber la diferencia** como decisión consciente y registrada.

Lo que no es una opción es empezar y ver qué pasa. Eso ya sabemos cómo termina.

Nunca maquillar la estimación para que cierre. Si al desarmarlo son 90 horas y cotizaste 40, el número es 90.

### 5. Plan de ejecución

Secuenciar por dependencias, no por lo que da más ganas. Marcar el camino crítico y qué está bloqueado por el cliente. Definir milestones que coincidan con los pagos si el contrato los tiene: entregar tres cosas antes del primer cobro es financiar al cliente.

### 6. Escribir y rutear

Con approval, completar la nota de `08-Contratos/`: alcance acordado, alcance excluido, criterios de aceptación, milestones y estimación por entregable.

Después **rutear al trabajo técnico**, que ya existe en el repo:

| Si el proyecto es | Seguí con |
|---|---|
| Historias y tickets | `/create-stories`, `/create-epics` |
| Backend, frontend, mobile | El perfil técnico que corresponda (`+backend-ts`, `+frontend`, ...) |
| Algo sin especificar del lado del cliente | `/product-discovery` antes de codear |
| Documentar lo que ya existe | `/reverse-document` |

## Reglas

- **Sin alcance escrito no se arranca.** Si no hay SOW ni propuesta con alcance, este skill produce el alcance propuesto y pide confirmarlo con el cliente antes de ejecutar.
- **Nunca ajustar la estimación para que entre en lo cotizado.** El número es el número; la decisión es del usuario.
- **Todo lo que no está en el alcance acordado va a "alcance excluido"**, explícito. Lo que no se escribe se discute después, y se discute gratis.
- No inventar criterios de aceptación que el cliente no aceptó: si se proponen, se marcan como propuestos hasta que los confirme.
- Sin guiones largos en el texto agregado a las notas.

## Handoff

Pedí aprobación (approval) antes de escribir en la nota del contrato. Kickoff COMPLETE cuando hay entregables, criterios de aceptación, estimación y el veredicto de si entra en lo cotizado. El siguiente paso es el skill técnico que corresponda para ejecutar, y `/freelance-deliver` para el seguimiento de horas y alcance mientras el proyecto corre.
