---
paths:
  - "src/audio/**"
---

# Audio Code Rules

- NEVER hardcode asset paths or clip references in gameplay code — post middleware events by name/ID
- Gameplay code MUST NOT call `Play()`/`PlayOneShot()` directly — raise an audio event, let the audio layer resolve it
- Concurrency limits (max instances, priority, cooldown) MUST be declared in data, never enforced with ad-hoc counters in gameplay
- Use delta time for ALL fades, ducking ramps and RTPC interpolation (frame-rate independence)
- NO static singletons for audio state — inject the audio service
- Every RTPC/parameter driven from gameplay must be normalized and clamped at the boundary before it reaches the middleware
- Voice budget is a hard limit: define max simultaneous voices per category and drop by priority, never let it grow unbounded
- Audio must degrade silently — a missing bank or failed event NEVER throws into the gameplay frame
- Keep the audio update off the render-critical path; audio work budget is 5-10% of frame time
- Reference the audio bible section each event implements in code comments

## Examples

**Correct** (event-driven, data-declared):

```csharp
// Gameplay raises intent; the audio layer owns resolution and limits.
audioService.Post(AudioEvent.PlayerFootstep, transform.position);

float wetness = Mathf.Clamp01(surface.Wetness);       // clamped at the boundary
audioService.SetParameter(AudioParam.SurfaceWetness, wetness);

// Fade driven by delta time, not frame count.
currentVolume = Mathf.MoveTowards(currentVolume, targetVolume, fadeRate * Time.deltaTime);
```

**Incorrect** (hardcoded, direct, frame-dependent):

```csharp
AudioSource.PlayClipAtPoint(
    Resources.Load<AudioClip>("SFX/footstep_concrete_01"),  // VIOLATION: hardcoded path
    transform.position);                                     // VIOLATION: direct playback from gameplay

AudioManager.Instance.Play("footstep");   // VIOLATION: static singleton

currentVolume -= 0.02f;                   // VIOLATION: no delta time
audioService.SetParameter(AudioParam.SurfaceWetness, rawSensorValue);  // VIOLATION: unclamped
```
