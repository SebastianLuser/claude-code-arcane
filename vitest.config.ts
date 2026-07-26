import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15_000,
    // `tests/` holds specs for shipped skill assets (e.g. the job-scrape CLIs),
    // which live outside tsconfig's rootDir: src. Keeping them here rather than
    // in src/__tests__ is what lets `tsc --noEmit` stay green while vitest
    // still transpiles the .ts sources it imports.
    include: ["src/__tests__/**/*.test.ts", "tests/**/*.test.ts"],
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
