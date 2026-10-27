# Voice Pipeline — Anti-patterns

## Recording before defining the naming

The most expensive mistake in the pipeline. Renaming 4,000 files × 12 languages, and updating the script, subtitles and middleware references, is not a task: it is a project. Naming gets frozen first.

## Language in the file name

`vo_kira_line_003_es.wav` forces name-resolution logic at runtime. The language goes in the path or in the bank; the file name is identical across all locales.

## Renumbering IDs

A line gets cut and the following ones are renumbered "to keep it tidy". The link with subtitles, translations and already recorded assets breaks. Gaps in the numbering are free.

## Script without context

The actor records loose lines in alphabetical order without knowing who they are talking to or what just happened. The material is unusable and they have to be called back. Per-line context is mandatory.

## Recording in ID order

The order is by character and by scene. And the screams at the end of the session: they wear the voice out and ruin everything that comes after.

## Casting by timbre alone

The character who screams in act three needs an actor with the range to scream without losing their voice. And if two characters sound alike, the player who does not see who is speaking gets confused.

## An actor who cannot be called back

There are always pickups. An actor with no future availability is a production risk, not a contract detail.

## Budgeting gaps against English

German and Spanish grow 20-35%. A line that fits exactly in English does not fit in German, and if there is a fixed animation, there is no fix. Budget against the longest language in the target.

## Fallback to silence

The asset is missing in one language and nothing plays. The fallback is the base language, always.

## Subtitle without the same ID

If the subtitle does not share the key with the audio, keeping the two in sync becomes manual. And a line without a subtitle is an accessibility bug, not a to-do.

## Barks with few variants

A repeated bark is the first thing the player notices. At least 5-8 per intent.

## Barks without cooldown

Three enemies shout the same phrase simultaneously and it sounds like a bug. Global cooldown per character and per type.

## Barks on the dialogue bus

Every combat bark ducks the music. Separate bus.

## Barks that do not get interrupted

The character dies and their scream keeps playing from a corpse.

## Batch without verification

Processing thousands of files without a step that validates sample rate, channels and duration lets non-conforming files be discovered at integration, when it is already too late.

## Lipsync with mismatched text

The actor improvised and the reference text went stale. The sync breaks and nobody knows why. The recorded text and the reference text are the same, or the lipsync lies.

## Localization without regenerating lipsync

Either it is regenerated per language, or the mismatch is explicitly accepted as a decision. What cannot happen is discovering it at certification.
