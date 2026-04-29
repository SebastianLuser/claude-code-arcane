# Checklist Pre-deploy

- [ ] Artefacto taggeado por `$GIT_SHA`
- [ ] 10+ imagenes retenidas en Artifact Registry
- [ ] Schema expand/contract separados de codigo
- [ ] Compatibility window N-1 validada
- [ ] Comando rollback escrito en ticket/PR
- [ ] Feature flag con kill switch si user-facing
- [ ] Canary configurado para cambios riesgosos
- [ ] Auto-rollback triggers definidos
- [ ] Workflow rollback.yml disponible y probado
- [ ] Runbook actualizado con comandos del servicio
- [ ] DR drill DB restore ejecutado ultimo trimestre
- [ ] Responsable on-call identificado
- [ ] Plan comunicacion listo
