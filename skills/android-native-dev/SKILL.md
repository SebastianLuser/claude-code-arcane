---
name: android-native-dev
description: "Android native development with Kotlin + Jetpack Compose: Material Design 3, project config, accessibility, build troubleshooting."
category: "mobile"
argument-hint: "[request]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

## 1. Project Scenario Assessment

Before starting development, assess the current project state:

| Scenario | Characteristics | Approach |
|----------|-----------------|----------|
| **Empty Directory** | No files present | Full initialization required, including Gradle Wrapper |
| **Has Gradle Wrapper** | `gradlew` and `gradle/wrapper/` exist | Use `./gradlew` directly for builds |
| **Android Studio Project** | Complete project structure, may lack wrapper | Check wrapper, run `gradle wrapper` if needed |
| **Incomplete Project** | Partial files present | Check missing files, complete configuration |

**Key Principles**:
- Before writing business logic, ensure `./gradlew assembleDebug` succeeds
- If `gradle.properties` is missing, create it first and configure AndroidX

### 1.1 Required Files Checklist

```
MyApp/
├── gradle.properties          # Configure AndroidX and other settings
├── settings.gradle.kts
├── build.gradle.kts           # Root level
├── gradle/wrapper/
│   └── gradle-wrapper.properties
├── app/
│   ├── build.gradle.kts       # Module level
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/example/myapp/
│       │   └── MainActivity.kt
│       └── res/
│           ├── values/
│           │   ├── strings.xml
│           │   ├── colors.xml
│           │   └── themes.xml
│           └── mipmap-*/       # App icons
```

---

## 2. Project Configuration

### 2.1 gradle.properties

```properties
# Required configuration
android.useAndroidX=true
android.enableJetifier=true

# Build optimization
org.gradle.parallel=true
kotlin.code.style=official

# JVM memory settings (adjust based on project size)
# Small projects: 2048m, Medium: 4096m, Large: 8192m+
# org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
```

> **Note**: If you encounter `OutOfMemoryError` during build, increase `-Xmx` value. Large projects with many dependencies may require 8GB or more.

### 2.2 Dependency Declaration Standards

```kotlin
dependencies {
    // Use BOM to manage Compose versions
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    
    // Activity & ViewModel
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
}
```

### 2.3 Build Variants & Product Flavors

Flavor dimensions, per-variant config and the Gradle commands to build or install one variant: [Build Variants](references/build-variants.md).

---

## 3. Kotlin Development Standards

### 3.1 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Class/Interface | PascalCase | `UserRepository`, `MainActivity` |
| Function/Variable | camelCase | `getUserName()`, `isLoading` |
| Constant | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Package | lowercase | `com.example.myapp` |
| Composable | PascalCase | `@Composable fun UserCard()` |

### 3.2 Code Standards (Important)

**Null Safety**:
```kotlin
// ❌ Avoid: Non-null assertion !! (may crash)
val name = user!!.name

// ✅ Recommended: Safe call + default value
val name = user?.name ?: "Unknown"

// ✅ Recommended: let handling
user?.let { processUser(it) }
```

**Exception Handling**:
```kotlin
// ❌ Avoid: Random try-catch in business layer swallowing exceptions
fun loadData() {
    try {
        val data = api.fetch()
    } catch (e: Exception) {
        // Swallowing exception, hard to debug
    }
}

// ✅ Recommended: Let exceptions propagate, handle at appropriate layer
suspend fun loadData(): Result<Data> {
    return try {
        Result.success(api.fetch())
    } catch (e: Exception) {
        Result.failure(e)  // Wrap and return, let caller decide handling
    }
}

// ✅ Recommended: Unified handling in ViewModel
viewModelScope.launch {
    runCatching { repository.loadData() }
        .onSuccess { _uiState.value = UiState.Success(it) }
        .onFailure { _uiState.value = UiState.Error(it.message) }
}
```

### 3.3 Threading & Coroutines (Critical)

**Thread Selection Principles**:

| Operation Type | Thread | Description |
|----------------|--------|-------------|
| UI Updates | `Dispatchers.Main` | Update View, State, LiveData |
| Network Requests | `Dispatchers.IO` | HTTP calls, API requests |
| File I/O | `Dispatchers.IO` | Local storage, database operations |
| Compute Intensive | `Dispatchers.Default` | JSON parsing, sorting, encryption |

**Correct Usage**:
```kotlin
// In ViewModel
viewModelScope.launch {
    // Default Main thread, can update UI State
    _uiState.value = UiState.Loading
    
    // Switch to IO thread for network request
    val result = withContext(Dispatchers.IO) {
        repository.fetchData()
    }
    
    // Automatically returns to Main thread, update UI
    _uiState.value = UiState.Success(result)
}

// In Repository (suspend functions should be main-safe)
suspend fun fetchData(): Data = withContext(Dispatchers.IO) {
    api.getData()
}
```

