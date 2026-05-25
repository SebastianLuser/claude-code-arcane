import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { copyDirSync, isSymlinkOrJunction, safeRemove, ensureDir, fileExists } from "../utils.js";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arcane-test-"));
}

describe("copyDirSync", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("copies a directory recursively", () => {
    tmpDir = makeTmpDir();
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");

    fs.mkdirSync(path.join(src, "sub"), { recursive: true });
    fs.writeFileSync(path.join(src, "a.txt"), "hello");
    fs.writeFileSync(path.join(src, "sub", "b.txt"), "world");

    copyDirSync(src, dest);

    expect(fs.readFileSync(path.join(dest, "a.txt"), "utf-8")).toBe("hello");
    expect(fs.readFileSync(path.join(dest, "sub", "b.txt"), "utf-8")).toBe("world");
  });

  it("creates destination if it does not exist", () => {
    tmpDir = makeTmpDir();
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "nested", "dest");

    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, "file.txt"), "data");

    copyDirSync(src, dest);

    expect(fs.existsSync(path.join(dest, "file.txt"))).toBe(true);
  });
});

describe("isSymlinkOrJunction", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("returns false for a regular file", () => {
    tmpDir = makeTmpDir();
    const file = path.join(tmpDir, "regular.txt");
    fs.writeFileSync(file, "content");
    expect(isSymlinkOrJunction(file)).toBe(false);
  });

  it("returns false for a non-existent path", () => {
    expect(isSymlinkOrJunction("/nonexistent/path/xyz")).toBe(false);
  });

  it("returns true for a symlink", () => {
    tmpDir = makeTmpDir();
    const target = path.join(tmpDir, "target");
    const link = path.join(tmpDir, "link");
    fs.mkdirSync(target);
    fs.symlinkSync(target, link, "junction");
    expect(isSymlinkOrJunction(link)).toBe(true);
  });
});

describe("safeRemove", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("removes a regular file", () => {
    tmpDir = makeTmpDir();
    const file = path.join(tmpDir, "file.txt");
    fs.writeFileSync(file, "data");
    safeRemove(file);
    expect(fs.existsSync(file)).toBe(false);
  });

  it("removes a directory recursively", () => {
    tmpDir = makeTmpDir();
    const dir = path.join(tmpDir, "dir");
    fs.mkdirSync(path.join(dir, "sub"), { recursive: true });
    fs.writeFileSync(path.join(dir, "sub", "f.txt"), "x");
    safeRemove(dir);
    expect(fs.existsSync(dir)).toBe(false);
  });

  it("removes a symlink without removing the target", () => {
    tmpDir = makeTmpDir();
    const target = path.join(tmpDir, "target");
    const link = path.join(tmpDir, "link");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "keep.txt"), "keep");
    fs.symlinkSync(target, link, "junction");

    safeRemove(link);

    expect(fs.existsSync(link)).toBe(false);
    expect(fs.existsSync(path.join(target, "keep.txt"))).toBe(true);
  });

  it("does nothing for non-existent path", () => {
    expect(() => safeRemove("/nonexistent/path/abc")).not.toThrow();
  });
});

describe("ensureDir", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("creates nested directories", () => {
    tmpDir = makeTmpDir();
    const nested = path.join(tmpDir, "a", "b", "c");
    ensureDir(nested);
    expect(fs.existsSync(nested)).toBe(true);
  });
});

describe("fileExists", () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  });

  it("returns true for existing file", () => {
    tmpDir = makeTmpDir();
    const file = path.join(tmpDir, "exists.txt");
    fs.writeFileSync(file, "yes");
    expect(fileExists(file)).toBe(true);
  });

  it("returns false for missing file", () => {
    expect(fileExists("/nonexistent/file.txt")).toBe(false);
  });
});
