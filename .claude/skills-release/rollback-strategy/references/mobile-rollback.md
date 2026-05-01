# Mobile Rollback (React Native)

No hay rollback instantaneo por App Store review.

## Mitigaciones

- **Feature flags server-driven** — toggle sin release
- **OTA updates** (Expo Updates / CodePush) para JS bundle
- **Version minima forzada** (force update) — obligar update si version rota
- **Compatibilidad API con N-2 versiones** — nunca romper clientes viejos
