---
name: accessibility
description: "Web/mobile accessibility decision guide: WCAG 2.2 AA, ARIA, keyboard nav, focus management, contrast, testing. Use for: a11y, accessibility, wcag, aria, screen reader, keyboard, contrast."
category: "frontend"
argument-hint: "[audit|fix] [path]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
metadata:
  category: quality
  sources:
    - WCAG 2.1 AA (W3C Web Content Accessibility Guidelines)
    - ARIA Authoring Practices Guide (w3.org/WAI/ARIA/apg)
    - WebAIM (webaim.org)
    - Deque axe-core documentation
---
# accessibility — Decision Guide

Target: **WCAG 2.2 AA**. Stack: React + Vite + shadcn/ui (web), React Native (mobile).

> → Read references/wcag-criteria.md for full WCAG 2.2 AA essential criteria table with common failures

> → Read references/component-requirements.md for ARIA roles, keyboard behavior per component type

## Color & Contrast

- Normal text (<18pt): **4.5:1**. Large text (>=18pt / >=14pt bold): **3:1**. UI components: **3:1**
- Never convey info by color alone — pair with icon, text, or pattern
- Design contrast for light and dark themes independently

> → Read references/focus-forms-testing.md for focus management rules, forms checklist, testing methods

> → Read references/anti-patterns.md for common accessibility anti-patterns
