# Audio Bible — Anti-patterns

## Empty direction

**Symptom:** "The game sounds dark and immersive."

Any sound passes that filter, so it filters nothing. A useful statement excludes: "Everything sounds recorded inside a concrete room — nothing is born clean, everything has the room on it." That rejects 90% of a library.

## Palette without sources

Listing adjectives (warm, aggressive, ethereal) without saying where the sound comes from leaves the decision to the sound designer, which is exactly what the bible should resolve. Name sources: instruments, materials, recording techniques, processing chains.

## Missing frequency allocation

Everything gets produced, the mix arrives, and dialogue competes with music and SFX at 500 Hz-2 kHz. The late fix is surgical EQ that thins everything out. The early fix is allocating bands before production.

## Copying the whole reference

"Sounds like Hollow Knight" without saying what is taken produces pastiche. For each reference: what to take and what to avoid, explicitly.

## Emotional targets that cannot be told apart

If exploration and tension share instrumentation, tempo and density, the player cannot read the state through audio. Test: describe the states without naming them and see whether they are distinguishable.

## Unproducible standards

"High-quality audio, no artifacts" is not a standard. Sample rate, bit depth, format per platform, naming pattern, loudness target with tolerance, headroom and voice budget are.

## Undocumented silence

The games with the best audio use silence deliberately. If the bible does not say where and why, someone will fill every second with ambience.

## Ignoring the platform

A bible that assumes studio monitors fails on a handheld speaker or on bluetooth earbuds. Loudness targets and frequency allocation change per platform — document which ones matter.

## A bible nobody gates against

If there is no review step that compares assets against the bible, it is decoration. Connect it to `/audio-audit` and make it a delivery condition.
