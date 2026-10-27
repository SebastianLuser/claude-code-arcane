# Game Music

## The central constraint

Game music is heard **many more times than linear music, for an unknown duration, and competing with SFX and dialogue**. That changes the compositional decisions, not just the implementation.

Direct consequences:

1. **What is "interesting" in linear music is "tiring" here.** A striking gesture every 8 bars becomes unbearable by the twentieth repetition
2. **The duration is undefined.** There is no guaranteed climax; the arc has to work when cut at any point
3. **The mid register is not yours.** Dialogue and UI feedback live there
4. **Silence is cheap and powerful.** It is the only resource that does not wear out with repetition

## Writing for repetition

- **Long loops with short material** — a 2-minute loop built from 4 cells is less tiring than a 30-second one with 12 ideas
- **Avoid the signature gesture inside the loop** — save the distinctive events for stingers or for layers that enter occasionally
- **Slow harmonic rhythm** — the progression you can hear 50 times is the one that does not draw attention to itself
- **Ambiguous ending** — if the loop closes with an authentic cadence, each repetition sounds like a forced restart. Close with a half cadence, a pedal or a plagal cadence
- **Prioritize texture over melody in sustained gameplay** — a strong melody is for moments, not for background

## Layered composition

The native form. Write the same material in strata that can enter and leave without breaking anything:

| Layer | Role | Enters when |
|---|---|---|
| **Bed** | Sustained pad/texture, defines the key | Always |
| **Pulse** | Minimal rhythmic pulse | There is activity |
| **Harmony** | Explicit harmonic motion | Tension rises |
| **Melody** | Identifiable theme | Narrative moment |
| **Intensity** | Dense percussion, brass, dissonance | Combat/climax |

**Composition rule:** each layer has to sound good alone and in any combination with the ones below. You achieve that by writing them all against the same harmony and the same grid, and by not letting any of them depend on another to make sense.

## Themes and transformation

One theme, N game states. The most cost-effective transformations:

| Transformation | State it represents |
|---|---|
| Augmentation + density reduction | Memory, calm, safe zone |
| Minor mode / ♭6 | Threat, loss |
| Fragmentation + tempo increase | Chase, urgency |
| Reorchestration to a solo | Intimacy, a character's death |
| Over a dissonant pedal | Corruption, something is wrong |
| Changed meter | Strangeness, another plane |

This gives coherence to an entire soundtrack with a single musical idea, and makes the player "recognize" it without knowing why.

## Modes by mood

| Desired mood | Device |
|---|---|
| Adventure, optimism | Mixolydian, ♭7; open fourths and fifths |
| Melancholy without tragedy | Dorian, ♮6 |
| Wonder, scale | Lydian, ♯4; major chords moving by thirds |
| Threat | Phrygian, ♭2; tritone; cluster |
| Mystery | Whole-tone scale; quartal harmony; ambiguous center |
| Sustained tension | Pedal + dissonance that does not resolve |
| Emptiness, desolation | Open intervals, silence, a single timbre |

## Generative approaches

When the content has to exceed what can be written by hand:

- **Markov chains** — stochastic melody trained on your own material. Preserves the idiom; does not generate structure
- **L-systems / recursive grammars** — generate hierarchical *structure* (phrases, sections) by rule rewriting. The natural complement to Markov, which has no form
- **Harmony constraints** — a validation layer: the generator proposes, the voice leading and function rules filter
- **Stochastic layer selection** — the variation comes from which combination plays, not from generating new notes. Much cheaper and more controllable

**Practical recommendation:** stochastic layer selection covers 90% of the real need for variation in a game, with none of the quality risks of note generation. Go to Markov/L-systems only when layer variation is no longer enough.

## Anti-patterns

- **30-second loop with a strong melody** — the fastest way to get the player to turn the music down
- **Authentic cadence at the end of the loop** — every pass sounds like a mistake
- **Melody at 500 Hz-2 kHz during dialogue** — it fights with VO and loses
- **All layers dependent on each other** — remove one and the rest sounds incomplete
- **One theme per zone with no relation between them** — the soundtrack does not accumulate meaning
- **Composing to a fixed duration** — gameplay does not last as long as your piece
- **Sub saturated with music** — it eats the space for impacts
