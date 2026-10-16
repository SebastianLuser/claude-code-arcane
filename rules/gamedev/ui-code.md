---
paths:
  - "src/ui/**"
  - "Assets/**/Scripts/UI/**"
---

# UI Code Rules

- UI must NEVER own or directly modify game state — display only, use commands/events to request changes
- All UI text must go through the localization system — no hardcoded user-facing strings
- Support both keyboard/mouse AND gamepad input for all interactive elements
- All animations must be skippable and respect user motion/accessibility preferences
- UI sounds trigger through the audio event system, not directly
- UI must never block the game thread
- Scalable text and colorblind modes are mandatory, not optional
- Test all screens at minimum and maximum supported resolutions

## How to verify

- The project compiles with no new errors: the Unity console, or a batchmode compile (`Unity -batchmode -quit -projectPath . -logFile -`); for Unreal, see `unreal-code`.
- Run the EditMode and PlayMode tests that cover the change (`-runTests -testPlatform EditMode` or `PlayMode`).
- You cannot play the game. Name what needs a human playtest (game feel, timing, visuals, input) and list exactly what to try.
