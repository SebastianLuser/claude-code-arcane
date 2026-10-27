# Middleware Integration — Anti-patterns

## One event per sound

500 events where 40 with Switches would have been enough. The code ends up knowing every asset's name, which is exactly what the middleware was supposed to avoid. One event per *gameplay action*.

## One ShareSet per object

Every sound with its own attenuation and its own conversion. Changing the game's hearing range goes from one change to 300. Define the ShareSets first and reuse them.

## State where a Switch belongs

Using a global State for the surface under the character produces the classic bug: every character walks on the player's surface. Object property = Switch.

## Switch without a default

If the Switch is not set when the event arrives, the sound does not play, and the bug is invisible until someone notices the silence. Every Switch group gets a default.

## Pure random instead of shuffle

Random repeats: with 4 variants there is a 25% chance of hearing the same one twice in a row. Shuffle/round-robin excluding the last one.

## RTPC without a clamp on the code side

A health value that arrives as 150 when the RTPC expects 0-100 leaves the parameter stuck at the extreme. Normalize and clamp at the gameplay boundary.

## Loops without an explicit stop

The number one source of stuck audio. Every looping sound needs a stop, and it must stop when its owning object is destroyed.

## Game objects never unregistered

Every dead enemy leaves its game object registered. After two hours of play there are thousands. A classic leak, and it ruins profiling.

## Everything in one bank

A monolithic bank loads in full even if the level uses 10% of it. And any change forces redistributing all of it. Init + Global + per level + per character.

## SFX in streaming

A short, frequent sound in streaming arrives late and causes disk access. Streaming is for music, long dialogue and ambiences.

## Music in memory

It eats the entire audio budget. Streaming with prefetch.

## Event failure that breaks the frame

An unloaded bank throws an exception that reaches gameplay. Audio always degrades silently.

## Hierarchy by sound type

`Impacts/` with every impact in the game mixed together can be neither navigated nor mixed. Organize by gameplay system.

## A single work unit

Two people working produce unresolvable merge conflicts in a giant binary or XML file. Work units per system.

## Trusting the editor instead of the profiler

Firing events by hand from the editor says nothing about active voices, CPU or memory in real gameplay. The profiler is the only source of truth.

## Profiling game objects without enabling the capture

Without the capture active in the Game Object view before the events fire, nothing is recorded and it looks like the system does not work.

## Automating on the production project

Batch authoring tools via WAAPI are powerful, and the third-party ones are mostly experimental. Try them on a throwaway project; the real project is not the place.
