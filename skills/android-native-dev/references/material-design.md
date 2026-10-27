# Material Design 3 Quick Reference

### M3 Core Principles

| Principle | Description |
|-----------|-------------|
| **Personal** | Dynamic color based on user preferences and wallpaper |
| **Adaptive** | Responsive across all screen sizes and form factors |
| **Expressive** | Bold colors and typography with personality |
| **Accessible** | Inclusive design for all users |

### M3 Expressive (Latest)

The latest evolution adds emotion-driven UX through:
- Vibrant, dynamic colors
- Intuitive motion physics
- Adaptive components
- Flexible typography
- Contrasting shapes (35 new shape options)

## App Style Selection

**Critical Decision**: Match visual style to app category and target audience.

| App Category | Visual Style | Key Characteristics |
|--------------|--------------|---------------------|
| Utility/Tool | Minimalist | Clean, efficient, neutral colors |
| Finance/Banking | Professional Trust | Conservative colors, security-focused |
| Health/Wellness | Calm & Natural | Soft colors, organic shapes |
| Kids (3-5) | Playful Simple | Bright colors, large targets (56dp+) |
| Kids (6-12) | Fun & Engaging | Vibrant, gamified feedback |
| Social/Entertainment | Expressive | Brand-driven, gesture-rich |
| Productivity | Clean & Focused | Minimal, high contrast |
| E-commerce | Conversion-focused | Clear CTAs, scannable |

See [Design Style Guide](design-style-guide.md) for detailed style profiles.

## Quick Reference: Key Specifications

### Color Contrast Requirements

| Element | Minimum Ratio |
|---------|---------------|
| Body text | **4.5:1** |
| Large text (18sp+) | **3:1** |
| UI components | **3:1** |

### Touch Targets

| Type | Size |
|------|------|
| Minimum | 48 × 48dp |
| Recommended (primary actions) | 56 × 56dp |
| Kids apps | 56dp+ |
| Spacing between targets | 8dp minimum |

### 8dp Grid System

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4dp | Icon padding |
| sm | 8dp | Tight spacing |
| md | 16dp | Default padding |
| lg | 24dp | Section spacing |
| xl | 32dp | Large gaps |
| xxl | 48dp | Screen margins |

### Typography Scale (Summary)

| Category | Sizes |
|----------|-------|
| Display | 57sp, 45sp, 36sp |
| Headline | 32sp, 28sp, 24sp |
| Title | 22sp, 16sp, 14sp |
| Body | 16sp, 14sp, 12sp |
| Label | 14sp, 12sp, 11sp |

### Animation Duration

| Type | Duration |
|------|----------|
| Micro (ripples) | 50-100ms |
| Short (simple) | 100-200ms |
| Medium (expand/collapse) | 200-300ms |
| Long (complex) | 300-500ms |

### Component Dimensions

| Component | Height | Min Width |
|-----------|--------|-----------|
| Button | 40dp | 64dp |
| FAB | 56dp | 56dp |
| Text Field | 56dp | 280dp |
| App Bar | 64dp | - |
| Bottom Nav | 80dp | - |

## Anti-Patterns (Must Avoid)

### UI Anti-Patterns
- More than 5 bottom navigation items
- Multiple FABs on same screen
- Touch targets smaller than 48dp
- Inconsistent spacing (non-8dp multiples)
- Missing dark theme support
- Text on colored backgrounds without contrast check

### Performance Anti-Patterns
- Startup time > 2 seconds without progress indicator
- Frame rate < 60 FPS (> 16ms per frame)
- Crash rate > 1.09% (Google Play threshold)
- ANR rate > 0.47% (Google Play threshold)

### Accessibility Anti-Patterns
- Missing contentDescription on interactive elements
- Element type in labels (e.g., "Save button" instead of "Save")
- Complex gestures in kids apps
- Text-only buttons for non-readers

## Review Checklist

- [ ] 8dp spacing grid compliance
- [ ] 48dp minimum touch targets
- [ ] Proper typography scale usage
- [ ] Color contrast compliance (4.5:1+ for text)
- [ ] Dark theme support
- [ ] contentDescription on all interactive elements
- [ ] Startup < 2 seconds or shows progress
- [ ] Visual style matches app category
