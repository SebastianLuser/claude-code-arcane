import * as p from "@clack/prompts";
import chalk from "chalk";
import type { ProfileDefinition } from "./types.js";
import { groupByCategory } from "./profiles.js";
import type { StackDetection } from "./detect.js";
import type { SkillEntry } from "./skills-catalog.js";

/**
 * Interactive profile picker for `arcane install` with no arguments.
 * Detected profiles come pre-selected so a power user confirms with a
 * single Enter; everyone else gets the full catalog grouped by category.
 * Returns the chosen profile names, or null if the user cancelled.
 */
export async function runInstallWizard(
  profiles: ProfileDefinition[],
  detections: StackDetection[],
): Promise<string[] | null> {
  p.intro(chalk.cyan("claude-code-arcane install"));

  const available = new Set(profiles.map((pr) => pr.name));
  const suggested = detections.filter((d) => available.has(d.profile));

  if (suggested.length > 0) {
    p.note(
      suggested
        .map((d) => `${chalk.green(d.profile)}  ${chalk.dim(`(${d.reason})`)}`)
        .join("\n"),
      "Detected stack — pre-selected below",
    );
  } else {
    p.note(
      "No stack detected in this directory.\nPick whatever fits your work — profiles combine freely.",
      "No suggestions",
    );
  }

  const options: Record<
    string,
    Array<{ value: string; label: string; hint: string }>
  > = {};
  for (const group of groupByCategory(profiles)) {
    options[group.label] = group.profiles.map((pr) => ({
      value: pr.name,
      label: pr.name,
      hint: pr.description,
    }));
  }

  const selected = await p.groupMultiselect({
    message: "Select profiles (space to toggle, enter to confirm)",
    options,
    initialValues: suggested.map((d) => d.profile),
    required: false,
  });

  if (p.isCancel(selected)) {
    p.cancel("Install cancelled.");
    return null;
  }

  const names = selected as string[];
  if (names.length === 0) {
    p.outro(
      chalk.dim(
        "Nothing selected. Run again, or install directly: npx claude-code-arcane install backend-ts+testing",
      ),
    );
    return null;
  }

  const expr = names.join("+");
  const ok = await p.confirm({
    message: `Install ${chalk.cyan(expr)} (plus core, always included)?`,
  });

  if (p.isCancel(ok) || !ok) {
    p.cancel("Install cancelled.");
    return null;
  }

  p.outro(
    chalk.dim(`Next time, skip the menu: npx claude-code-arcane install ${expr}`),
  );
  return names;
}

export interface AddWizardInput {
  profiles: ProfileDefinition[];
  skills: SkillEntry[];
  installedProfiles: string[];
  installedSkills: string[];
}

/**
 * Interactive picker for `arcane add` with no arguments — the install wizard's
 * counterpart for an existing installation. Only shows what is not installed
 * yet, so anything selected here is guaranteed to be a real change.
 * Returns items in `add` syntax (`+profile` / `skill`), or null if cancelled.
 */
export async function runAddWizard(
  input: AddWizardInput,
): Promise<string[] | null> {
  const installedProfiles = new Set(input.installedProfiles);
  const installedSkills = new Set(input.installedSkills);
  const addableProfiles = input.profiles.filter(
    (pr) => !installedProfiles.has(pr.name),
  );
  const addableSkills = input.skills.filter((s) => !installedSkills.has(s.name));

  p.intro(chalk.cyan("claude-code-arcane add"));

  const current = input.installedProfiles.filter((n) => n !== "core");
  p.note(
    [
      `Profiles: ${current.length > 0 ? chalk.green(current.join(", ")) : chalk.dim("core only")}`,
      `Skills:   ${chalk.green(String(installedSkills.size))} installed, ${chalk.dim(`${addableSkills.length} available`)}`,
    ].join("\n"),
    "Current installation",
  );

  if (addableProfiles.length === 0 && addableSkills.length === 0) {
    p.outro(chalk.dim("Everything in the catalog is already installed."));
    return null;
  }

  const kind = await pickKind(addableProfiles.length, addableSkills.length);
  if (kind === null) return null;

  const items =
    kind === "profiles"
      ? await pickProfiles(addableProfiles)
      : await pickSkills(addableSkills);
  if (items === null) return null;

  if (items.length === 0) {
    p.outro(
      chalk.dim(
        "Nothing selected. Run again, or add directly: npx claude-code-arcane add +testing docker-setup",
      ),
    );
    return null;
  }

  const expr = items.join(" ");
  const ok = await p.confirm({ message: `Add ${chalk.cyan(expr)}?` });
  if (p.isCancel(ok) || !ok) {
    p.cancel("Add cancelled.");
    return null;
  }

  p.outro(
    chalk.dim(`Next time, skip the menu: npx claude-code-arcane add ${expr}`),
  );
  return items;
}

async function pickKind(
  profileCount: number,
  skillCount: number,
): Promise<"profiles" | "skills" | null> {
  if (profileCount === 0) return "skills";
  if (skillCount === 0) return "profiles";

  const kind = await p.select({
    message: "What do you want to add?",
    options: [
      {
        value: "profiles" as const,
        label: "Profiles",
        hint: `${profileCount} not installed — brings its skills, rules and agents`,
      },
      {
        value: "skills" as const,
        label: "Individual skills",
        hint: `${skillCount} not installed — search by name`,
      },
    ],
  });

  if (p.isCancel(kind)) {
    p.cancel("Add cancelled.");
    return null;
  }
  return kind;
}

async function pickProfiles(
  addable: ProfileDefinition[],
): Promise<string[] | null> {
  const options: Record<
    string,
    Array<{ value: string; label: string; hint: string }>
  > = {};
  for (const group of groupByCategory(addable)) {
    options[group.label] = group.profiles.map((pr) => ({
      value: pr.name,
      label: pr.name,
      hint: hint(pr.description),
    }));
  }

  const selected = await p.groupMultiselect({
    message: "Select profiles to add (space to toggle, enter to confirm)",
    options,
    required: false,
  });

  if (p.isCancel(selected)) {
    p.cancel("Add cancelled.");
    return null;
  }
  return (selected as string[]).map((name) => `+${name}`);
}

async function pickSkills(addable: SkillEntry[]): Promise<string[] | null> {
  const selected = await p.autocompleteMultiselect({
    message: "Search skills to add (type to filter, space to toggle)",
    options: addable.map((s) => ({
      value: s.name,
      label: s.name,
      hint: hint(s.description),
    })),
    required: false,
  });

  if (p.isCancel(selected)) {
    p.cancel("Add cancelled.");
    return null;
  }
  return selected as string[];
}

// Profile and skill descriptions run long enough to wrap several terminal
// lines, which turns the picker into a wall of text.
function hint(description: string, max = 90): string {
  const flat = description.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 3)}...` : flat;
}
