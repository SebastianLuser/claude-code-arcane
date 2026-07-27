import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15_000,
    // Only the installer is TypeScript. Specs for shipped skill assets are
    // Python and live in tests/ (see docs/coding-standards.md).
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      ARCANE_SOURCE: "bundled",
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**"],
    },
  },
});
