import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Specs for skills/worktree-isolation/scripts/apply.mjs. */

interface Mapping { service: string; hostIp: string | null; originalHostPort: number; containerPort: number; protocol: string; varName: string | null }
interface Apply {
  parseYaml(source: string): any;
  parsePortEntry(entry: unknown, service: string): Mapping | null;
  allocatePort(worktree: string, service: string, host: number, container: number): number;
  worktreeId(cwd: string): string;
  run(opts: object, log?: (s: string) => void, err?: (s: string) => void): number;
}

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..",
  "skills", "worktree-isolation", "scripts", "apply.mjs");
const wi = (await import(pathToFileURL(SCRIPT).href)) as Apply;

const COMPOSE = `# test stack
services:
  db:
    image: "postgres:16" # pinned
    container_name: rr-db
    ports:
    - "\${TEST_DB_PORT:-5433}:5432"
    environment:
      POSTGRES_PASSWORD: x
  cache:
    ports: ["127.0.0.1:6379:6379", "5000/udp"]
  api:
    command: |
      echo "ports: no"
    ports:
      - target: 80
        published: 8080
  worker:
    image: busybox
`;

let dir: string;
beforeEach(() => {
  dir = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "arcane wt ")));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("compose parsing", () => {
  it("reads the parts the isolation needs", () => {
    const services = wi.parseYaml(COMPOSE).services;
    expect(services.db.container_name).toBe("rr-db");
    expect(services.db.ports).toEqual(["${TEST_DB_PORT:-5433}:5432"]);
    expect(services.cache.ports).toEqual(["127.0.0.1:6379:6379", "5000/udp"]);
    expect(services.api.ports).toEqual([{ target: 80, published: 8080 }]);
    expect(services.worker).toEqual({ image: "busybox" });
  });

  it("port entries in every form", () => {
    expect(wi.parsePortEntry("${P:-5433}:5432", "db")).toMatchObject({ originalHostPort: 5433, containerPort: 5432, varName: "P" });
    expect(wi.parsePortEntry("127.0.0.1:6379:6379", "c")).toMatchObject({ hostIp: "127.0.0.1", originalHostPort: 6379 });
    expect(wi.parsePortEntry("5000/udp", "c")).toMatchObject({ originalHostPort: 5000, containerPort: 5000, protocol: "udp" });
    expect(wi.parsePortEntry({ target: 80, published: "${WEB:-8080}" }, "w")).toMatchObject({ originalHostPort: 8080, varName: "WEB" });
    expect(wi.parsePortEntry("1:2:3:4", "x")).toBeNull();
  });

  it("allocates the same ports the Python version did", () => {
    // Values from lib.py, so worktrees keep their ports across the port.
    expect(wi.allocatePort("abcd1234", "db", 5433, 5432)).toBe(22959);
    expect(wi.worktreeId("C:\\x\\y")).toBe("59264f75");
  });
});

describe("run", () => {
  function apply(opts: object) {
    const out: string[] = [];
    const code = wi.run({ cwd: dir, ...opts }, (s) => out.push(s), (s) => out.push(s));
    return { code, out: out.join("\n") };
  }

  it("writes the override, the env file and the git excludes", () => {
    execSync("git init -q", { cwd: dir });
    fs.writeFileSync(path.join(dir, "docker-compose.yml"), COMPOSE);
    const { code, out } = apply({ verbose: true });
    const wid = wi.worktreeId(dir);
    const db = wi.allocatePort(wid, "db", 5433, 5432);

    expect(code).toBe(0);
    expect(out).toContain(`db  container :5432  →  host ${db}  (was 5433)`);
    const override = fs.readFileSync(path.join(dir, "docker-compose.worktree.yml"), "utf-8");
    const parsed = wi.parseYaml(override);
    expect(parsed.name).toBe(`${path.basename(dir)}-${wid}`);
    expect(parsed.services.db).toEqual({ ports: [`${db}:5432`], container_name: `rr-db-${wid}` });
    expect(override).toContain("ports: !override");
    expect(parsed.services.cache.ports[1]).toMatch(/^\d+:5000\/udp$/);
    expect(parsed.services.worker).toBeUndefined();

    const env = fs.readFileSync(path.join(dir, ".env.worktree"), "utf-8");
    expect(env).toContain("COMPOSE_FILE=docker-compose.yml:docker-compose.worktree.yml");
    expect(env).toContain(`DB_5432_HOST_PORT=${db}\nTEST_DB_PORT=${db}\n`);
    expect(fs.readFileSync(path.join(dir, ".git", "info", "exclude"), "utf-8")).toContain("*.worktree.yml");

    expect(apply({}).out).toContain("no changes");
    expect(apply({ status: true }).out).toBe(env);
  });

  it("hook mode emits SessionStart JSON, or continue when there is nothing to do", () => {
    expect(JSON.parse(apply({ quiet: true }).out)).toEqual({ continue: true });
    fs.writeFileSync(path.join(dir, "compose.yaml"), COMPOSE);
    const hook = JSON.parse(apply({ quiet: true }).out);
    expect(hook.hookSpecificOutput.hookEventName).toBe("SessionStart");
    expect(hook.hookSpecificOutput.additionalContext).toContain("Worktree isolation active");
    expect(fs.existsSync(path.join(dir, "compose.worktree.yaml"))).toBe(true);
  });

  it("--status without an env file fails", () => {
    expect(apply({ status: true }).code).toBe(1);
  });
});
