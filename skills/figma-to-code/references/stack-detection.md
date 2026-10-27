# Stack Detection Tables

## Framework Detection

| File | Stack |
|---------|-------|
| `package.json` with `next` | Next.js |
| `package.json` with `react` | React |
| `package.json` with `vue` | Vue |
| `package.json` with `svelte` | Svelte |
| `pubspec.yaml` | Flutter |
| `*.swift` + `Package.swift` | SwiftUI |
| `package.json` with `react-native` | React Native |

## UI Library Detection

| Indicator | Library |
|-----------|---------|
| `@shadcn/ui` or `components/ui/` | shadcn/ui |
| `@mui/material` | Material UI |
| `@chakra-ui` | Chakra UI |
| `tailwindcss` | Tailwind CSS |
| `styled-components` | Styled Components |

## Stack Adaptation

| If the project uses | Adapt to |
|--------------------|-----------|
| shadcn/ui | Use the project's `<Button>`, `<Card>`, `<Input>`, etc. |
| CSS Modules | Convert Tailwind to CSS Modules |
| Styled Components | Convert to styled() |
| Vue | Convert JSX to `<template>` + `<script setup>` |
| Svelte | Convert to `.svelte` components |
| Flutter | Convert to Widgets |
