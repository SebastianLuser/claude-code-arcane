# Anti-patterns — SLO/SLI

- SLO 100% — imposible, desincentiva deploys
- SLI infra-centric (CPU/RAM) — no es experiencia de usuario
- Sin error budget policy — SLO decorativo
- SLO sin baseline real — primero medis, despues prometes
- Solo p50 — ignora cola
- Ventana corta (5min) sin larga (30d) — pierde drain lento
- Una sola alerta fixed-threshold — fatiga garantizada
- SLOs sin owner — nadie los revisa
- Mismo SLO para todos los servicios
- Ignorar contexto temporal (horario escolar)
