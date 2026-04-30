---
owner: {owner-email}
service: {service-name}
last_reviewed: {YYYY-MM-DD}
last_used_in_incident: {YYYY-MM-DD}
---
# {ALERT_NAME}

## Severidad

{SEV1 (>50% afectados) | SEV2 (degradacion parcial) | SEV3 (informativa)}

## Sintomas

- Que ve el usuario: {descripcion}
- Que dispara la alerta: {condicion de la alerta}
- Dashboards: [{dashboard-name}]({dashboard-url})

## Impact Assessment

- Que esta roto: {descripcion}
- A cuantos afecta: {numero/porcentaje}
- Desde cuando: {timestamp o "desde que disparo la alerta"}
- Horario escolar: {si/no — si es horario escolar, elevar severidad +1}

## Diagnostic Steps

```bash
# Paso 1: {descripcion}
{comando-exacto-copypasteable}

# Paso 2: {descripcion}
{comando-exacto-copypasteable}
```

**Criterio de decision:** Si {metrica} > {umbral} -> ir a Mitigation. Si no -> verificar {otra cosa}.

## Mitigation

Parar el sangrado — no fix permanente.

```bash
# Opcion A: Rollback
{comando-rollback}

# Opcion B: Scale up
{comando-scale}
```

## Resolution

Fix permanente (puede ser en horas):

1. {paso}
2. {paso}
3. {paso}

## Rollback Plan

Si el fix empeora las cosas:

```bash
{comando-rollback-del-fix}
```

## Escalation Path

| Tiempo | Accion | Contacto | Canal |
|--------|--------|----------|-------|
| 0-15 min | On-call primario | {nombre} | {canal-slack} |
| 15-30 min | On-call secundario | {nombre} | {canal-slack} |
| 30-45 min | Engineering Manager | {nombre} | {telefono} |
| 45+ min | CTO | {nombre} | {telefono} |

## Post-incident

- [ ] Crear postmortem con `/incident`
- [ ] Jira action items creados
- [ ] Actualizar este runbook con lo aprendido
- [ ] Review con equipo en proxima retro
