---
name: procedural-audio
description: "Procedural audio: footsteps, wind, ambiences and surfaces through synthesis instead of samples. Decide when it pays off, design the model and budget CPU. Use for: procedural sound, synthetic footsteps, generative ambience, reducing audio memory."
category: "audio"
argument-hint: "[decide | footsteps | wind | ambience | budget]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---
# procedural-audio — Synthesis instead of Samples

Solves through generation the audio systems where sampling does not scale: high trigger frequency crossed with many dimensions of variation.

## When to use

- The asset count explodes: surfaces × intensities × variants
- The memory budget cannot cover the variation the system needs
- The repetition is audible even with many variants
- The sound has to respond continuously to a parameter (speed, material, size)

## When NOT to use

Synthesis is not free: it costs CPU per frame and tuning work. Do not use it for hero sounds (the main weapon, the victory theme) — there a well-designed sample wins in quality and control. Synthesis pays off on what is frequent and variable, not on what is memorable and unique.

---

## Modes

| Mode | What it does |
|---|---|
| `decide` | Only the evaluation: synthesize or sample? Asset count and budget |
| `footsteps` | Designs the footstep model with per-surface resonances |
| `wind` | Designs the layered wind model |
| `ambience` | Designs the hybrid ambience: sampled bed + procedural detail |
| `budget` | Only the CPU budget and where each model runs |

## The decision

Evaluate two axes: **trigger frequency** and **dimensions of variation**.

| | Few dimensions | Many dimensions |
|---|---|---|
| **Low frequency** | Sample. Always | Sample with layer swapping |
| **High frequency** | Sample + round-robin | **Procedural** |

The canonical case: footsteps on 6 surfaces × 3 intensities, with 20 variants each, are **360 files (~180 MB)** — and even so the repetition is audible in long sessions. A procedural model is **~50 KB** with infinite variation.

Before committing, do the math explicitly:

```
assets = surfaces × intensities × variants
memory ≈ assets × average_size
```

If the result is in the three digits of files, synthesis already justifies itself.

---

## CPU budget

This is what decides whether the model fits or not. Reference costs per source:

| Operation | Cost |
|---|---|
| Procedural footstep | ~1-2 ms |
| Wind synthesis | ~0.5 ms/frame |
| HRTF convolution (512 taps) | ~2 ms/source |
| Ambisonic encode | ~0.1 ms/source |
| Ambisonic decode to binaural | ~1 ms total |

**The total audio budget is 5-10% of frame time.** At 60 fps the frame is 16.6 ms, so all of audio gets ~0.8-1.7 ms. A 1-2 ms procedural footstep **does not fit in a single frame**: it has to be amortized (generated ahead of time, the result cached, or generated on an audio thread with a buffer).

That is the most common calculation mistake: reading "1-2 ms per footstep" and assuming it can be done inline in the update. In a 5-10 ms audio callback at 48 kHz / 512 samples there is margin; in the render frame there is not.

---

## Footstep model

Three components, each with exposed parameters:

1. **Impact** — a burst of noise filtered at the material's resonant frequency, very short envelope
2. **Material resonance** — a resonant filter at the characteristic frequency
3. **Texture** — noise with a longer envelope: shifting gravel, leaves, water

**Resonant frequencies per surface:**

| Surface | Frequency | Texture |
|---|---|---|
| Concrete | 150 Hz | Minimal, dry attack |
| Wood | 250 Hz | Long resonance, creak |
| Metal | 500 Hz | Very long tail, harmonics |
| Gravel | 300 Hz | Noise-dominant, long |

**Input parameters** from gameplay, all normalized 0-1:

| Parameter | Effect |
|---|---|
| Material | Selects frequency and texture profile |
| Intensity (speed) | Amplitude, brightness, attack duration |
| Character weight | Base frequency, amount of sub |
| Surface wetness | Water layer, damping of the resonance |

The variation comes from slightly randomizing each parameter per step, not from choosing between files. That is what makes the variation infinite.

## Wind model

Filtered noise with slow modulation, in layers:

- **Base** — pink noise with a low-pass, cutoff modulated slowly (0.05-0.2 Hz)
- **Gusts** — amplitude modulated by low-frequency noise, with occasional peaks
- **Whistle** — resonant filter at 800 Hz-2 kHz, only when intensity crosses a threshold
- **Detail** — a subtle high-pass that appears with intensity

Main parameter: intensity 0-1, mapped to cutoff, modulation depth and whistle presence. A single parameter drives everything from breeze to storm.

## Ambiences

Pure ambience synthesis usually sounds synthetic. The hybrid approach wins:

- **Bed** — a long looped sample (the only sample in the system)
- **Detail** — one-shots positioned by procedural logic: which sound, how often, from where
- **Modulation** — the bed's filter and volume driven by environment parameters (interior/exterior, weather, time of day)

The feeling of "alive" comes from the **temporal and spatial distribution** of the details, not from synthesizing them. A sampled bird that appears at unpredictable positions and moments sounds more alive than a synthesized one on a fixed loop.

---

## Process

1. **Do the math** on assets and memory; if it does not justify it, stop and use samples
2. **Budget CPU** against 5-10% of the frame, and decide where it runs (frame vs audio thread vs precomputed)
3. **Design the model** by components with exposed parameters
4. **Map the gameplay parameters**, normalized and clamped at the boundary
5. **Define the fallback** — what plays if the model is disabled for budget reasons on a low-end platform
6. **Write** — ask "Should I write the design to `<path>`?" before using Write

### Mandatory fallback

Every platform has a floor. If the procedural model does not fit on the lowest target platform, a reduced sample path is needed. Decide it in the design, not when certification fails.

---

## Verdict

- **READY** — the math justifies synthesis, the CPU budget closes with where it runs, the parameters are mapped and there is a fallback
- **CONCERNS** — the model is designed but the CPU budget was not verified on the lowest platform, or the fallback is missing
- **BLOCKED** — the asset count and the trigger frequency are unclear, so it cannot be decided whether it pays off

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/sfx-design` for the hero sounds, which remain samples
- `/audio-audit` to measure the real CPU cost at runtime, not the estimate
- `/middleware-integration` to expose the parameters as RTPCs
- `/spatial-audio` if the procedural sources are also positioned in 3D
