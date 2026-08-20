import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ProfileDefinition } from "../types.js";

const CANCEL = Symbol("cancel");

const prompts = {
  intro: vi.fn(),
  note: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  select: vi.fn(),
  groupMultiselect: vi.fn(),
  autocompleteMultiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: (v: unknown) => v === CANCEL,
};

vi.mock("@clack/prompts", () => prompts);

const { runAddWizard } = await import("../wizard.js");

function profile(name: string, category: string): ProfileDefinition {
  return {
    name,
    description: `${name} description`,
    category,
    skills: [],
    rules: { universal: [], gamedev: [] },
    agents: [],
    hooks: [],
    permissions: { allow: [], deny: [] },
  };
}

const PROFILES = [
  profile("testing", "platform"),
  profile("frontend", "frontend"),
  profile("agile", "management"),
];

const SKILLS = [
  { name: "commit", description: "Commit helper" },
  { name: "docker-setup", description: "Docker helper" },
];

describe("runAddWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prompts.confirm.mockResolvedValue(true);
  });

  it("offers only profiles that are not installed and returns them +prefixed", async () => {
    prompts.select.mockResolvedValue("profiles");
    prompts.groupMultiselect.mockResolvedValue(["testing"]);

    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core", "frontend"],
      installedSkills: ["commit"],
    });

    expect(result).toEqual(["+testing"]);

    const offered = Object.values(
      prompts.groupMultiselect.mock.calls[0][0].options as Record<
        string,
        Array<{ value: string }>
      >,
    )
      .flat()
      .map((o) => o.value);
    expect(offered).toEqual(expect.arrayContaining(["testing", "agile"]));
    expect(offered).not.toContain("frontend");
  });

  it("offers only skills that are not installed", async () => {
    prompts.select.mockResolvedValue("skills");
    prompts.autocompleteMultiselect.mockResolvedValue(["docker-setup"]);

    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core"],
      installedSkills: ["commit"],
    });

    expect(result).toEqual(["docker-setup"]);
    const offered = (
      prompts.autocompleteMultiselect.mock.calls[0][0].options as Array<{
        value: string;
      }>
    ).map((o) => o.value);
    expect(offered).toEqual(["docker-setup"]);
  });

  it("skips the kind question when every profile is already installed", async () => {
    prompts.autocompleteMultiselect.mockResolvedValue(["docker-setup"]);

    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core", "testing", "frontend", "agile"],
      installedSkills: ["commit"],
    });

    expect(prompts.select).not.toHaveBeenCalled();
    expect(result).toEqual(["docker-setup"]);
  });

  it("returns null when there is nothing left to add", async () => {
    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core", "testing", "frontend", "agile"],
      installedSkills: ["commit", "docker-setup"],
    });

    expect(result).toBeNull();
    expect(prompts.select).not.toHaveBeenCalled();
    expect(prompts.outro).toHaveBeenCalled();
  });

  it("returns null when the selection is cancelled", async () => {
    prompts.select.mockResolvedValue("profiles");
    prompts.groupMultiselect.mockResolvedValue(CANCEL);

    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core"],
      installedSkills: [],
    });

    expect(result).toBeNull();
    expect(prompts.cancel).toHaveBeenCalled();
  });

  it("returns null when the final confirm is declined", async () => {
    prompts.select.mockResolvedValue("profiles");
    prompts.groupMultiselect.mockResolvedValue(["testing"]);
    prompts.confirm.mockResolvedValue(false);

    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core"],
      installedSkills: [],
    });

    expect(result).toBeNull();
    expect(prompts.cancel).toHaveBeenCalled();
  });

  it("returns null when nothing is selected", async () => {
    prompts.select.mockResolvedValue("profiles");
    prompts.groupMultiselect.mockResolvedValue([]);

    const result = await runAddWizard({
      profiles: PROFILES,
      skills: SKILLS,
      installedProfiles: ["core"],
      installedSkills: [],
    });

    expect(result).toBeNull();
    expect(prompts.confirm).not.toHaveBeenCalled();
  });

  it("truncates long hints so the picker stays readable", async () => {
    prompts.select.mockResolvedValue("skills");
    prompts.autocompleteMultiselect.mockResolvedValue([]);

    await runAddWizard({
      profiles: PROFILES,
      skills: [{ name: "long", description: "x".repeat(300) }],
      installedProfiles: ["core"],
      installedSkills: [],
    });

    const hint = (
      prompts.autocompleteMultiselect.mock.calls[0][0].options as Array<{
        hint: string;
      }>
    )[0].hint;
    expect(hint.length).toBeLessThanOrEqual(90);
    expect(hint.endsWith("...")).toBe(true);
  });
});
