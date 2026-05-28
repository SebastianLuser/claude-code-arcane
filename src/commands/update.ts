import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { readManifest, updateManifestFields } from "../manifest.js";
import { getPackageVersion, copyDirSync } from "../utils.js";
import { mergeProfiles } from "../profiles.js";
import {
  computeContentHashes,
  computeSourceHashes,
  type ContentHashes,
} from "../content-hash.js";
import { resolveContentSource, type SourcePreference } from "../content-source.js";

interface UpdateOpts {
  quiet?: boolean;
  dryRun?: boolean;
  force?: boolean;
  source?: SourcePreference;
}

type UpdateAction = "update" | "skip-customized" | "skip-unchanged" | "conflict" | "add" | "remove";

interface UpdateItem {
  type: "skill" | "rule" | "agent" | "hook";
  name: string;
  action: UpdateAction;
}

export async function updateCommand(opts: UpdateOpts): Promise<void> {
  const target = process.cwd();
  const manifest = readManifest(target);

  if (!manifest) {
    if (!opts.quiet) {
      console.log(chalk.red("No Arcane installation found. Run 'arcane install' first."));
    }
    return;
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
    return;
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
    return;
  }

  if (opts.dryRun) {
    return;
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
