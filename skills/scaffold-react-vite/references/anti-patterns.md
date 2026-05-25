# scaffold-react-vite — Anti-patterns

- TS without strict mode — defeats purpose
- Missing path aliases — `../../../` unmanageable
- No env validation — cryptic runtime failures
- No Husky/lint-staged — broken code in PRs
- Barrel exports everywhere — circular deps, hurts tree-shaking
- Server state in Zustand — use TanStack Query
- No `.env.example` — new devs blocked
