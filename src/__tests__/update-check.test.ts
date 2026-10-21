import { describe, it, expect } from "vitest";
import { compareSemver, isCacheFresh, isContentUpdateAvailable } from "../update-check.js";

/**
 * The notice used to compare the manifest version against a git SHA. A semver
 * never equals a SHA and a SHA never starts with a semver, so the condition was
 * true forever: every command nagged about an update that was already applied.
 * Meanwhile the CLI's own version was never checked at all, so a binary four
 * minors behind kept installing content it could not render.
 */
describe("isContentUpdateAvailable", () => {
  it("stays quiet when the local SHA matches the remote one", () => {
    expect(isContentUpdateAvailable("ca092ff3113b", "ca092ff3113b")).toBe(false);
  });

  it("stays quiet when the remote SHA is a longer form of the local one", () => {
    expect(isContentUpdateAvailable("ca092ff", "ca092ff3113b")).toBe(false);
    expect(isContentUpdateAvailable("ca092ff3113b", "ca092ff")).toBe(false);
  });

  it("reports an update when the SHAs genuinely differ", () => {
    expect(isContentUpdateAvailable("ca092ff3113b", "11b76df0a1c2")).toBe(true);
  });

  it("stays quiet for a semver local version — the regression this fixes", () => {
    expect(isContentUpdateAvailable("2.5.0", "ca092ff3113b")).toBe(false);
    expect(isContentUpdateAvailable("2.6.0", "11b76df0a1c2")).toBe(false);
  });

  it("stays quiet when there is no manifest to compare", () => {
    expect(isContentUpdateAvailable("unknown", "ca092ff3113b")).toBe(false);
  });
});

describe("compareSemver", () => {
  it("orders by major, minor, then patch", () => {
    expect(compareSemver("2.6.0", "2.1.0")).toBeGreaterThan(0);
    expect(compareSemver("2.1.0", "2.6.0")).toBeLessThan(0);
    expect(compareSemver("3.0.0", "2.99.99")).toBeGreaterThan(0);
    expect(compareSemver("2.6.1", "2.6.0")).toBeGreaterThan(0);
  });

  it("treats equal versions as equal, with or without a v prefix", () => {
    expect(compareSemver("2.6.0", "2.6.0")).toBe(0);
    expect(compareSemver("v2.6.0", "2.6.0")).toBe(0);
  });

  it("sorts a prerelease below the release it leads to", () => {
    expect(compareSemver("2.6.0-rc.1", "2.6.0")).toBeLessThan(0);
    expect(compareSemver("2.6.0", "2.6.0-rc.1")).toBeGreaterThan(0);
  });

  it("does not offer an update when the registry matches the running CLI", () => {
    expect(compareSemver("2.6.0", "2.6.0") > 0).toBe(false);
  });

  it("offers an update for the 2.1.0 install that missed the category wizard", () => {
    expect(compareSemver("2.6.0", "2.1.0") > 0).toBe(true);
  });
});

/**
 * One cache file serves every project on the machine. After `arcane update`
 * moved a project to the latest SHA, the cache written before the update (or in
 * another project) kept printing "content update: 2.5.0 → <sha>" for 4 hours.
 */
describe("isCacheFresh", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  const cached = { checked_at: "2026-10-20T11:00:00Z", local_version: "7deca91884a0", cli_version: "2.27.1" };

  it("reuses a recent cache from the same project and CLI", () => {
    expect(isCacheFresh(cached, "7deca91884a0", "2.27.1", now)).toBe(true);
  });

  it("drops it when the project's content version differs (another project, or just updated)", () => {
    expect(isCacheFresh(cached, "2.5.0", "2.27.1", now)).toBe(false);
  });

  it("drops it when the CLI was upgraded", () => {
    expect(isCacheFresh(cached, "7deca91884a0", "2.28.0", now)).toBe(false);
  });

  it("drops a cache written before the CLI version was recorded", () => {
    const legacy = { checked_at: cached.checked_at, local_version: "7deca91884a0" };
    expect(isCacheFresh(legacy, "7deca91884a0", "2.27.1", now)).toBe(false);
  });

  it("drops it after four hours", () => {
    expect(isCacheFresh({ ...cached, checked_at: "2026-10-20T07:59:00Z" }, "7deca91884a0", "2.27.1", now)).toBe(false);
  });
});
