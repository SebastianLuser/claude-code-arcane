# Adaptive Music — Anti-patterns

## Crossfade as the only transition

Blending two pieces in different keys or tempos sounds like an error, not a transition. A crossfade only works if the material shares harmony and grid. If not, you need a sync point + a transition segment.

## Immediate transitions by default

Cutting instantly is responsive and musically destructive. Reserve it for player death and deliberate cuts. The sane default is next bar.

## Thresholds without hysteresis

The classic case: the player walks along the edge of a detection radius and the combat music comes in and out six times in ten seconds. Asymmetric thresholds + minimum time in state + debounce. Always.

## Layers that depend on each other

If the melody layer was written assuming the harmony layer is playing, removing the harmony leaves the melody floating without context. Each layer has to work alone and with any subset of the layers below it.

## Stingers in the wrong key

The most audible error in the system. If the background modulates and the stinger is tonal and fixed, it will clash. Per-key versions, or tonally neutral stingers.

## Stingers without cooldown

Five kills in two seconds fire five overlapping stingers. It sounds like a bug.

## Counting stems and not memory

Eight stereo stems at 48 kHz playing simultaneously is much more than "eight files". If they are decompressed in memory, the number grows fast. Verify the budget before committing to the vertical architecture.

## Designing the system after composing

If the composer delivered a linear three-minute piece with a climax, turning it into layers is impossible without redoing it. The system is designed first and defines the compositional constraint.

## One state per situation

Twenty music states for twenty gameplay situations produce a 400-cell transition matrix nobody will author well. Group situations by emotional target: most games live well with 4-6 states.

## A loop that closes with an authentic cadence

Every repetition sounds like a forced restart. Close open: half cadence, pedal, plagal cadence.

## Music occupying the dialogue range

If the arrangement lives in 500 Hz-2 kHz and there is VO, one of the two loses, and aggressive ducking is audible. It is solved in the arrangement, not in the mix.

## Ignoring the initial state and the return

Explore → combat is designed carefully and combat → explore is forgotten. The return is the transition the player hears the most.

## Testing only in the editor

The middleware editor lets you fire states by hand, in the right order, with no noise. A real player fires transitions in impossible sequences. Test with gameplay, not with buttons.