**Common Mistakes**:
```kotlin
// ❌ Wrong: Updating UI on IO thread
viewModelScope.launch(Dispatchers.IO) {
    val data = api.fetch()
    _uiState.value = data  // Crash or warning!
}

// ❌ Wrong: Executing time-consuming operation on Main thread
viewModelScope.launch {
    val data = api.fetch()  // Blocking main thread! ANR
}

// ✅ Correct: Fetch on IO, update on Main
viewModelScope.launch {
    val data = withContext(Dispatchers.IO) { api.fetch() }
    _uiState.value = data
}
```

### 3.4 Visibility Rules

```kotlin
// Default is public, declare explicitly when needed
class UserRepository {           // public
    private val cache = mutableMapOf<String, User>()  // Visible only within class
    internal fun clearCache() {} // Visible only within module
}

// data class properties are public by default, be careful when used across modules
data class User(
    val id: String,       // public
    val name: String
)
```

### 3.5 Common Syntax Pitfalls

```kotlin
// ❌ Wrong: Accessing uninitialized lateinit
class MyViewModel : ViewModel() {
    lateinit var data: String
    fun process() = data.length  // May crash
}

// ✅ Correct: Use nullable or default value
class MyViewModel : ViewModel() {
    var data: String? = null
    fun process() = data?.length ?: 0
}

// ❌ Wrong: Using return in lambda
list.forEach { item ->
    if (item.isEmpty()) return  // Returns from outer function!
}

// ✅ Correct: Use return@forEach
list.forEach { item ->
    if (item.isEmpty()) return@forEach
}
```

### 3.6 Server Response Data Class Fields Must Be Nullable

```kotlin
// ❌ Wrong: Fields declared as non-null (server may not return them)
data class UserResponse(
    val id: String = "",
    val name: String = "",
    val avatar: String = ""
)

// ✅ Correct: All fields declared as nullable
data class UserResponse(
    @SerializedName("id")
    val id: String? = null,
    @SerializedName("name")
    val name: String? = null,
    @SerializedName("avatar")
    val avatar: String? = null
)
```

### 3.7 Lifecycle Resource Management

```kotlin
// ❌ Wrong: Only adding Observer, not removing
class MyView : View {
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        activity?.lifecycle?.addObserver(this)
    }
    // Memory leak!
}

// ✅ Correct: Paired add and remove
class MyView : View {
    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        activity?.lifecycle?.addObserver(this)
    }

    override fun onDetachedFromWindow() {
        activity?.lifecycle?.removeObserver(this)
        super.onDetachedFromWindow()
    }
}
```

### 3.8 Logging Level Usage

```kotlin
import android.util.Log

// Info: Key checkpoints in normal flow
Log.i(TAG, "loadData: started, userId = $userId")

// Warning: Abnormal but recoverable situations
Log.w(TAG, "loadData: cache miss, fallback to network")

// Error: Failure/error situations
Log.e(TAG, "loadData failed: ${error.message}")
```

| Level | Use Case |
|-------|----------|
| `i` (Info) | Normal flow, method entry, key parameters |
| `w` (Warning) | Recoverable exceptions, fallback handling, null returns |
| `e` (Error) | Request failures, caught exceptions, unrecoverable errors |

---

## 4. Jetpack Compose Standards

### 4.1 @Composable Context Rules

```kotlin
// ❌ Wrong: Calling Composable from non-Composable function
fun showError(message: String) {
    Text(message)  // Compile error!
}

// ✅ Correct: Mark as @Composable
@Composable
fun ErrorMessage(message: String) {
    Text(message)
}

// ❌ Wrong: Using suspend outside LaunchedEffect
@Composable
fun MyScreen() {
    val data = fetchData()  // Error!
}

// ✅ Correct: Use LaunchedEffect
@Composable
fun MyScreen() {
    var data by remember { mutableStateOf<Data?>(null) }
    LaunchedEffect(Unit) {
        data = fetchData()
    }
}
```

### 4.2 State Management

```kotlin
// Basic State
var count by remember { mutableStateOf(0) }

// Derived State (avoid redundant computation)
val isEven by remember { derivedStateOf { count % 2 == 0 } }

// Persist across recomposition (e.g., scroll position)
val scrollState = rememberScrollState()

// State in ViewModel
class MyViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
}
```

### 4.3 Common Compose Mistakes

```kotlin
// ❌ Wrong: Creating objects in Composable (created on every recomposition)
@Composable
fun MyScreen() {
    val viewModel = MyViewModel()  // Wrong!
}

// ✅ Correct: Use viewModel() or remember
@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    // ...
}
```

---

## 5. Resources & Icons

