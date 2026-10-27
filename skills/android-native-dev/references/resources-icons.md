# Resources & Icons

## 5.1 App Icon Requirements

Must provide multi-resolution icons:

| Directory | Size | Purpose |
|-----------|------|---------|
| mipmap-mdpi | 48x48 | Baseline |
| mipmap-hdpi | 72x72 | 1.5x |
| mipmap-xhdpi | 96x96 | 2x |
| mipmap-xxhdpi | 144x144 | 3x |
| mipmap-xxxhdpi | 192x192 | 4x |

Recommended: Use Adaptive Icon (Android 8+):

```xml
<!-- res/mipmap-anydpi-v26/ic_launcher.xml -->
<adaptive-icon>
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

## 5.2 Resource Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Layout | layout_ | `layout_main.xml` |
| Image | ic_, img_, bg_ | `ic_user.png` |
| Color | color_ | `color_primary` |
| String | - | `app_name`, `btn_submit` |

## 5.3 Avoid Android Reserved Names (Important)

Variable names, resource IDs, colors, icons, and XML elements **must not** use Android reserved words or system resource names. Using reserved names causes build errors or resource conflicts.

**Common Reserved Names to Avoid**:

| Category | Reserved Names (Do NOT Use) |
|----------|----------------------------|
| Colors | `background`, `foreground`, `transparent`, `white`, `black` |
| Icons/Drawables | `icon`, `logo`, `image`, `drawable` |
| Views | `view`, `text`, `button`, `layout`, `container` |
| Attributes | `id`, `name`, `type`, `style`, `theme`, `color` |
| System | `app`, `android`, `content`, `data`, `action` |

**Examples**:

```xml
<!-- ❌ Wrong: Using reserved names -->
<color name="background">#FFFFFF</color>
<color name="icon">#000000</color>

<!-- ✅ Correct: Add prefix or specific naming -->
<color name="app_background">#FFFFFF</color>
<color name="icon_primary">#000000</color>
```

```kotlin
// ❌ Wrong: Variable names conflict with system
val icon = R.drawable.my_icon
val background = Color.White

// ✅ Correct: Use descriptive names
val appIcon = R.drawable.my_icon
val screenBackground = Color.White
```

```xml
<!-- ❌ Wrong: Drawable name conflicts -->
<ImageView android:src="@drawable/icon" />

<!-- ✅ Correct: Add prefix -->
<ImageView android:src="@drawable/ic_home" />
```
