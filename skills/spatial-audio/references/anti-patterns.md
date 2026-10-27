# Spatial Audio — Anti-patterns

## HRTF on every source

50 sources × 2 ms = 100 ms of CPU, against a 16.6 ms frame at 60 fps. It is not expensive: it is six times impossible. The real budget is 3-5 sources with HRTF and the rest through Ambisonics or panning.

## HRTF on speakers

HRTF assumes headphones. On speakers the crosstalk between channels destroys the binaural cues and it sounds worse than honest panning. If headphones are not guaranteed, you need output-route detection or it is ruled out.

## Volume as the only distance cue

A sound that only drops in volume is perceived as "quieter", not as "farther away". You need all four components: volume, increasing low-pass, decreasing spread and more reverb.

## Confusing occlusion with obstruction

Applying full occlusion where there was obstruction makes an enemy behind a column inaudible. Obstruction lowers the direct sound and keeps the reflected one; occlusion lowers both.

## Raycasts without a budget

The expensive part of occlusion is the raycast, not the filter. With 30 sources raycasting every frame the cost skyrockets. Limit, spread across frames, cache.

## Occlusion without interpolation

Applying the value at once produces a very audible jump every time the player crosses the edge of a piece of geometry. Always interpolate toward the target.

## Curves without min/max distance

Leaving the middleware default produces sounds audible at 200 m or that disappear at 3 m. Both values and the shape of the curve are part of the spec.

## Zone reverb with an instant change

The preset jump is heard as a cut. Crossfade at the transition, and let the previous tail finish.

## Spatialized music and UI

They have no position in the world. Spatializing them produces odd panning and wasted cost.

## Dialogue treated as just another 3D source

If important dialogue gets occluded and attenuated like any SFX, the player loses information. It usually needs pseudo-3D treatment: direction yes, occlusion no.

## Budgeting against the highest platform

The model fits on PC and not on the lowest target. The budget is made against the floor, not the ceiling.

## Ambisonics for important point sources

Ambisonics shines in diffuse fields and ambience. For the critical source the player has to localize precisely, it does not replace HRTF.

## Ignoring VR's tighter budget

90 fps leaves ~11 ms per frame. A spatialization plan calculated for 60 fps does not fit.
