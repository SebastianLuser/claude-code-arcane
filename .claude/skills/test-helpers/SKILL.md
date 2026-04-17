---
name: test-helpers
description: "Generate engine-specific test helper libraries for the project's test suite. Reads existing test patterns and produces tests/helpers/ with assertion utilities, factory functions, and mock objects tailored to the project's systems. Reduces boilerplate in new test files."
argument-hint: "[system-name | all | scaffold]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

# Test Helpers

Writing test cases is faster and more consistent when common setup, teardown,
and assertion patterns are abstracted into helpers. This skill generates a
`tests/helpers/` library tailored to the project's actual engine, language,
and systems — so every developer writes less boilerplate and more assertions.

**Output:** `tests/helpers/` directory with engine-specific helper files

**When to run:**
- After `/test-setup` scaffolds the framework (first time)
- When multiple test files repeat the same setup boilerplate
- When starting to write tests for a new system

---

## 1. Parse Arguments

**Modes:**
- `/test-helpers [system-name]` — generate helpers for a specific system
  (e.g., `/test-helpers combat`)
- `/test-helpers all` — generate helpers for all systems with test files
- `/test-helpers scaffold` — generate only the base helper library (no
  system-specific helpers); use this on first run
- No argument — run `scaffold` if no helpers exist, else `all`

---

## 2. Detect Engine and Language

Read `.claude/docs/technical-preferences.md` and extract:
- `Engine:` value
- `Language:` value
- `Framework:` from the Testing section

If engine is not configured: "Engine not configured. Run `/setup-engine` first."

---

## 3. Load Existing Test Patterns

Scan the test directory for patterns already in use:

```
Glob pattern="tests/**/*_test.*" (all test files)
```

For a representative sample (up to 5 files), read the test files and extract:
- Setup patterns (how `before_each` / `setUp` / fixtures are written)
- Common assertion patterns (what is being asserted most often)
- Object creation patterns (how game objects or scenes are instantiated in tests)
- Mock/stub patterns (how dependencies are replaced)

This ensures generated helpers match the project's existing style, not a
generic template.

Also read:
- `design/gdd/systems-index.md` — to know which systems exist
- In-scope GDD(s) — to understand what data types and values need testing
- `docs/architecture/tr-registry.yaml` — to map requirements to tested systems

---

## 4. Generate Engine-Specific Helpers

### Unity (NUnit / C#)

**Base helper** (`tests/helpers/GameAssertions.cs`):

```csharp
using NUnit.Framework;
using UnityEngine;

/// <summary>
/// Game-specific assertion utilities for [Project Name] tests.
/// Extends NUnit's Assert with domain-specific helpers.
/// </summary>
public static class GameAssertions
{
    /// <summary>
    /// Assert a value is within an inclusive range [min, max].
    /// Use for any formula output defined in GDD Formulas sections.
    /// </summary>
    public static void AssertInRange(float value, float min, float max, string label = "value")
    {
        Assert.That(value, Is.InRange(min, max),
            $"{label} ({value:F2}) is outside expected range [{min:F2}, {max:F2}]");
    }

    /// <summary>Assert a UnityEvent or C# event was raised during an action.</summary>
    public static void AssertEventRaised(ref bool wasCalled, System.Action action, string eventName)
    {
        wasCalled = false;
        action();
        Assert.IsTrue(wasCalled, $"Expected event '{eventName}' to be raised, but it was not.");
    }

    /// <summary>Assert a component exists on a GameObject.</summary>
    public static void AssertHasComponent<T>(GameObject obj) where T : Component
    {
        var component = obj.GetComponent<T>();
        Assert.IsNotNull(component,
            $"Expected GameObject '{obj.name}' to have component {typeof(T).Name}.");
    }
}
```

**Factory helper** (`tests/helpers/GameFactory.cs`):

```csharp
using UnityEngine;

/// <summary>
/// Factory methods for creating minimal test objects without loading scenes.
/// </summary>
public static class GameFactory
{
    /// <summary>Create a minimal GameObject with a named component for testing.</summary>
    public static GameObject MakeGameObject(string name = "TestObject")
    {
        var go = new GameObject(name);
        return go;
    }

    /// <summary>
    /// Create a ScriptableObject of type T for data-driven tests.
    /// Dispose with Object.DestroyImmediate after test.
    /// </summary>
    public static T MakeScriptableObject<T>() where T : ScriptableObject
    {
        return ScriptableObject.CreateInstance<T>();
    }
}
```

---

### Unreal Engine (C++)

**Base helper** (`tests/helpers/GameTestHelpers.h`):

