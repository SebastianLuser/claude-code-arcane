# Ciclo de Vida de Runbooks

## Review
- Review obligatorio tras cada incident que uso el runbook
- Audit trimestral: stale (>6 meses sin commit), URLs rotas, comandos que no corren
- Drills trimestrales: simular escenario, medir si sirve

## Automatizacion Progresiva

```
runbook manual -> script en repo -> cronjob -> auto-remediation (alerta -> webhook -> accion)
```

Aunque se automatice, el runbook describe el "por que" para cuando el script falle.
