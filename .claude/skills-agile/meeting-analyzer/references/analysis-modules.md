# Analysis Modules — Detailed Specifications

## Module: Speaking Dynamics

Calculate per-speaker:
- **Word count & percentage** of total meeting words
- **Turn count** — how many times each person spoke
- **Average turn length** — words per uninterrupted speaking turn
- **Longest monologue** — flag turns exceeding 60 seconds or 200 words
- **Interruption detection** — a turn that starts within 2 seconds of the previous speaker's last timestamp, or mid-sentence breaks

Produce a per-meeting summary and a cross-meeting average if multiple transcripts exist.

Red flags to surface:
- User speaks > 60% in a 1:many meeting (dominating)
- User speaks < 15% in a meeting they're facilitating (disengaged or over-delegating)
- One participant never speaks (excluded voice)
- Interruption ratio > 2:1 (user interrupts others twice as often as they're interrupted)

## Module: Conflict & Directness

Scan the user's speech for hedging and avoidance markers:

**Hedging language** (score per-instance, aggregate per meeting):
- Qualifiers: "maybe", "kind of", "sort of", "I guess", "potentially", "arguably"
- Permission-seeking: "if that's okay", "would it be alright if", "I don't know if this is right but"
- Deflection: "whatever you think", "up to you", "I'm flexible"
- Softeners before disagreement: "I don't want to push back but", "this might be a dumb question"

**Conflict avoidance patterns** (flag with confidence level):
- Topic changes after tension (speaker A raises problem -> user pivots to logistics)
- Agreement-without-commitment: "yeah totally" followed by no action
- Reframing others' concerns as smaller than stated
- Absent feedback in 1:1s where performance topics would be expected

For each flagged instance, extract:
- The full quote (with surrounding context — 2 turns before and after)
- A severity tag: low (single hedge word), medium (pattern in one exchange), high (clearly avoided a necessary conversation)
- A rewrite suggestion: what a more direct version would sound like

## Module: Filler Words & Verbal Habits

Count occurrences of: "um", "uh", "like" (non-comparative), "you know", "actually", "basically", "literally", "right?" (tag question), "so yeah", "I mean"

Report:
- Total count per meeting
- Rate per 100 words spoken (normalizes across meeting lengths)
- Breakdown by filler type
- Contextual spikes — do fillers increase in specific situations?

Only flag this as an issue if the rate exceeds ~3 per 100 words. Below that, it is normal speech.

## Module: Question Quality & Listening

Classify the user's questions:
- **Closed** (yes/no): "Did you finish the report?"
- **Leading** (answer embedded): "Don't you think we should ship sooner?"
- **Open genuine**: "What's blocking you on this?"
- **Clarifying** (references prior speaker): "When you said X, did you mean Y?"
- **Building** (extends another's idea): "That's interesting — what if we also Z?"

Good listening indicators:
- Clarifying and building questions (shows active processing)
- Paraphrasing: "So what I'm hearing is..."
- Referencing a point someone made earlier in the meeting
- Asking quieter participants for input

Poor listening indicators:
- Asking a question that was already answered
- Restating own point without acknowledging the response
- Responding to a question with an unrelated topic

## Module: Facilitation & Decision-Making

Only apply when the user is the meeting organizer or facilitator.

Evaluate:
- **Agenda adherence**: Did the meeting follow a structure or drift?
- **Time management**: How long did each topic take vs. expected?
- **Inclusion**: Did the facilitator actively draw in quiet participants?
- **Decision clarity**: Were decisions explicitly stated?
- **Action items**: Were they assigned with owners and deadlines, or left vague?
- **Parking lot discipline**: Were off-topic items acknowledged and deferred, or did they derail?

## Module: Sentiment & Energy

Track the emotional arc of the user's language across the meeting:
- **Positive markers**: enthusiastic agreement, encouragement, humor, praise
- **Negative markers**: frustration, dismissiveness, sarcasm, curt responses
- **Neutral/flat**: low-energy responses, monosyllabic answers

Flag energy drops — moments where the user's engagement visibly decreases.
