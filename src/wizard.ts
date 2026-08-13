import * as p from "@clack/prompts";
import chalk from "chalk";
import type { ProfileDefinition } from "./types.js";
import { groupByCategory } from "./profiles.js";
import type { StackDetection } from "./detect.js";

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
