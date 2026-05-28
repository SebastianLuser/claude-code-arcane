import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  BundledContentSource,
  resolveContentSource,
} from "../content-source.js";
import { getPackageRoot, getPackageVersion } from "../utils.js";

describe("BundledContentSource", () => {
  it("should resolve to package root", async () => {
    // Arrange
    const source = new BundledContentSource();

    // Act
    const root = await source.getContentRoot();

    // Assert
    expect(root).toBe(getPackageRoot());
  });

  it("should be available when skills directory exists", async () => {
    // Arrange
    const source = new BundledContentSource();

    // Act
    const available = await source.isAvailable();

    // Assert
    expect(available).toBe(true);
  });

  it("should return package version", async () => {
    // Arrange
    const source = new BundledContentSource();

    // Act
    const version = await source.getVersion();

    // Assert
    expect(version).toBe(getPackageVersion());
  });

  it("should have type bundled", () => {
    const source = new BundledContentSource();
    expect(source.type).toBe("bundled");
  });
});

describe("resolveContentSource", () => {
  it("should return bundled source when preference is bundled", async () => {
    // Act
    const source = await resolveContentSource({ source: "bundled", quiet: true });

    // Assert
    expect(source.type).toBe("bundled");
    const root = await source.getContentRoot();
    expect(fs.existsSync(path.join(root, "skills"))).toBe(true);
  });

  it("should return bundled source when ARCANE_SOURCE env is bundled", async () => {
    // Arrange — env already set to "bundled" by vitest.config.ts

    // Act
    const source = await resolveContentSource({ quiet: true });

    // Assert
    expect(source.type).toBe("bundled");
  });

  it("should have content root with profiles directory", async () => {
    // Act
    const source = await resolveContentSource({ source: "bundled", quiet: true });
    const root = await source.getContentRoot();

    // Assert
    expect(fs.existsSync(path.join(root, "profiles"))).toBe(true);
    expect(fs.existsSync(path.join(root, "skills"))).toBe(true);
    expect(fs.existsSync(path.join(root, "rules"))).toBe(true);
  });
});
