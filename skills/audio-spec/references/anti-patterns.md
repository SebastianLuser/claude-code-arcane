# Audio Spec — Anti-patterns

## Spec without numbers

"Powerful, satisfying impact" is not producible. Duration, envelope, frequency bands and relative level are. If the field has no number or range, it is not specified.

## Duration as a single value

"200 ms" forces the sound designer to lie or to ask for approval. A range (180-260 ms) lets the sound end where it needs to end.

## Events without concurrency

The spec says "shell casing hitting the ground". 40 enemies show up, 300 casings, the voice budget blows up and the mix disappears. Every event that can fire more than once per frame needs a max instance count and a drop policy.

## Missing cooldown on UI events

Fast navigation in a menu fires the same tick 15 times in 200 ms. It sounds like a glitch. Minimum cooldown, always.

## A single variant

A sound with no variants becomes audible as a *sound* instead of as an event after about 20 minutes of play. If the event is frequent, at least 4-5 variants or pitch randomization, and preferably both.

## Exaggerated pitch randomization

±3% is variation. ±20% changes the object: the weapon sounds like a different weapon. A small range plus round-robin beats a large range.

## 3D specs without a curve

Marking "3D" without defining min/max distance or curve shape leaves attenuation at the middleware default, which is almost never the right one. The sound is heard at 200 m or disappears at 3 m.

## Specifying before deciding on procedural

Writing 360 footstep spec sheets is wasted work if the right answer was synthesis. Evaluate the frequency × dimensions axis before specifying.

## Event list without a stop condition

Loops are the number one source of stuck audio. Every looping sound needs to state explicitly who stops it and what happens if the owning object is destroyed first.

## All priorities equal

If everything is high priority, the voice limiter drops at random and the player's action feedback drops before a distant ambience. Priorities only work if they are differentiated.

## IDs that don't follow the bible's naming

`shotgun2_FINAL_v3` breaks search, batch processing and bank automation. The ID comes from the bible's pattern, no exceptions.
