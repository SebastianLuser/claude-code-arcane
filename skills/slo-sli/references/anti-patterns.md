# Anti-patterns — SLO/SLI

- 100% SLO — impossible, discourages deploys
- Infra-centric SLI (CPU/RAM) — not user experience
- No error budget policy — a decorative SLO
- SLO without a real baseline — measure first, promise later
- p50 only — ignores the tail
- Short window (5min) without a long one (30d) — misses slow drain
- A single fixed-threshold alert — guaranteed fatigue
- SLOs without an owner — nobody reviews them
- The same SLO for every service
- Ignoring the time context (school hours)
