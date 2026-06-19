import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import chalk from "chalk";
import { readManifest, updateManifestFields, manifestPath } from "../manifest.js";
import { copyDirSync } from "../utils.js";
import { mergeProfiles } from "../profiles.js";
import {
  computeContentHashes,
  computeSourceHashes,
  type ContentHashes,
} from "../content-hash.js";
import { resolveContentSource, type SourcePreference } from "../content-source.js";
import { registerInstallation, pruneRegistry } from "../registry.js";
import { selfUpdateNpm } from "../self-update.js";

interface UpdateOpts {
  quiet?: boolean;
  dryRun?: boolean;
  force?: boolean;
  source?: SourcePreference;
  /** Update only the current working directory (legacy behavior). */
  here?: boolean;
  /** Run the global npm self-update. Defaults to true. */
  selfUpdate?: boolean;
}

type UpdateAction = "update" | "skip-customized" | "skip-unchanged" | "conflict" | "add" | "remove";

type UpdateStatus = "no-manifest" | "up-to-date" | "no-changes" | "updated" | "dry-run";

interface UpdateResult {
  target: string;
  status: UpdateStatus;
  fromVersion?: string;
  toVersion?: string;
  updated: number;
  skipped: number;
  removed: number;
}

interface UpdateItem {
  type: "skill" | "rule" | "agent" | "hook";
  name: string;
  action: UpdateAction;
}

/**
 * General update: refresh the global npm package, then propagate content
 * updates to every registered Arcane installation (plus the global ~/.claude
 * install if present). Use `--here` to update only the current repo.
 */
export async function updateCommand(opts: UpdateOpts): Promise<void> {
  if (opts.here) {
    await updateTarget(process.cwd(), opts);
    return;
  }

  // 1. Keep the globally-installed CLI current.
  const self = await selfUpdateNpm({
    quiet: opts.quiet,
    dryRun: opts.dryRun,
    selfUpdate: opts.selfUpdate,
  });
  if (!opts.quiet) {
    if (self.updated) {
      console.log(chalk.green("npm package updated to latest."));
    } else if (self.skipped && self.reason !== "dev/test environment") {
      console.log(chalk.dim(`npm self-update skipped (${self.reason}).`));
    } else if (!self.skipped) {
      console.log(chalk.yellow(`npm self-update failed: ${self.reason}`));
    }
  }

  // 2. Seed the registry with the current repo (covers pre-registry installs).
  const cwd = process.cwd();
  if (fs.existsSync(manifestPath(cwd))) {
    registerInstallation(cwd);
  }

  // 3. Collect all targets: registered installs + the global ~/.claude install.
  const targets = pruneRegistry().map((e) => e.path);
  const globalTarget = os.homedir();
  if (
    !process.env.VITEST &&
    fs.existsSync(manifestPath(globalTarget)) &&
    !targets.includes(globalTarget)
  ) {
    targets.push(globalTarget);
  }

  if (targets.length === 0) {
    if (!opts.quiet) {
      console.log(chalk.red("\nNo Arcane installations found. Run 'arcane install' first."));
    }
    return;
  }

  // 4. Update each target independently; one failure must not abort the rest.
  if (!opts.quiet) {
    console.log(
      chalk.bold(`\nUpdating ${targets.length} installation${targets.length === 1 ? "" : "s"}...`),
    );
  }

  const results: UpdateResult[] = [];
  for (const target of targets) {
    if (!opts.quiet) {
      console.log(chalk.bold.cyan(`\n• ${target}`));
    }
    try {
      results.push(await updateTarget(target, opts));
    } catch (err) {
      if (!opts.quiet) {
        console.log(chalk.red(`  Update failed: ${(err as Error).message}`));
      }
      results.push({
        target,
        status: "no-changes",
        updated: 0,
        skipped: 0,
        removed: 0,
      });
    }
  }

  if (!opts.quiet) {
    printGeneralSummary(results, opts.dryRun ?? false);
  }
}

/**
 * Update a single Arcane installation directory. Returns a structured result;
 * also logs human-readable progress unless `quiet`.
 */
