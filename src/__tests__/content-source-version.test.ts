import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * `remove` computes what to delete from the profile YAML, so it has to read the
 * YAML of the version that was installed. It resolved "auto" instead, which
 * meant a cache older than the install answered the question: profiles whose
 * agent list had grown since then reported "Removed +profile" while leaving the
 * agent directories on disk.
 *
 * The cache is mocked rather than written to. The real one lives in the user's
 * home directory, and a test has no business leaving versions there.
 */

const isCached = vi.hoisted(() => vi.fn());

vi.mock("../cache.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../cache.js")>();
  return { ...actual, isCached };
});

describe("resolveContentSourceForVersion", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    isCached.mockReset();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("uses the installed version when it is still cached", async () => {
    // Arrange
    isCached.mockImplementation((v: string) => v === "1.2.3");
    const { resolveContentSourceForVersion } = await import("../content-source.js");

    // Act
    const source = await resolveContentSourceForVersion("1.2.3", { quiet: true });

    // Assert
    expect(source.type).toBe("cache");
    await expect(source.getVersion()).resolves.toBe("1.2.3");
  });

  it("falls back to the preferred source when that version is gone", async () => {
    // Arrange
    isCached.mockReturnValue(false);
    const { resolveContentSourceForVersion } = await import("../content-source.js");

    // Act
    const source = await resolveContentSourceForVersion("0.0.1", {
      source: "bundled",
      quiet: true,
    });

    // Assert
    expect(source.type).toBe("bundled");
  });

  it("says which definitions it used when they are not the installed ones", async () => {
    // Arrange: silence is what made the original bug hard to see, so the
    // warning is the fix as much as the fallback is.
    isCached.mockReturnValue(false);
    const { resolveContentSourceForVersion } = await import("../content-source.js");

    // Act
    await resolveContentSourceForVersion("0.0.1", { source: "bundled" });

    // Assert
    const warned = warnSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
    expect(warned).toContain("0.0.1");
    expect(warned).toContain("left behind");
  });

  it("stays quiet when the version matches the resolved source", async () => {
    // Arrange
    isCached.mockReturnValue(false);
    const { getPackageVersion } = await import("../utils.js");
    const { resolveContentSourceForVersion } = await import("../content-source.js");

    // Act
    await resolveContentSourceForVersion(getPackageVersion(), { source: "bundled" });

    // Assert
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns about nothing when there is no recorded version", async () => {
    // Arrange: a manifest predating version tracking should not produce noise.
    isCached.mockReturnValue(false);
    const { resolveContentSourceForVersion } = await import("../content-source.js");

    // Act
    const source = await resolveContentSourceForVersion(undefined, {
      source: "bundled",
      quiet: true,
    });

    // Assert
    expect(source.type).toBe("bundled");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
