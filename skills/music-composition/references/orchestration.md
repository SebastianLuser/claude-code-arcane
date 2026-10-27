# Orchestration

## Ranges and character

Practical ranges (not virtuoso extremes). **Character changes by register** within the same instrument — it is what gets ignored the most.

| Instrument | Practical range | Low register | High register |
|---|---|---|---|
| Flute | C4 – C7 | Airy, weak, gets covered | Bright, piercing |
| Clarinet | D3 – C6 | Dark, warm, unique | Strident if forced |
| Oboe | B♭3 – G6 | Nasal, present | Tense |
| Bassoon | B♭1 – E5 | Somber, comic | Vulnerable, expressive |
| Horn | F2 – F5 | Noble, diffuse | Heroic, audible effort |
| Trumpet | E3 – C6 | Solid | Bright, cuts through any texture |
| Trombone | E2 – F4 | Deep, powerful | Cantabile |
| Violin | G3 – E7 | Warm (G string) | Bright; very high = tension |
| Viola | C3 – E6 | Husky, melancholic | Thin |
| Cello | C2 – C6 | Deep | The most expressive register in the orchestra |
| Double bass | E1 – G4 | Foundation | Rare, tense |
| Voice (soprano) | C4 – A5 | Weak | Powerful, audible effort |
| Voice (baritone) | A2 – F4 | Comfortable | Intense |

## Arrangement density

**The rule that solves 80% of the problems: fewer elements, better defined.**

| Level | Simultaneous elements | Use |
|---|---|---|
| Intimate | 1-2 | Moments of maximum attention |
| Chamber | 3-5 | Standard for sustained gameplay |
| Full | 6-10 | Climax |
| Tutti | everything | Once, and short |

In game music, the density level is the most efficient adaptive lever: add and remove layers without changing the material.

## Voicing and texture

- **Natural spacing** — wide intervals at the bottom, close at the top. It copies the harmonic series; it sounds clean automatically
- **Do not stack in the same register** — four instruments between C4 and C5 produce mud. Separate by octaves
- **Double with intent** — in unison for weight, at the octave for brightness, in 3rds/6ths for sweetness. Doubling everything is doubling nothing
- **Saturated mid register** — 500 Hz-2 kHz is where dialogue lives. In a game, the music should *leave that range relatively free* if there is simultaneous VO (see `/audio-mix`)

## Combinations that work

| Combination | Effect |
|---|---|
| Cello + horn (unison) | Warmth with weight |
| Low clarinet + viola | Ambiguous darkness |
| Flute + violin (octave) | Airy brightness |
| Pizzicato + harp/mallets | Pointillism, curiosity |
| Muted strings + soft choir | Distance, memory |
| Horns in open 5ths | Epic; a cliché if overused |
| Solo + silence | Maximum attention |

## Choral / vocal writing

- Comfortable range, not extreme: the sustained tessitura matters more than the highest note
- Strict voice leading: the inner voices move as little as possible
- Intelligible text calls for longer notes and the mid register
- Open vowels (a, o) for high and long notes; closed ones (i, u) sound tense up high

## Production-aware

If the material goes into a mix with SFX and dialogue on top:

- Leave room at 500 Hz-2 kHz when there may be VO
- The sub (20-60 Hz) is usually reserved for impacts — do not fill it with music
- High transients compete with UI feedback: if the arrangement has a lot of hi-hat/bright percussion, the UI gets lost
- Dense arrangements survive the platform's lossy compression poorly: the detail at 6-20 kHz is the first thing to go
