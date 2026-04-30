# Workflow & Navigation Decisions

## Workflow Decision

| Criteria | Expo Managed | Expo Dev Client | Bare RN |
|----------|-------------|-----------------|---------|
| Custom native modules | No | Yes | Yes |
| OTA updates | Yes | Yes | Manual |
| Cloud builds (no Xcode) | Yes | Yes | No |
| Iteration speed | Fastest | Fast | Slow |

**Default:** Expo managed. Dev-client when a dep needs custom native code. Bare RN only for deep native requirements from day one.

## Navigation Decision

| Criteria | Expo Router | React Navigation |
|----------|-------------|------------------|
| File-based + typed routes | Yes | No |
| Deep linking | Automatic | Manual |
| Custom navigators | Limited | Full control |

**Default:** Expo Router. React Navigation only for deeply custom navigator behavior.
