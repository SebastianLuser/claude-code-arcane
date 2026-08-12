---
name: freelance-deliver
description: "Track an active contract while it runs: log hours against the estimate, catch scope creep the day it happens instead of at invoice time, and draft the change order before doing the extra work. Triggers: registrar horas, el cliente me pidio algo mas, esto no estaba en el alcance, scope creep, como va el contrato, change order, cerrar el contrato."
argument-hint: "[log | check | change | close]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---

# Freelance Deliver - Ejecutar sin regalar horas

El loop mientras el proyecto corre. Tres cosas: registrar horas, detectar cuando el alcance se movió, y cobrarlo antes de hacerlo.

Rutas relativas al career workspace (`--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`).

Modo: `$ARGUMENTS`

## Por qué el momento importa

El scope creep no se detecta al facturar: **se detecta el día que pasa**, y casi siempre entra disfrazado de favor. "¿Me agregás esto rapidito?" es la frase que más plata cuesta en freelance, y funciona porque en el momento parece chico y decir no parece desproporcionado.

Un mes después son 18 horas que nadie va a pagar, y ahí ya es tarde: pedir plata por trabajo entregado suena a reclamo; pedirla antes suena a profesional.

## Modos

### `log` - registrar horas

Agregar filas a `## Horas registradas` de la nota del contrato: fecha, horas, qué se hizo, y **si es facturable o no**.

Esa última columna es la que casi nadie lleva y la que hace toda la diferencia: las reuniones, el ida y vuelta por accesos y las rondas de revisión son horas reales de tu semana. Si no se registran, tu tarifa efectiva parece mejor de lo que es y vas a seguir cotizando mal.

Después de registrar, correr `check` si el acumulado se acercó al estimado.

### `check` - cómo va

1. Sumar horas registradas y comparar contra `horas_estimadas` de la nota.
2. Estado de los milestones: entregados, vencidos, pendientes de aprobación del cliente.
3. Semáforo, y lo importante es qué hacer con cada color:

| Consumido del estimado | Qué significa |
|---|---|
| Menos del 70% con el alcance avanzando | Va bien |
| 70-100% con alcance pendiente | **Avisar al cliente ahora**, no al pasarse |
| Arriba del 100% | Parar y ver si fue mala estimación (se absorbe y se aprende) o alcance nuevo (se cobra) |

Esa distinción es la única que importa: **subestimé** contra **me pidieron más**. La primera es tu costo; la segunda es un change order. Confundirlas te hace pagar por errores del cliente o cobrarle por los tuyos.

4. Detectar tareas hechas que no están en el alcance acordado. Si hay, ofrecer `change`.

### `change` - el change order

Cuando el cliente pide algo fuera del alcance acordado:

1. **Nombrarlo como alcance nuevo** en el momento y sin dramatizar: no es un reclamo, es cómo funciona. "Eso lo puedo hacer, está fuera del alcance de este contrato, te paso el número."
2. Estimar con `/estimate` y cotizar con el mismo criterio que la propuesta original: sobre el piso neto, con buffer.
3. Redactar el change order con `/contract-and-proposal-writer`.
4. Registrarlo en `## Change orders` de la nota con estado `propuesto`.
5. **No hacer el trabajo hasta que esté aprobado.** Es la regla 3 de `freelance-guardrails`: alcance nuevo, precio nuevo.

Si el usuario decide regalarlo (porque es chico, o por relación con el cliente), **está bien - pero se registra igual** con monto 0 y el motivo. Lo que no se registra no se puede medir, y `/freelance-pipeline` necesita saber cuánto trabajo regalado hay para decirte si es un patrón.

### `close` - cerrar el contrato

1. Completar `## Cierre`: entregado, cobrado, calificación recibida, y **qué haría distinto** (esa línea es la que sirve para cotizar el próximo).
2. `estado: cerrado`, y `/job-outcome` para mover la nota de la propuesta.
3. Comparar estimado contra real y dejarlo escrito. Es el dato más valioso del contrato entero: sin él, la próxima estimación es otra vez a ojo.
4. Ofrecer `/freelance-pipeline` si ya hay volumen, y `/cold-outreach` para pedir la referencia mientras el trabajo está fresco.

## Verificación rápida del estado

Para ver de una todos los contratos con horas por encima de lo estimado, sin abrirlos uno por uno:

```bash
python .claude/skills/career-registry/scripts/career_registry.py audit
```

Devuelve `contratos_con_horas_arriba_de_lo_estimado` con el exceso en horas y en porcentaje. Es la entrada natural de este skill cuando el usuario pregunta "¿cómo vengo?".

## Reglas

- **Nunca hacer trabajo fuera del alcance sin cotizarlo primero.** Si el usuario decide regalarlo, se registra con monto 0 y motivo.
- **Distinguir siempre subestimación de alcance nuevo.** Son dos cosas y se pagan distinto.
- Registrar las horas **no facturables** también: son las que explican por qué tu tarifa real es menor que la nominal.
- No editar el alcance acordado para que coincida con lo que se hizo. El alcance es el que se firmó; lo demás es change order.
- Nunca marcar un milestone como cobrado sin que el usuario lo confirme.
- Sin guiones largos en el texto agregado a las notas.

## Handoff

Pedí aprobación (approval) antes de escribir en la nota del contrato. Entrega COMPLETE cuando las horas están registradas y el alcance está alineado o hay un change order propuesto. Según el caso, el siguiente paso es `/contract-and-proposal-writer` (redactar el change order), `/job-outcome` (mover el estado al cerrar) o `/freelance-pipeline` (con 10+ propuestas resueltas, el diagnóstico del negocio).
