# Game Dev Coding Standards

Standards specific to video game development (engines, gameplay, shaders, assets). Complements `docs/coding-standards.md` (universal core).

---

## Architecture

### Data-driven values
**Gameplay values are NOT hardcoded.** Ever.

- Damage, HP, speeds, timings, drop rates, prices → external config (JSON, TSV, ScriptableObject, Resource)
- Designers edit config without touching code
- Exception: mathematical values (π, unit conversions)

### ADRs per system
Every game system must have an ADR in `docs/architecture/` explaining its technical decisions. Use the template `.claude/docs/templates/architecture-decision-record.md`.

### Scene/prefab separation
- **Logic in code, composition in scenes/prefabs.**
- Scenes must not hold critical inline scripting.
- Prefabs are configurable instances, not code containers.

### Dependency injection > Singletons
For testability, inject dependencies (via constructor, factory, or an explicit service locator). Singletons only for genuine cases (high-level GameManager, AudioBus).

---

## Engine-Specific

### Unity
- **ScriptableObjects for data** (stats, configs, events)
- **Addressables for asset loading** in medium/large projects
- **Jobs + Burst or DOTS** only when there is evidence the performance is needed — not preemptively
- **Awake vs Start:** Awake for the object's own setup, Start for setup that depends on others
- **Coroutines vs async/await:** coroutines for animation/timing, async for I/O

### Unreal
- **Blueprint vs C++:** quick gameplay in BP, critical and performance systems in C++
- **GAS (Gameplay Ability System)** for everything ability-based if the game uses it extensively
- **UMG for UI** (no ImGui or raw Slate unless it is debug)
- **Replication:** design networking from day 1 if it is multiplayer — not bolted on later

---

## Gameplay Code

### State machines
- **Enums + switch** for simple states (<5)
- **State pattern** (classes per state) for >5 states or complex logic
- **HFSM (hierarchical)** for complex AI

### Events / communication
- **Events over direct references** between decoupled systems
- **Direct references** when the coupling is inherent (Player → PlayerHealth)
- **Global pub/sub** only for cross-cutting concerns (achievement system, analytics)

### Frame-rate independence
- Movement uses `delta` time
- Cooldowns in seconds, not frames
- Animations with curve + duration, not frame-counted

### Determinism (when it matters)
- Replay systems, rollback netcode, lockstep multiplayer → require strict determinism
- Fixed timestep for physics
- Explicit seeds for RNG
- Floating point: watch the order of operations

---

## Shader Code

### General
- **Declared precision** (highp/mediump/lowp) for mobile
- **Minimize branches** in pixel shaders (use `lerp` / `step`)
- **No texture fetches in unbounded loops**
- **Batching-friendly:** same material → same draw call
- **Controlled variants** — multi_compile causes an explosion; prefer specific keywords

### Performance
- **Quad overdraw:** visualize it in the engine before shipping
- **Texture sampling count:** measure, minimize
- **GPU profiler:** confirm with the engine's tools (RenderDoc, PIX, Unity Frame Debugger)

---

## UI Code (Games)

- **Separate view from state:** UI reads state, it holds no business logic
- **Navigation:** keyboard + gamepad + touch from day 1, not bolted on
- **Focus management:** there is always one focused element (accessibility + gamepad)
- **Responsive layout:** anchors, constraints, safe areas (mobile)
- **Localization:** external strings from day 1, not hardcoded

---

## Network Code (Games)

### Authority
- **Server-authoritative** for competitive / economy / anti-cheat
- **Client-authoritative** only for cosmetics and preferences
- **Hybrid** (client predicts, server corrects) for movement in fast games

### Reliability
- **Unreliable UDP** for movement/position (constant stream, self-correcting)
- **Reliable UDP** for important events (spawn, death, ability activation)
- **TCP** only for lobby/matchmaking/chat

### Bandwidth
- **Delta compression** for state updates
- **Interest management:** do not send data for entities outside the view
- **Snapshots:** rate configurable by network

---

## Testing (Gamedev-Specific)

### Test evidence by story type

| Type | Required | Location | Gate |
|------|----------|----------|------|
| **Logic** (formulas, AI, state machines) | Automated unit test — pass required | `tests/unit/[system]/` | BLOCKING |
| **Integration** (multi-system) | Integration test OR documented playtest | `tests/integration/[system]/` | BLOCKING |
| **Visual/Feel** (animation, VFX, feel) | Screenshot + lead sign-off | `production/qa/evidence/` | ADVISORY |
| **UI** (menus, HUD, screens) | Manual walkthrough doc OR interaction test | `production/qa/evidence/` | ADVISORY |
| **Config/Data** (balance tuning) | Smoke check pass | `production/qa/smoke-[date].md` | ADVISORY |

### Automated test rules
- **Naming:** `[system]_[feature]_test.[ext]`; function: `test_[scenario]_[expected]`
- **Determinism:** tests give the same result every run — no free random seeds, nothing time-dependent
- **Isolation:** each test has its own setup/teardown; never depend on order
- **No hardcoded data:** fixtures in constant files or factory functions
- **No external calls:** no real APIs, no file I/O without a mock, no unisolated engine subsystems

### What NOT to automate
- Visual fidelity (shader output, VFX appearance, animation curves)
- "Feel" (input responsiveness, perceived weight, timing feel)
- Platform rendering (run on target hardware, not headless)
- Full gameplay sessions (playtesting, not automation)

### CI/CD per engine

- **Unity:** `game-ci/unity-test-runner@v4` (GitHub Actions)
- **Unreal:** headless runner with the `-nullrhi` flag

---

## Design Document Standards

Every design doc in `design/gdd/` follows these 8 required sections:

1. **Overview** — one-paragraph summary
2. **Player Fantasy** — intended feeling + experience
3. **Detailed Rules** — unambiguous mechanics
4. **Formulas** — all the math with defined variables + examples
5. **Edge Cases** — unusual situations resolved
6. **Dependencies** — other systems listed (bidirectional: if A depends on B, B mentions A)
7. **Tuning Knobs** — configurable values identified
8. **Acceptance Criteria** — testable success conditions (not "it should feel good")

### Additional rules
- Balance values link to their source formula or rationale
- Formulas: include the expected value range + a worked calculation
- Edge cases: state explicitly what happens, not "handle gracefully"
- Tuning knobs: specify safe ranges + which aspect they affect
- Acceptance criteria: testable — a QA must be able to verify pass/fail

---

## Asset Conventions

### Naming
- **Textures:** `t_[category]_[name]_[type]` e.g. `t_env_rock_albedo.png`
- **Meshes:** `sm_[category]_[name]` (static mesh) / `sk_[character]_[variant]` (skeletal)
- **Materials:** `m_[category]_[name]` / `mi_[name]` (material instance)
- **Audio:** `sfx_[category]_[name]` / `music_[context]` / `vo_[character]_[line_id]`

### Organization
- By feature, not by asset type
- `assets/characters/hero/{meshes, textures, materials, anims}`, not `assets/meshes/all`

### Version control
- LFS for large binaries (>1MB)
- `.gitignore` for engine caches (Library/, Intermediate/, Saved/)
