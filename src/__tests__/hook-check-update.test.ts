import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Specs for hooks/check-update.mjs: the cached SessionStart update check. */

interface Options { cwd: string; checkFile: string; cmd?: string; now?: number; fetchSha?: () => Promise<string> }
interface CheckUpdate {
  CHECK_INTERVAL_MS: number;
  cached(checkFile: string, now?: number): "available" | "current" | "stale";
  check(opts: Options): Promise<string>;
}

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks", "check-update.mjs");
const cu = (await import(pathToFileURL(HOOK).href)) as CheckUpdate;

const NOW = Date.parse("2026-10-27T12:00:00Z");
const SHA = "abcdef1234567890";
let dir: string;
let checkFile: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane check-update "));
  checkFile = path.join(dir, "home", "last-check.json");
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function install(version: string) {
  fs.mkdirSync(path.join(dir, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".claude", "arcane-manifest.json"), JSON.stringify({ source_version: version }));
}

function cache(at: number, available: boolean) {
  fs.mkdirSync(path.dirname(checkFile), { recursive: true });
  fs.writeFileSync(checkFile, JSON.stringify({ checked_at: new Date(at).toISOString(), update_available: available }));
}

const run = (fetchSha = async () => SHA) => cu.check({ cwd: dir, checkFile, cmd: "ARC", now: NOW, fetchSha });

describe("check-update", () => {
  it("does nothing outside an Arcane install", async () => {
    let fetched = false;
    expect(await run(async () => ((fetched = true), SHA))).toBe("");
    expect(fetched).toBe(false);
  });

  it("announces a newer commit and caches it", async () => {
    install("1111111");
    expect(await run()).toBe(`Arcane update available: 1111111 → ${SHA}. Run: ARC update`);
    expect(JSON.parse(fs.readFileSync(checkFile, "utf-8"))).toMatchObject({
      checked_at: "2026-10-27T12:00:00Z", local_version: "1111111", remote_sha: SHA, update_available: true });
  });

  it("a SHA prefix of the remote is current", async () => {
    install(SHA.slice(0, 7));
    expect(await run()).toBe("");
  });

  it("a semver install never announces an update", async () => {
    install("2.29.7");
    expect(await run()).toBe("");
    expect(JSON.parse(fs.readFileSync(checkFile, "utf-8")).update_available).toBe(false);
  });

  it("a fresh cache answers without the network", async () => {
    install("1111111");
    const offline = async () => { throw new Error("no network"); };
    cache(NOW - 1000, true);
    expect(await run(offline)).toBe("Arcane update available. Run: ARC update");
    cache(NOW - 1000, false);
    expect(await run(offline)).toBe("");
  });

  it("a stale or broken cache checks again", () => {
    cache(NOW - cu.CHECK_INTERVAL_MS, false);
    expect(cu.cached(checkFile, NOW)).toBe("stale");
    fs.writeFileSync(checkFile, "{");
    expect(cu.cached(checkFile, NOW)).toBe("stale");
  });

  it("stays quiet when GitHub does not answer", async () => {
    install("1111111");
    expect(await run(async () => "")).toBe("");
    expect(fs.existsSync(checkFile)).toBe(false);
  });
});
