# Test Dependencies

Before adding test dependencies, inspect the project's existing versions to avoid conflicts:

1. Check `gradle/libs.versions.toml` — if present, add test deps using the project's version catalog style
2. Check existing `build.gradle.kts` for already-pinned dependency versions
3. Match version families using the table below

**Version Alignment Rules**:

| Test Dependency                              | Must Align With                                  | How to Check                                                          |
|----------------------------------------------|--------------------------------------------------|-----------------------------------------------------------------------|
| `kotlinx-coroutines-test`                    | Project's `kotlinx-coroutines-core` version      | Search for `kotlinx-coroutines` in build files or version catalog     |
| `compose-ui-test-junit4`                     | Project's Compose BOM or `compose-compiler`      | Search for `compose-bom` or `compose.compiler` in build files         |
| `espresso-*`                                 | All Espresso artifacts must use the same version  | Search for `espresso` in build files                                  |
| `androidx.test:runner`, `rules`, `ext:junit` | Should use compatible AndroidX Test versions      | Search for `androidx.test` in build files                             |
| `mockk`                                      | Must support the project's Kotlin version         | Check `kotlin` version in root `build.gradle.kts` or version catalog |

**Dependencies Reference** — add only the groups you need:

```kotlin
dependencies {
    // --- Local unit tests (src/test/) ---
    testImplementation("junit:junit:<version>")                          // 4.13.2+
    testImplementation("org.robolectric:robolectric:<version>")          // 4.16.1+
    testImplementation("io.mockk:mockk:<version>")                      // match Kotlin version
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:<version>")  // match coroutines-core
    testImplementation("androidx.arch.core:core-testing:<version>")      // InstantTaskExecutorRule for LiveData
    testImplementation("app.cash.turbine:turbine:<version>")             // Flow/StateFlow testing

    // --- Instrumentation tests (src/androidTest/) ---
    androidTestImplementation("androidx.test.ext:junit:<version>")
    androidTestImplementation("androidx.test:runner:<version>")
    androidTestImplementation("androidx.test:rules:<version>")
    androidTestImplementation("androidx.test.espresso:espresso-core:<version>")
    androidTestImplementation("androidx.test.espresso:espresso-contrib:<version>")   // RecyclerView, Drawer
    androidTestImplementation("androidx.test.espresso:espresso-intents:<version>")   // Intent verification
    androidTestImplementation("androidx.test.espresso:espresso-idling-resource:<version>")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:<version>")

    // --- Compose UI tests (only if project uses Compose) ---
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")      // version from Compose BOM
    debugImplementation("androidx.compose.ui:ui-test-manifest")          // required for createComposeRule
}
```

> **Note**: If the project uses a Compose BOM, `ui-test-junit4` and `ui-test-manifest` don't need explicit versions — the BOM manages them.

Enable Robolectric resource support in the `android` block:

```kotlin
android {
    testOptions {
        unitTests.isIncludeAndroidResources = true  // required for Robolectric
    }
}
```
