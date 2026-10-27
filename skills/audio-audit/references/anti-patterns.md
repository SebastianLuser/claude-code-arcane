# Audio Audit — Anti-patterns

## Measuring in the editor

The editor fires events in order, one at a time, with no background noise. The player produces combinations nobody planned. Editor measurements predict nothing.

## Measuring on the highest platform

The budget fits comfortably on PC and blows up on the handheld. The audit is done against the target's floor.

## Measuring the loudness of a single asset

LUFS targets apply to the full program in representative gameplay. Measuring a `.wav` says nothing about compliance.

## A measurement session that is too short

Thirty seconds of calm exploration gives a LUFS value that does not represent the game. The measurement has to cover exploration, combat and dialogue.

## Trusting a memorized target

Platform recommendations get revised. Confirm the current one before certification.

## Measuring sample peak instead of true peak

A mix that reaches 0 dBFS in PCM can produce peaks above that when encoded to a lossy format. The −1 dBTP exists precisely for that reason.

## Not looking for leaks

A registered game object counter that grows for two hours and never drops is the most frequent finding, and it only shows up in long sessions. A five-minute test will not find it.

## Accepting a voice peak at the limit

If the peak hits the configured limit, any slightly worse situation starts dropping sounds. And if what gets dropped is feedback for the player's action, the game feels broken without any visible error.

## Ignoring what gets dropped

The number of drops alone says nothing. What matters is the priority of what was dropped: losing a distant ambience is fine, losing the player's gunshot is not.

## Stereo 3D source

The quietest finding: the middleware collapses it or treats it differently, and spatial localization degrades without any error showing up. Verify channels per usage category.

## Mixed sample rates

44.1 and 48 kHz in the same project force runtime resampling, which costs CPU and can introduce artifacts. One sample rate per project.

## Leading silence in the asset

It delays the attack and is perceived as input lag, even though the code responds instantly. It is detected automatically and almost nobody looks for it.

## A finding without a number

"The audio sounds saturated" is not a finding. What was measured, measured value, expected value, where. Without that, nobody can fix it or verify that it was fixed.

## Auditing thousands of assets by hand

Sample rate, channel, naming and duration conformance is mechanical: it gets automated. Manually inspecting 4,000 files guarantees something slips through.

## Failing when an external tool is missing

If the deep check needs a tool that is not installed, report `[SKIP]` and continue. Aborting the whole audit over an optional dependency leaves the user without the checks that could have run.

## Leaving the platform checklist for last

Background behavior and the iOS silent switch are concrete causes of rejection. Discovering them at certification costs a release.
