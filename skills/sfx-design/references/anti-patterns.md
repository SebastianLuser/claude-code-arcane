# SFX Design — Anti-patterns

## Approving in isolation

The most expensive mistake. A sound that is perfect solo disappears under music and ambience, or masks another sound's attack. Every effect is judged in context and at real game volume.

## Stacking layers until it "sounds big"

Eight layers do not sound bigger than three: they sound muddy. Size comes from band separation and from the contrast with the silence before it, not from quantity. Four layers is the practical ceiling.

## Two layers in the same band

If the sub and the punch fight at 80 Hz, one of them is surplus. Each layer gets its own band.

## Relying on the sub for force

A handheld speaker or cheap earbuds have no 40 Hz. If all of the impact's power lives there, on half the devices the sound is a click. The force also has to read at 100-300 Hz.

## Exaggerated pitch randomization

±20% is not variation, it is a different object. The weapon seems to change caliber between shots. ±2-4% and round-robin.

## Pure random instead of round-robin

Random repeats: with 4 variants, the probability of hearing the same one twice in a row is 25%. And immediate repetition is exactly what you wanted to avoid. Round-robin excluding the last one.

## A single variant for frequent events

It becomes audible as a sound after 20 minutes. If the event fires often, at least 4 variants or layer swapping.

## Chasing realism

A real gunshot is unimpressive and a real door sounds like nothing. The effect communicates gameplay function, not physics. If two weapons deal different damage, they have to sound different in weight.

## Attack with pre-roll

50 ms of silence or air before the transient makes the action feel laggy even if the code is instant. The transient goes in the first milliseconds of the file.

## Free energy at 2-6 kHz

It is the band where the ear is most sensitive and the one that fatigues fastest. It serves definition and UI feedback; overused across every SFX, the game becomes tiring in long sessions.

## Reverb baked into the asset

If the tail carries the recorded space, the sound cannot be relocated: it sounds like a cathedral inside a closet. The tail of its own goes dry and the middleware adds the space per zone.

## Tail that ignores 3D

A long tail on a 3D sound keeps playing when the source has already moved away, or cuts off abruptly when it leaves range. Define the attenuation with the tail in mind, not just the attack.

## Scaling by variant count

20 samples × 6 surfaces × 3 intensities = 360 files and ~180 MB, and repetition is still audible. When the problem has several dimensions, the answer is synthesis, not more recordings.