App icon requirements, resource naming and the Android reserved names that break the build: [Resources & Icons](references/resources-icons.md). Read it before adding an icon or naming a resource.

---

## 6. Build Error Diagnosis & Fixes

### 6.1 Common Error Quick Reference

| Error Keyword | Cause | Fix |
|---------------|-------|-----|
| `Unresolved reference` | Missing import or undefined | Check imports, verify dependencies |
| `Type mismatch` | Type incompatibility | Check parameter types, add conversion |
| `Cannot access` | Visibility issue | Check public/private/internal |
| `@Composable invocations` | Composable context error | Ensure caller is also @Composable |
| `Duplicate class` | Dependency conflict | Use `./gradlew dependencies` to investigate |
| `AAPT: error` | Resource file error | Check XML syntax and resource references |

### 6.2 Fix Best Practices

1. **Read the complete error message first**: Locate file and line number
2. **Check recent changes**: Problems usually in latest modifications
3. **Clean Build**: `./gradlew clean assembleDebug`
4. **Check dependency versions**: Version conflicts are common causes
5. **Refresh dependencies if needed**: Clear cache and rebuild

### 6.3 Debugging Commands

```bash
# Clean and build
./gradlew clean assembleDebug

# View dependency tree (investigate conflicts)
./gradlew :app:dependencies

# View detailed errors
./gradlew assembleDebug --stacktrace

# Refresh dependencies
./gradlew --refresh-dependencies
```

---

## 7. Material Design 3 Guidelines

Review Android UI files for compliance with Material Design 3 Guidelines and Android best practices.

M3 principles, style selection by app category, key specs (contrast, touch targets, 8dp grid, type scale, motion, component sizes), anti-patterns and the review checklist: [Material Design 3](references/material-design.md).

### Design References

| Topic | Reference |
|-------|-----------|
| Colors, Typography, Spacing, Shapes | [Visual Design](references/visual-design.md) |
| Animation & Transitions | [Motion System](references/motion-system.md) |
| Accessibility Guidelines | [Accessibility](references/accessibility.md) |
| Large Screens & Foldables | [Adaptive Screens](references/adaptive-screens.md) |
| Android Vitals & Performance | [Performance & Stability](references/performance-stability.md) |
| Privacy & Security | [Privacy & Security](references/privacy-security.md) |
| Audio, Video, Notifications | [Functional Requirements](references/functional-requirements.md) |
| App Style by Category | [Design Style Guide](references/design-style-guide.md) |

---

## 8. Testing

> **Note**: Only add test dependencies when the user explicitly asks for testing.

A well-tested Android app uses layered testing: fast local unit tests for logic, instrumentation tests for UI and integration, and Gradle Managed Devices to run emulators reproducibly on any machine — including CI.

### 8.1 Test Dependencies

Check the project's existing versions first, then add what the layer needs: [Test Dependencies](references/test-dependencies.md).

### 8.2 Testing by Layer

| Layer              | Location           | Runs On                 | Speed                | Use For                                          |
|--------------------|--------------------|-------------------------|----------------------|--------------------------------------------------|
| Unit (JUnit)       | `src/test/`        | JVM                     | ~ms                  | ViewModels, repos, mappers, validators           |
| Unit + Robolectric | `src/test/`        | JVM + simulated Android | ~100ms               | Code needing Context, resources, SharedPrefs     |
| Compose UI (local) | `src/test/`        | JVM + Robolectric       | ~100ms               | Composable rendering & interaction               |
| Espresso           | `src/androidTest/` | Device/Emulator         | ~seconds             | View-based UI flows, Intents, DB integration     |
| Compose UI (device)| `src/androidTest/` | Device/Emulator         | ~seconds             | Full Compose UI flows with real rendering        |
| UI Automator       | `src/androidTest/` | Device/Emulator         | ~seconds             | System dialogs, notifications, multi-app         |
| Managed Device     | `src/androidTest/` | Gradle-managed AVD      | ~minutes (first run) | CI, matrix testing across API levels             |

See [Testing](references/testing.md) for detailed examples, code patterns, and Gradle Managed Device configuration.

### 8.3 Testing Commands

```bash
# Local unit tests (fast, no emulator)
./gradlew test                          # all modules
./gradlew :app:testDebugUnitTest        # app module, debug variant

# Single test class
./gradlew :app:testDebugUnitTest --tests "com.example.myapp.CounterViewModelTest"

# Instrumentation tests (requires device or managed device)
./gradlew connectedDebugAndroidTest     # on connected device
./gradlew pixel6Api34DebugAndroidTest   # on managed device

# Both together
./gradlew test connectedDebugAndroidTest

# Test with coverage report (JaCoCo)
./gradlew testDebugUnitTest jacocoTestReport
```