```cpp
#pragma once

#include "CoreMinimal.h"
#include "Misc/AutomationTest.h"

/**
 * Game-specific assertion macros and helpers for [Project Name] automation tests.
 * Include in any test file that needs domain-specific assertions.
 *
 * Usage:
 *   GAME_TEST_ASSERT_IN_RANGE(TestName, DamageValue, 10.0f, 50.0f, TEXT("Damage"));
 */

// Assert a float value is within inclusive range [Min, Max]
#define GAME_TEST_ASSERT_IN_RANGE(TestName, Value, Min, Max, Label) \
    TestTrue( \
        FString::Printf(TEXT("%s (%.2f) in range [%.2f, %.2f]"), Label, Value, Min, Max), \
        (Value) >= (Min) && (Value) <= (Max) \
    )

// Assert a UObject pointer is valid (not null, not garbage collected)
#define GAME_TEST_ASSERT_VALID(TestName, Ptr, Label) \
    TestTrue( \
        FString::Printf(TEXT("%s is valid"), Label), \
        IsValid(Ptr) \
    )

// Assert an Actor is in the world (spawned successfully)
#define GAME_TEST_ASSERT_SPAWNED(TestName, ActorPtr, ClassName) \
    TestNotNull( \
        FString::Printf(TEXT("Spawned actor of class %s"), TEXT(#ClassName)), \
        ActorPtr \
    )

/**
 * Helper to create a minimal test world.
 * Remember to call World->DestroyWorld(false) in teardown.
 */
namespace GameTestHelpers
{
    inline UWorld* CreateTestWorld(const FString& WorldName = TEXT("TestWorld"))
    {
        UWorld* World = UWorld::CreateWorld(EWorldType::Game, false);
        FWorldContext& WorldContext = GEngine->CreateNewWorldContext(EWorldType::Game);
        WorldContext.SetCurrentWorld(World);
        return World;
    }
}
```

---

## 5. Generate System-Specific Helpers

For `[system-name]` or `all` modes, generate a helper per system:

Read the system's GDD to extract:
- Data types (entity types, component names)
- Formula variables and their bounds
- Common test scenarios mentioned in Edge Cases

Generate `tests/helpers/[system]_factory.[ext]` with factory functions
specific to that system's objects.

Example pattern for a `combat` system (Unity/C#):

```csharp
// Factory and assertion helpers for Combat system tests.
// Generated by /test-helpers combat on [date].
// Based on: design/gdd/combat.md

using UnityEngine;

public static class CombatTestFactory
{
    public const float DAMAGE_MIN = 0f;
    public const float DAMAGE_MAX = 999f;  // From GDD: damage formula upper bound

    /// <summary>Create a minimal attacker object for damage formula tests.</summary>
    public static GameObject MakeAttacker(float attack = 10f, float critChance = 0f)
    {
        var go = new GameObject("Attacker");
        var stats = go.AddComponent<TestStats>();
        stats.Attack = attack;
        stats.CritChance = critChance;
        return go;
    }

    /// <summary>Create a minimal target object for damage receive tests.</summary>
    public static GameObject MakeTarget(float defense = 0f, float health = 100f)
    {
        var go = new GameObject("Target");
        var stats = go.AddComponent<TestStats>();
        stats.Defense = defense;
        stats.Health = stats.MaxHealth = health;
        return go;
    }

    /// <summary>Assert damage output is within GDD-specified bounds.</summary>
    public static void AssertDamageInBounds(float damage)
        => GameAssertions.AssertInRange(damage, DAMAGE_MIN, DAMAGE_MAX, "damage");
}
```

---

## 6. Write Output

Present a summary of what will be created:

```
## Test Helpers to Create

Base helpers (engine: [engine]):
- tests/helpers/game_assertions.[ext]
- tests/helpers/game_factory.[ext]
[engine-specific extras]

System helpers ([mode]):
- tests/helpers/[system]_factory.[ext]  ← from [system] GDD
```

Ask: "May I write these helper files to `tests/helpers/`?"

**Never overwrite existing files.** If a file already exists, report:
"Skipping `[path]` — already exists. Remove the file manually if you want it
regenerated."

After writing: Verdict: **COMPLETE** — helper files created.

"Helper files created. To use them in a test:
- Unity: Add `using` directive or reference the test assembly
- Unreal: `#include \"tests/helpers/GameTestHelpers.h\"`"

---

## Collaborative Protocol

- **Never overwrite existing helpers** — they may contain hand-written
  customisations. Only generate new files that don't exist yet
- **Generated code is a starting point** — the generated factory functions use
  metadata patterns for simplicity; adapt to the actual class structure once
  the code exists
- **Helpers should reflect the GDD** — bounds and constants in helpers should
  trace to GDD Formulas sections, not invented values
- **Ask before writing** — always confirm before creating files in `tests/`

## Next Steps

- Run `/test-setup` if the test framework has not been scaffolded yet.
- Use `/dev-story` to implement stories — helpers reduce boilerplate in new test files.
- Run `/skill-test` to validate other skills that may need helper coverage.
