# Stack Detection Tables

## Framework Detection

| Archivo | Stack |
|---------|-------|
| `package.json` con `next` | Next.js |
| `package.json` con `react` | React |
| `package.json` con `vue` | Vue |
| `package.json` con `svelte` | Svelte |
| `pubspec.yaml` | Flutter |
| `*.swift` + `Package.swift` | SwiftUI |
| `package.json` con `react-native` | React Native |

## UI Library Detection

| Indicador | Library |
|-----------|---------|
| `@shadcn/ui` o `components/ui/` | shadcn/ui |
| `@mui/material` | Material UI |
| `@chakra-ui` | Chakra UI |
| `tailwindcss` | Tailwind CSS |
| `styled-components` | Styled Components |

## Stack Adaptation

| Si el proyecto usa | Adaptar a |
|--------------------|-----------|
| shadcn/ui | Usar `<Button>`, `<Card>`, `<Input>` etc. del proyecto |
| CSS Modules | Convertir Tailwind a CSS Modules |
| Styled Components | Convertir a styled() |
| Vue | Convertir JSX a `<template>` + `<script setup>` |
| Svelte | Convertir a `.svelte` components |
| Flutter | Convertir a Widgets |
