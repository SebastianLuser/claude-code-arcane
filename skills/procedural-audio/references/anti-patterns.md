# Procedural Audio — Anti-patterns

## Synthesis for elegance

Procedural is not better for being procedural. For a hero sound, a well-designed sample wins in quality, in control and in production time. Synthesis pays off where sampling does not scale; everywhere else it is extra work with a worse result.

## Confusing the frame budget with the callback budget

"1-2 ms per footstep" read as "it can be done inline in the update" is the most frequent calculation mistake. All of audio gets 0.8-1.7 ms per frame at 60 fps. The footstep has to be amortized: precompute, cache, or generate it on the audio thread with a buffer.

## Estimating instead of measuring

The reference costs are starting points, not promises. The real cost depends on platform, compiler and what else is running. Measure with the middleware profiler before committing to the architecture.

## A single parameter without a curve

Mapping intensity 0-1 linearly to amplitude produces a response that feels dead in the middle of the range. The perception of loudness and brightness is logarithmic: the curve matters as much as the range.

## Unclamped parameters

A speed value that arrives as 3.7 when the model expects 0-1 produces white noise at full volume. Normalize and clamp at the boundary, on the gameplay side.

## Synthesizing the whole ambience

Purely synthetic ambience sounds synthetic. The feeling of "alive" comes from the temporal and spatial distribution of the details, not from generating them. A sampled bed + procedurally positioned details wins.

## Variation without perceptual limits

Randomizing the parameters over a wide range produces steps that sound like different materials from each other. The variation has to be large enough not to repeat and small enough not to break the identity.

## No platform fallback

The model fits comfortably on PC and does not fit on the lowest target. If that is discovered at certification, the system has to be redone against the clock. The reduced sample path is decided in the design.

## Replacing everything at once

Migrating the whole audio system to procedural in one step makes it impossible to know which regression came from where. One system at a time, measuring before and after.

## Forgetting it is still a 3D source

A procedural footstep still needs position, attenuation and — if there are several characters — a voice limit. Synthesis solves memory, not voice management.

## Model without exposed parameters

If the model is hardcoded, it is not procedural: it is a sample generated at runtime, with all the costs and none of the advantages. The value is in gameplay being able to modulate it.
