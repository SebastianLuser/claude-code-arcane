---
name: audio-audit
description: "Audio audit: voice count, CPU, memory, streaming, loudness compliance (ASWG-R001), asset conformance against the spec, and a per-platform checklist. Use for: audio QA, audio performance, verifying loudness, reviewing assets, pre-certification."
category: "audio"
argument-hint: "[full | perf | loudness | assets | platform]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---
# audio-audit — Audio QA and Compliance

Verifies that the project's audio meets: performance within budget, assets conforming to the spec, and loudness within the platform target.

## When to use

- Before a milestone or certification
- Audio cuts out, clips or eats too much CPU
- Verifying assets delivered by a contractor
- Auditing loudness to meet platform requirements
- After integrating a new system, to measure its real cost

## Input

1. Read the audio bible (section 8, standards) and the `/audio-spec` specs
2. Determine the target platforms, and which one is the lowest
3. Ask the user: scope (`full` / perf only / loudness only / assets only) and whether a profiler capture is available

---

## 1. Performance

**Budget:** audio gets **5-10% of the frame time**. At 60 fps the frame is 16.6 ms, so audio has ~0.8-1.7 ms. At 90 fps (VR) the frame is ~11 ms and the margin is smaller.

| Metric | How it is measured | Verdict |
|---|---|---|
| **Audio CPU** | Middleware profiler, in real gameplay | FAIL if it sustains more than 10% of the frame |
| **Active voices** | Peak vs configured limit | CONCERNS if the peak hits the limit; FAIL if high-priority sounds get dropped |
| **Audio memory** | Per bank and total, vs the project budget | FAIL if it exceeds the budget on the lowest platform |
| **Streaming accesses** | Profiler streaming counter | CONCERNS if there is starvation |
| **Registered game objects** | Counter, measured over a long session | FAIL if it grows monotonically (leak) |

**Measure in real gameplay, not in the editor.** The editor fires events in order, one at a time, with no noise. The player produces combinations nobody planned. And measure on the **lowest platform** in the target: a budget that fits on PC says nothing about a handheld.

**The game object leak is the most frequent finding.** If the registered-object counter grows during a two-hour session and never drops, unregistrations are missing. It only shows up in long sessions.

### Reference costs

To tell whether a measured number is reasonable:

| Operation | Expected cost per source |
|---|---|
| HRTF convolution (512 taps) | ~2 ms |
| Ambisonic encode | ~0.1 ms |
| Ambisonic to binaural decode | ~1 ms total |
| Procedural footstep | ~1-2 ms |
| Wind synthesis | ~0.5 ms/frame |
| Panning + attenuation | negligible |

If the measurement deviates a lot from the expected value, the cause is usually configuration (more taps, more spatialized sources than planned) rather than the engine.

## 2. Loudness

Industry reference for games: **ASWG-R001** (Sony), the only specification published by a major platform.

| Context | Average loudness | Maximum true peak |
|---|---|---|
| Console / home | **−23 LUFS** (±2) | **−1 dBTP** |
| Portable / handheld | **−18 LUFS** | −1 dBTP |

**How to measure properly:**

- Measure the **full program in representative gameplay**, not an isolated asset. Measuring a `.wav` says nothing about compliance
- A session long enough to average: at least several minutes covering exploration, combat and dialogue
- Measure **true peak**, not sample peak: lossy encoding can produce peaks above the value measured in PCM
- **Confirm each platform's current target** before certification. Recommendations get revised — the ASWG average has also been quoted as −24 LKFS, so do not trust a memorized number

**Verdict:** COMPLIANT within the target and its tolerance; NON-COMPLIANT outside it, or with a true peak above −1 dBTP.

## 3. Asset conformance

Mechanical verification against the bible's standards. This gets automated:

| Check | Typical failure |
|---|---|
| Sample rate | A mix of 44.1 and 48 kHz in the same project |
| Bit depth | 24-bit where the pipeline expects 16 |
| Channels | Stereo on an asset used as a mono 3D source |
| Naming | Does not follow the pattern; breaks batching and bank automation |
| DC offset | Produces clicks when concatenating |
| Leading silence | Delays the attack; perceived as lag |
| Clipping | Peaks at 0 dBFS in the raw asset |
| Duration vs spec | Outside the specified range |
| Loudness per category | Assets in the same category at mismatched levels |

**A stereo 3D source is the most common and the quietest finding:** the middleware treats it differently or collapses it, and spatial localization degrades without anyone seeing an error.

The skill ships the checker: `scripts/check_assets.py`, stdlib-only (`wave` module), recursive over a folder.

```bash
python skills/audio-audit/scripts/check_assets.py assets/audio \
  --rate 48000 --bits 16 --mono-3d --naming '^(sfx|vo|mus)_'
```

It checks sample rate, bit depth, channels, naming, clipping, DC offset, leading silence, empty or silent files, and warns when the sample rate forces an expensive resample. It emits `[FAIL]` / `[WARN]` / `[SKIP]` per finding and ends with COMPLIANT / CONCERNS / NON-COMPLIANT; exit code 1 only when there is a FAIL, so it can be used in CI.

Whatever needs an external tool (integrated loudness, spectral analysis) is reported as `[SKIP]` instead of aborting the run.

## 4. Per-platform checklist

| Item | Applies to |
|---|---|
| Loudness within the context's target | All |
| True peak ≤ −1 dBTP | All |
| Interruption handling (call, alarm) | Mobile |
| Route change handling (headphones) | Mobile, console |
| Respecting the silent switch | iOS |
| Background behavior | Mobile |
| Mixing with third-party audio | Mobile |
| Audio does not break on focus loss | All |
| Memory within the platform budget | All |
| Everything can be muted from options | All |
| Separate controls: music / SFX / voice / UI | All |
| Critical information not conveyed by audio alone | All (accessibility) |
| Subtitles for all dialogue | All (accessibility) |

Background behavior and the iOS silent switch are concrete causes of store rejection, not recommendations.

---

## Process

1. **Determine the scope** and the lowest platform in the target
2. **Capture** with the middleware profiler in representative gameplay, not in the editor
3. **Measure performance** against the budget and compare with the reference costs
4. **Measure loudness** of the full program, with true peak
5. **Verify assets** against the standards, automated if the volume justifies it
6. **Walk through the platform checklist**
7. **Report** with a severity per finding and, if the user asks for it, ask "Shall I write the report to `<path>`?" before using Write

### Report format

Per finding: what was measured, measured value, expected value, severity, and where the problem is. A finding without a measured number is not a finding, it is an impression.

---

## Verdict

Global, and per section:

- **COMPLIANT** — performance within budget on the lowest platform, loudness within the target, assets conforming, checklist complete
- **CONCERNS** — there are non-blocking deviations: voice peak hitting the limit, assets with inconsistent naming, loudness at the edge of the tolerance
- **NON-COMPLIANT** — CPU or memory over budget, loudness outside the target, a game object leak, or a checklist item that causes platform rejection

A NON-COMPLIANT in any section blocks certification.

## Anti-patterns

> → Read references/anti-patterns.md

## Next steps

- `/spatial-audio` if the spatialization cost is over budget
- `/audio-mix` if the problem is loudness or balance between categories
- `/middleware-integration` if there are leaks, badly organized banks or dropped voices
- `/procedural-audio` if memory does not fit because of the number of samples