export async function updateTarget(
  target: string,
  opts: UpdateOpts,
): Promise<UpdateResult> {
  const manifest = readManifest(target);

  if (!manifest) {
    if (!opts.quiet) {
      console.log(chalk.red("No Arcane installation found. Run 'arcane install' first."));
    }
    return { target, status: "no-manifest", updated: 0, skipped: 0, removed: 0 };
  }

  const contentSource = await resolveContentSource({
    source: opts.source ?? "auto",
    quiet: opts.quiet,
  });
  const root = await contentSource.getContentRoot();
  const currentVersion = await contentSource.getVersion();
  const installedVersion = manifest.source_version ?? manifest.arcane_version;

  if (installedVersion === currentVersion && !opts.force) {
    if (!opts.quiet) {
      console.log(chalk.green(`Already up to date (v${currentVersion}).`));
    }
    return {
      target,
      status: "up-to-date",
      fromVersion: installedVersion,
      toVersion: currentVersion,
      updated: 0,
      skipped: 0,
      removed: 0,
    };
  }

  if (!opts.quiet) {
    console.log(
      chalk.bold(`\nUpdate available: ${chalk.red(installedVersion)} -> ${chalk.green(currentVersion)}`),
    );
  }

  const profileNames = manifest.profile_command.split("+").filter(Boolean);
  const profilesDir = path.join(root, "profiles");
  const merged = mergeProfiles(profilesDir, profileNames);

  const allRules = [...merged.rules.universal, ...merged.rules.gamedev];
  const sourceHashes = computeSourceHashes(root, merged.skills, allRules, merged.agents);
  const claudeDir = path.join(target, ".claude");
  const installedHashes = computeContentHashes(claudeDir);

  const items = computeUpdatePlan(
    manifest.content_hashes ?? null,
    installedHashes,
    sourceHashes,
  );

  const updates = items.filter((i) => i.action === "update" || i.action === "add" || i.action === "conflict");
  const skipped = items.filter((i) => i.action === "skip-customized" || i.action === "skip-unchanged");
  const removed = items.filter((i) => i.action === "remove");

  if (!opts.quiet) {
    printUpdateSummary(items, opts.dryRun ?? false);
  }

  if (updates.length === 0 && removed.length === 0) {
    if (!opts.quiet) {
      console.log(chalk.green("\nNo changes to apply."));
    }
    return {
      target,
      status: "no-changes",
      fromVersion: installedVersion,
      toVersion: currentVersion,
      updated: 0,
      skipped: skipped.length,
      removed: 0,
    };
  }

  if (opts.dryRun) {
    return {
      target,
      status: "dry-run",
      fromVersion: installedVersion,
      toVersion: currentVersion,
      updated: updates.length,
      skipped: skipped.length,
      removed: removed.length,
    };
  }

  applyUpdates(items, root, claudeDir, merged, opts.force ?? false);

  const newHashes = computeContentHashes(claudeDir);
  updateManifestFields(target, {
    arcane_version: currentVersion,
    source_version: currentVersion,
    updated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    content_hashes: newHashes,
    installed_skills: merged.skills,
    installed_rules: allRules,
    installed_agents: merged.agents,
    total_skills: merged.skills.length,
    total_rules: allRules.length,
  });

  if (!opts.quiet) {
    console.log(chalk.green(`\nUpdated to v${currentVersion}.`));
    console.log(`  ${updates.length} updated, ${skipped.length} skipped, ${removed.length} removed`);
  }

  return {
    target,
    status: "updated",
    fromVersion: installedVersion,
    toVersion: currentVersion,
    updated: updates.length,
    skipped: skipped.length,
    removed: removed.length,
  };
}

function printGeneralSummary(results: UpdateResult[], isDryRun: boolean): void {
  const prefix = isDryRun ? chalk.yellow("[dry-run] ") : "";
  const updated = results.filter((r) => r.status === "updated" || r.status === "dry-run").length;
  const unchanged = results.filter((r) => r.status === "up-to-date" || r.status === "no-changes").length;

  console.log(chalk.bold(`\n${prefix}Done. ${results.length} installation${results.length === 1 ? "" : "s"} processed:`));
  console.log(`  ${chalk.green(updated)} ${isDryRun ? "would change" : "updated"}, ${chalk.dim(unchanged + " unchanged")}`);
}

function computeUpdatePlan(
  manifestHashes: ContentHashes | null,
  installedHashes: ContentHashes,
  sourceHashes: ContentHashes,
): UpdateItem[] {
  const items: UpdateItem[] = [];

  for (const contentType of ["skills", "rules", "agents", "hooks"] as const) {
    const itemType = contentType === "skills" ? "skill"
      : contentType === "rules" ? "rule"
      : contentType === "agents" ? "agent"
      : "hook";

    const manifest = manifestHashes?.[contentType] ?? {};
    const installed = installedHashes[contentType];
    const source = sourceHashes[contentType];

    const allKeys = new Set([
      ...Object.keys(manifest),
      ...Object.keys(installed),
      ...Object.keys(source),
    ]);

    for (const key of allKeys) {
      const mHash = manifest[key] ?? null;
      const iHash = installed[key] ?? null;
      const sHash = source[key] ?? null;

      const action = resolveAction(mHash, iHash, sHash);
      if (action) {
        items.push({ type: itemType, name: key, action });
      }
    }
  }

  return items;
}

