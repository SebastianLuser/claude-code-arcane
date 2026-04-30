# TTL Defaults

| Tipo | TTL |
|------|-----|
| Assets versionados | 1 anio (immutable) |
| Lista cursos publico | 5 min |
| Detalle curso | 1 min |
| Perfil usuario | 5 min (invalidate on write) |
| Config/feature flags | 30 seg |
| Rate limit counters | ventana exacta |
| Respuesta LLM/IA | horas a dias (segun costo) |
