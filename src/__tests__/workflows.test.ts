import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Installer } from "../installer.js";
import { listProfiles, mergeProfiles, parseProfile } from "../profiles.js";
import { readManifest } from "../manifest.js";

/** Workflow profiles: what brings them, what they bring, and what takes them away. */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.resolve(__dirname, "..", "..", "profiles");
const CODE_RULES = ["implementation-workflow", "test-standards", "code-comments", "prototype-code", "data-files", "git-worktrees"];

let tmpDir: string;

function install(command: string): void {
  const merged = mergeProfiles(PROFILES_DIR, command.split("+"));
  new Installer(merged, { target: tmpDir, dryRun: false, force: false }).run(command);
}

const ruleOnDisk = (rule: string) => fs.existsSync(path.join(tmpDir, ".claude", "rules", `${rule}.md`));

describe("workflow profiles", () => {
  const profiles = listProfiles(PROFILES_DIR);
  const workflows = profiles.filter((p) => p.category === "workflow");

  it("every workflow a profile names is a workflow profile with an entry", () => {
    const names = new Set(workflows.map((p) => p.name));
    const bad = profiles.flatMap((p) => p.workflows.filter((w) => !names.has(w)).map((w) => `${p.name} -> ${w}`));
    expect(bad).toEqual([]);
    expect(workflows.filter((w) => !w.entry).map((w) => w.name)).toEqual([]);
  });

  it("every code profile brings code-flow", () => {
    // Core no longer carries the coding rules: a code profile without it would ship none.
    const nonCode = new Set(["design", "audio", "blender", "meshy", "unity-design"]);
    const code = profiles.filter((p) => ["backend", "frontend", "mobile", "gamedev", "platform"].includes(p.category));
    const missing = code.filter((p) => !nonCode.has(p.name) && !p.workflows.includes("code-flow")).map((p) => p.name);
    expect(missing).toEqual([]);
  });

  it("core carries no coding rule", () => {
    const core = parseProfile(path.join(PROFILES_DIR, "core.yaml"));
    expect(core.rules.universal.filter((r) => CODE_RULES.includes(r))).toEqual([]);
    expect(core.skills).not.toContain("kickoff");
  });
});

describe("mergeProfiles with workflows", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-wf-profiles-"));
    fs.writeFileSync(path.join(dir, "core.yaml"), "name: core\n");
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("loads a profile's workflows after it, once", () => {
    const merged = mergeProfiles(PROFILES_DIR, ["backend-go", "frontend-react-vite"]);
    expect(merged.loaded.filter((p) => p === "code-flow")).toHaveLength(1);
    expect(merged.rules.universal).toEqual(expect.arrayContaining(CODE_RULES));
    expect(merged.skills).toContain("kickoff");
  });

  it("names the missing workflow instead of skipping it", () => {
    fs.writeFileSync(path.join(dir, "a.yaml"), "name: a\nworkflows: [ghost-flow]\n");
    expect(() => mergeProfiles(dir, ["a"])).toThrow("Profile 'a' names workflow 'ghost-flow'");
  });

  it("stops on workflows that name each other", () => {
    fs.writeFileSync(path.join(dir, "x-flow.yaml"), "name: x-flow\nworkflows: [y-flow]\nskills: [x]\n");
    fs.writeFileSync(path.join(dir, "y-flow.yaml"), "name: y-flow\nworkflows: [x-flow]\nskills: [y]\n");
    expect(mergeProfiles(dir, ["x-flow"]).loaded).toEqual(["core", "x-flow", "y-flow"]);
  });
});

describe("commands with workflows", () => {
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  const quiet: Array<ReturnType<typeof vi.spyOn>> = [];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-wf-cmd-"));
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    for (const method of ["log", "warn", "error"] as const) quiet.push(vi.spyOn(console, method).mockImplementation(() => {}));
  });
  afterEach(() => {
    cwdSpy.mockRestore();
    quiet.splice(0).forEach((s) => s.mockRestore());
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  it("remove takes a profile's workflow when nothing else brings it", async () => {
    install("backend-go+agile");
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+backend-go"]);

    expect(CODE_RULES.filter(ruleOnDisk)).toEqual([]);
    const manifest = readManifest(tmpDir)!;
    expect(manifest.profile_command).toBe("agile");
    expect(manifest.profiles).not.toContain("code-flow");
  });

  it("remove keeps a workflow another profile still brings", async () => {
    install("backend-go+frontend-react-vite");
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+backend-go"]);

    expect(CODE_RULES.filter((r) => !ruleOnDisk(r))).toEqual([]);
    expect(fs.existsSync(path.join(tmpDir, ".claude", "skills", "kickoff"))).toBe(true);
    expect(readManifest(tmpDir)!.profiles).toContain("code-flow");
  });

  it("remove refuses a workflow that came with another profile", async () => {
    install("backend-go");
    const { removeCommand } = await import("../commands/remove.js");
    await removeCommand(["+code-flow"]);
    expect(CODE_RULES.filter((r) => !ruleOnDisk(r))).toEqual([]);
  });

  it("add brings the workflows of the profile it adds", async () => {
    install("agile");
    const { addCommand } = await import("../commands/add.js");
    await addCommand(["+backend-go"]);

    expect(CODE_RULES.filter((r) => !ruleOnDisk(r))).toEqual([]);
    const manifest = readManifest(tmpDir)!;
    expect(manifest.profile_command).toBe("agile+backend-go");
    expect(manifest.profiles).toEqual(expect.arrayContaining(["backend-go", "code-flow"]));
  });

  it("install adds code-flow to a code project installed with non-code profiles", async () => {
    fs.writeFileSync(path.join(tmpDir, "pyproject.toml"), "[project]\nname = 'x'\n");
    const { installCommand } = await import("../commands/install.js");
    await installCommand("agile", { target: tmpDir });

    expect(readManifest(tmpDir)!.profile_command).toBe("agile+code-flow");
    expect(ruleOnDisk("implementation-workflow")).toBe(true);
  });

  it("update gives code-flow to a code project installed only with non-code profiles", async () => {
    install("agile");
    fs.writeFileSync(path.join(tmpDir, "go.mod"), "module x\n");
    const manifestFile = path.join(tmpDir, ".claude", "arcane-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf-8"));
    manifest.source_version = manifest.arcane_version = "0.0.1";
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));

    const { updateCommand } = await import("../commands/update.js");
    await updateCommand({ here: true });

    expect(ruleOnDisk("implementation-workflow")).toBe(true);
    const updated = readManifest(tmpDir)!;
    expect(updated.profile_command).toBe("agile+code-flow");
    expect(updated.profiles).toContain("code-flow");
  });

  it("install leaves a project without code alone", async () => {
    const { installCommand } = await import("../commands/install.js");
    await installCommand("agile", { target: tmpDir });

    expect(readManifest(tmpDir)!.profile_command).toBe("agile");
    expect(ruleOnDisk("implementation-workflow")).toBe(false);
  });
});
