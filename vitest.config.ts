import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15_000,
    // Only the installer is TypeScript. Specs for shipped skill assets are
    // Python and live in tests/ (see docs/coding-standards.md).
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      ARCANE_SOURCE: "bundled",
      // install, update and worktree all register their target into
      // $ARCANE_HOME/installations.json, and the global update rewrites every path listed
      // there. Left unset, the suite wrote to the real ~/.arcane: it deployed the working
      // tree into all 13 registered projects on this machine and left tmpdir paths
      // registered forever. Pinning it here covers every test file, present and future —
      // per-describe overrides are no longer the only thing standing between `npm test`
      // and the user's repos.
      ARCANE_HOME: path.join(os.tmpdir(), "arcane-test-home"),
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**"],
    },
  },
});
