# UI Sound Design — Anti-patterns

## UI sounds at gameplay level

A click at −3 dB competes with the game action and becomes exhausting within minutes. UI sits between −18 and −24 dB. It is the most frequent mistake and the easiest one to fix.

## Everything at the same level

If the hover and the transaction error sound equally important, there is no hierarchy and the user stops paying attention to both. Level and duration proportional to the event's importance.

## Everything ducks

If every menu navigation lowers the music, the music disappears. Only the critical level ducks.

## No cooldown on navigation

Scrolling through a menu quickly with the stick fires the same tick twenty times in 300 ms. It sounds like a glitch. A minimum cooldown on every navigation event.

## Sustained tones at 2-6 kHz

It is the ear's most sensitive band and the one that fatigues most. A sustained tone there tires the user within a session. Short transients.

## Ignoring the audio session on mobile

A call comes in, the app loses its audio and never gets it back. Or the game plays with the silent switch on. Both are store rejections. Handle interruptions and route changes explicitly.

## Forcing volume above the system's

Normalizing upward or imposing a volume floor ignores an explicit decision by the user. Never.

## Success and error that differ only by timbre

With high-frequency hearing loss, on a bad speaker or at low volume, the two sound the same. The difference has to be in the contour: rising for success, falling for error.

## Audio as the only channel for critical information

A user with hearing loss, with the sound off or in a noisy place loses the information. Always paired with a visual signal.

## Haptic and audio out of sync

Above ~30 ms they are perceived as two events and it feels broken. And if the haptic is turned off, the event cannot be left without any feedback.

## Duplicating information between audio and haptic

If the haptic already communicates intensity, raising the audio to "reinforce" it only adds annoyance.

## Relying on the lows on small devices

A UI sound whose weight lives at 80 Hz does not exist on a phone speaker. With haptics, the lows are the haptic's job; without haptics, the sound has to read in the mids.

## A set without a toggle

Repetitive navigation sounds must be able to be turned off, and turning them off must not silence the critical ones. Volume controls separate from music and SFX.

## Designing the set without testing real navigation

A sound approved click by click becomes unbearable when the user goes through six screens in four seconds. Test with real flows, at real speed.
