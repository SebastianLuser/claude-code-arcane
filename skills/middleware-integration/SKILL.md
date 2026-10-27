---
name: middleware-integration
description: "Audio middleware integration (Wwise/FMOD): containers, events, Switches/States/RTPCs, attenuations, soundbanks, streaming vs memory, and the contract with gameplay code. Use for: Wwise, FMOD, event authoring, RTPC, soundbanks, audio architecture."
category: "audio"
argument-hint: "[structure | events | rtpc | banks | contract]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# middleware-integration — Wwise / FMOD

Designs the structure of the middleware project and the contract between audio and gameplay code.

Agnostic concepts where possible; Wwise naming as the main reference, with the FMOD equivalent noted, because both model the same things under different names.

## When to use

- Structuring a Wwise/FMOD project from scratch
- Defining the contract of events the code will post
- Designing the soundbank organization
- The middleware project grew messy and needs reorganizing
- Deciding what goes in memory and what goes in streaming

## Input

1. Read `/audio-spec` (event lists), `/audio-mix` (buses) and `/adaptive-music` (transition matrix) if they exist
2. Determine the middleware and its version
3. Ask the user: target platforms, audio memory budget, and whether the project already exists or starts clean

---

## Wwise ↔ FMOD equivalences

| Concept | Wwise | FMOD Studio |
|---|---|---|
| Unit the code triggers | Event | Event |
| Variation container | Random / Sequence Container | Multi-instrument, Scatterer |
| Selection by discrete state | Switch Container | Parameter (labeled) |
| Continuous mix between variants | Blend Container | Parameter with automation |
| Continuous parameter | RTPC (Game Parameter) | Parameter (continuous) |
| Global state | State | Global parameter / Snapshot |
| Mix grouping | Actor-Mixer / Bus | Group bus |
| Mix snapshot | State with bus properties | Snapshot |
| Distance curve | Attenuation ShareSet | 3D panner + curves |
| Packaging | SoundBank | Bank |
| Interactive music | Music Switch / Playlist Container | Event with transition regions |

## Project structure

Organize by **gameplay system**, not by sound type. `Weapons/Shotgun/` is navigable; `Impacts/` with everything mixed together is not.

```
Actor-Mixer Hierarchy
├── Player          (locomotion, weapons, player voice)
├── Enemies         (per archetype)
├── World           (props, environment, destructibles)
├── Ambience        (per zone)
└── UI

Interactive Music
└── (per state: Explore, Combat, Victory...)

Events
└── (mirrors the Actor-Mixer hierarchy)
```

**Rules that prevent the mess:**
- One event per gameplay action, not per sound. `Play_Weapon_Fire` with a weapon-type Switch beats one event per weapon
- ShareSets (attenuation, conversion, effects) are defined once and reused. One ShareSet per object is the number one cause of unmanageable projects
- Separate work units per system: that is what lets two people work without merge conflicts

## Containers

| Container | When | Watch out |
|---|---|---|
| **Random** | Variation of the same sound | Use *shuffle* (round-robin), not pure random: random repeats |
| **Sequence** | Sounds that have an order (charge → fire) | Define what happens on interruption |
| **Switch** | Selection by discrete state (surface, weapon type) | Define the default: if the Switch is not set, the event does not play |
| **Blend** | Continuous mix by parameter (engine RPM) | Watch the curve overlap or there will be gaps |

## Switches, States and RTPCs

Three different things, and mixing them up is a common architecture mistake:

| | Scope | Type | Example |
|---|---|---|---|
| **Switch** | Per game object | Discrete | Surface under *this* character |
| **State** | Global | Discrete | The game is paused |
| **RTPC** | Global or per object | Continuous | Player health, combat intensity |

**Rule:** if it is a property of a specific object, it is a Switch. If it is a condition of the whole game, it is a State. If it is a number that varies smoothly, it is an RTPC.

Using a State for something that is per object is the bug that produces "every character walks on the player's surface".

**RTPC contract:** every RTPC needs a declared range, a curve, and a default value. The code **normalizes and clamps before sending it** — the middleware should never receive an out-of-range value.

## Soundbanks

Default strategy that works in most projects:

| Bank | Contents | When it loads |
|---|---|---|
| `Init` | Project structure, buses | At startup, always |
| `Global` | UI, player voice, persistent music | At startup, always |
| `Level_XX` | The level's ambience and props | When the level loads |
| `Character_XX` | Per character/enemy | With the character's spawn |

**Streaming vs memory:**

| Goes in memory | Goes in streaming |
|---|---|
| Everything short and frequent (SFX, UI, footsteps) | Music |
| Anything that needs zero latency | Long dialogue |
| | Long ambiences |

Streaming saves memory and costs latency and disk access. A streamed SFX arrives late; music in memory eats the budget.

**Prefetch** for streamed content that needs to start fast: the first ms go in memory and the rest is streamed.

## Contract with the code

What the code must be able to do, and nothing more:

```
PostEvent(eventName, gameObject)      → triggers
StopEvent(playingId, fadeMs)          → stops what loops
SetSwitch(group, value, gameObject)   → object property
SetState(group, value)                → global condition
SetRTPC(param, value01, gameObject?)  → parameter, normalized
RegisterGameObject / Unregister       → lifecycle
```

**Contract rules** (the same ones `rules/gamedev/audio-code.md` enforces):

- Gameplay **never** references assets, only event names
- Every loop has an explicit stop, and stops when its owning object is destroyed
- RTPCs arrive normalized and clamped
- An event that fails (bank not loaded) **does not break the frame**: it degrades silently
- Registering and unregistering game objects is mandatory — leaked objects are a classic leak

## Profiling

The middleware ships the profiler, and it is the only source of truth about what happens at runtime:

- **Active voices** vs the configured limit, and what is being dropped
- **Audio CPU** against 5-10% of the frame
- **Memory** per bank and total
- **Live RTPC values** — useful to discover that the code is sending the wrong range
- **Voice contribution tree** — why a sound is louder or quieter than expected
- Exportable captures for offline analysis

To profile game objects, the capture must be active in the Game Object view before the events fire, or nothing is recorded.

---

## Process

1. **Define the hierarchy** by gameplay system, with separate work units
2. **Create the attenuation and conversion ShareSets** before the objects, so they get reused
3. **Author the events** from the `/audio-spec` event list, one per action
4. **Define Switch/State/RTPC** with the correct scope, range and default
5. **Design the buses** from `/audio-mix`
6. **Define the banks** and what goes in streaming
7. **Document the contract** for the code team
8. **Write** — ask "May I write the architecture to `<path>`?" before using Write

### Note on automation

Wwise exposes WAAPI and FMOD has its scripting API, so batch authoring can be automated. There are third-party MCP servers that expose WAAPI to an agent, but at the time of writing the most complete one declares itself **EXPERIMENTAL and explicitly not recommended for production projects**. If you want to explore it, do it on a test project, never on the real one.

---

## Verdict

- **READY** — hierarchy by system, ShareSets reused, every parameter with the correct scope, banks defined, contract documented
- **CONCERNS** — the structure exists but there are duplicated ShareSets, parameters with the wrong scope (State where a Switch belongs), or banks without a loading strategy
- **BLOCKED** — the `/audio-spec` event list or the `/audio-mix` bus structure is missing

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/audio-audit` to profile voices, CPU and memory at runtime
- `/adaptive-music` if the music transition matrix is missing
- `/audio-spec` if the event list does not exist yet
