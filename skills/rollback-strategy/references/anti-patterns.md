# Anti-patterns de Rollback

- `:latest` en prod — rollback imposible
- Schema breaking + codigo breaking en misma release
- Nunca probar rollback — descubris que no funciona cuando lo necesitas
- DB restore sin drill previo
- Rollback sin post-mortem
- "Deshacer merge en git" sin plan real de redeploy
- Flag sin kill switch server-side
- Sin runbook — nadie sabe comandos a las 3am
- Sin invalidar cache/CDN
- No retener imagenes viejas (10 minimo)
- Rollback workflow sin approval gate
- Ignorar mobile en la estrategia
