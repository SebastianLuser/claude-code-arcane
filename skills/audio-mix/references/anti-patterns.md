# Audio Mix — Anti-patterns

## Mixing in isolation

Approving each category separately and hoping the whole works. The mix is validated by playing the worst case: maximum density, with dialogue, with combat music, on the smallest device.

## Ducking release too short

The music rises and falls with every word and the pumping is audible. Release always longer than attack: 300-500 ms for dialogue.

## Ducking as the fix for masking

If music and dialogue both live in 500 Hz-2 kHz, you have to duck so much that the effect is audible. That is solved in the arrangement, by leaving the range free. Ducking is fine adjustment.

## Everything ducks everything

Barks ducking music, UI ducking SFX, ambience ducking barks. The result is a mix that breathes all the time and is never still. Define what ducks what, and keep it to a few.

## A single SFX bus

With 40 enemies, the feedback for the player's action gets lost among the rest. Separating `Player` from `World` is what lets you protect it.

## Dialogue and barks on the same bus

Every combat bark ducks the music. Separating them lets you duck for important dialogue only.

## UI inside SFX

UI has a different level (−18 to −24 dB) and usually needs its own user control. Placed inside SFX, it inherits a volume that does not belong to it.

## Mix states that jump

Switching snapshots instantly sounds like a cut. Interpolate 200-500 ms depending on the change.

## States without priority

Combat and Low health want to activate at once and the result depends on evaluation order. Explicit priority.

## Corrective EQ on everything

Thinning every source with EQ until they stop fighting produces a thin mix with no weight. The root problem is band allocation, or too many sources playing.

## Mistaking "sounds small" for an EQ problem

When everything sounds small, there are almost always too many active voices and none has room. It is a voice count problem, and EQ does not fix it.

## No headroom

Mixing for the average case and clipping when an explosion, music and dialogue coincide. The margin is calculated against the worst case.

## Measuring loudness on an isolated asset

LUFS targets apply to the full program in representative gameplay. Measuring one file says nothing about compliance.

## Assuming a target without verifying it

Platform targets get revised. Confirm the current one before certification instead of trusting a memorized number.

## Ignoring true peak

A mix that reaches 0 dBFS in PCM can produce higher peaks once encoded to lossy. −1 dBTP exists for that reason.

## Mixing only on good headphones

The mix sounds perfect on the sound designer's monitors and falls apart on a handheld speaker. Validate on the smallest target device.