function resolveAction(
  manifestHash: string | null,
  installedHash: string | null,
  sourceHash: string | null,
): UpdateAction | null {
  if (!sourceHash && !installedHash) return null;

  if (sourceHash && !installedHash) return "add";

  if (!sourceHash && installedHash) return "remove";

  if (!manifestHash) {
    if (installedHash === sourceHash) return "skip-unchanged";
    return "update";
  }

  if (manifestHash === installedHash && installedHash === sourceHash) return "skip-unchanged";
  if (manifestHash === installedHash && sourceHash !== installedHash) return "update";
  if (manifestHash !== installedHash && manifestHash === sourceHash) return "skip-customized";
  if (manifestHash !== installedHash && installedHash === sourceHash) return "skip-unchanged";

  return "conflict";
}

function printUpdateSummary(items: UpdateItem[], isDryRun: boolean): void {
  const prefix = isDryRun ? chalk.yellow("[dry-run] ") : "";

  const updates = items.filter((i) => i.action === "update");
  const adds = items.filter((i) => i.action === "add");
  const conflicts = items.filter((i) => i.action === "conflict");
  const customized = items.filter((i) => i.action === "skip-customized");
  const removed = items.filter((i) => i.action === "remove");

  if (updates.length > 0) {
    console.log(`\n${prefix}${chalk.cyan("Will update:")}`);
    for (const item of updates) {
      console.log(`  ${chalk.green("~")} ${item.type}: ${item.name}`);
    }
  }

  if (adds.length > 0) {
    console.log(`\n${prefix}${chalk.cyan("Will add:")}`);
    for (const item of adds) {
      console.log(`  ${chalk.green("+")} ${item.type}: ${item.name}`);
    }
  }

  if (removed.length > 0) {
    console.log(`\n${prefix}${chalk.cyan("Will remove:")}`);
    for (const item of removed) {
      console.log(`  ${chalk.red("-")} ${item.type}: ${item.name}`);
    }
  }

  if (conflicts.length > 0) {
    console.log(`\n${prefix}${chalk.yellow("Conflicts (will backup + update):")}`);
    for (const item of conflicts) {
      console.log(`  ${chalk.yellow("!")} ${item.type}: ${item.name}`);
    }
  }

  if (customized.length > 0) {
    console.log(`\n${prefix}${chalk.dim("Skipped (locally customized):")}`);
    for (const item of customized) {
      console.log(`  ${chalk.dim("  " + item.type + ": " + item.name)}`);
    }
  }
}

function applyUpdates(
  items: UpdateItem[],
  root: string,
  claudeDir: string,
  merged: ReturnType<typeof mergeProfiles>,
  force: boolean,
): void {
  for (const item of items) {
    if (item.action === "skip-unchanged" || item.action === "skip-customized") {
      if (item.action === "skip-customized" && force) {
        applyItem(item, root, claudeDir);
      }
      continue;
    }

    if (item.action === "conflict") {
      backupItem(item, claudeDir);
      applyItem(item, root, claudeDir);
      continue;
    }

    if (item.action === "update" || item.action === "add") {
      applyItem(item, root, claudeDir);
      continue;
    }

    if (item.action === "remove") {
      removeItem(item, claudeDir);
    }
  }
}

function applyItem(item: UpdateItem, root: string, claudeDir: string): void {
  const src = getSourcePath(item, root);
  const dst = getInstalledPath(item, claudeDir);

  if (!src || !fs.existsSync(src)) return;

  if (item.type === "skill" || item.type === "agent") {
    if (fs.existsSync(dst)) {
      fs.rmSync(dst, { recursive: true, force: true });
    }
    copyDirSync(src, dst);
  } else {
    const dir = path.dirname(dst);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dst);
  }
}

function backupItem(item: UpdateItem, claudeDir: string): void {
  const installed = getInstalledPath(item, claudeDir);
  if (!fs.existsSync(installed)) return;

  const backupPath = installed + ".bak";
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }
  fs.renameSync(installed, backupPath);
}

function removeItem(item: UpdateItem, claudeDir: string): void {
  const installed = getInstalledPath(item, claudeDir);
  if (fs.existsSync(installed)) {
    fs.rmSync(installed, { recursive: true, force: true });
  }
}

function getSourcePath(item: UpdateItem, root: string): string | null {
  switch (item.type) {
    case "skill":
      return path.join(root, "skills", item.name);
    case "rule": {
      const direct = path.join(root, "rules", item.name);
      if (fs.existsSync(direct)) return direct;
      return path.join(root, "rules", "gamedev", item.name);
    }
    case "agent":
      return path.join(root, "agents", item.name);
    case "hook":
      return path.join(root, "hooks", item.name);
    default:
      return null;
  }
}

function getInstalledPath(item: UpdateItem, claudeDir: string): string {
  switch (item.type) {
    case "skill":
      return path.join(claudeDir, "skills", item.name);
    case "rule":
      return path.join(claudeDir, "rules", item.name);
    case "agent":
      return path.join(claudeDir, "agents", item.name);
    case "hook":
      return path.join(claudeDir, "hooks", item.name);
  }
}
