# Context Management

## Problema

Claude Code tiene una ventana de contexto limitada. Sesiones largas pueden llegar al límite, forzando compaction que pierde nuances.

## Estrategia General

### 1. Session State Persistence

Todo estado importante se persiste en `production/session-state/active.md`:
- Tarea actual
- Sección en progreso
- Decisiones tomadas
- Próximos pasos

Esto permite retomar después de compaction o nueva sesión.

### 2. Incremental Writing

Los skills largos (como `/design-system`) escriben al disco incrementalmente después de cada sección aprobada. Si la sesión se corta, el progreso está guardado.

### 3. Delegation to Subagents

Para tareas con muchos archivos que leer:
- Spawn subagent con Task tool
- Le das la pregunta específica
- El subagent gasta su propio contexto
- Devuelve resumen al main session

Usar: `Agent` con `subagent_type: Explore` para búsquedas amplias.

### 4. Context Budget Awareness

Cuando el status line muestra >= 70%:
- Skills largos pausan y sugieren nueva sesión
- Se escribe progreso a disco
- Se recomienda correr `/resume-work` en nueva sesión

### 5. Compaction Hooks

- `pre-compact.sh`: Guarda summary del estado antes de compaction
- `post-compact.sh`: Carga summary después de compaction

## Best Practices

- **Lee solo lo necesario.** No abras archivos "por si acaso".
- **Usa Grep antes que Read.** Busca el símbolo específico, no leas todo.
- **Delegá exploraciones amplias a subagents.** Preservá tu contexto.
- **Resumí conversaciones largas.** Cada ~20 turnos, resumí decisiones.
- **Confiá en session-state.** No recuerdes todo en contexto — persistí al disco.
