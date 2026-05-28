import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export function hashDirectory(dirPath: string): Record<string, string> {
  const hashes: Record<string, string> = {};
  walkDir(dirPath, dirPath, hashes);
  return hashes;
}

function walkDir(
  base: string,
  current: string,
  hashes: Record<string, string>,
): void {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);
    const relPath = path.relative(base, fullPath).split(path.sep).join("/");
    if (entry.isDirectory()) {
      walkDir(base, fullPath, hashes);
    } else {
      hashes[relPath] = hashFile(fullPath);
    }
  }
}

export interface HashComparison {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}

export function compareHashes(
  installed: Record<string, string>,
  source: Record<string, string>,
): HashComparison {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  for (const key of Object.keys(source)) {
    if (!(key in installed)) {
      added.push(key);
    } else if (installed[key] !== source[key]) {
      changed.push(key);
    } else {
      unchanged.push(key);
    }
  }

  for (const key of Object.keys(installed)) {
    if (!(key in source)) {
      removed.push(key);
    }
  }

  return { added, removed, changed, unchanged };
}

export interface ContentHashes {
  skills: Record<string, string>;
  rules: Record<string, string>;
  agents: Record<string, string>;
  hooks: Record<string, string>;
}

export function computeContentHashes(claudeDir: string): ContentHashes {
  const hashes: ContentHashes = {
    skills: {},
    rules: {},
    agents: {},
    hooks: {},
  };

  const skillsDir = path.join(claudeDir, "skills");
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const dirHash = hashDirectory(path.join(skillsDir, entry.name));
        const combined = createHash("sha256")
          .update(JSON.stringify(dirHash))
          .digest("hex");
        hashes.skills[entry.name] = combined;
      }
    }
  }

  const rulesDir = path.join(claudeDir, "rules");
  if (fs.existsSync(rulesDir)) {
    for (const entry of fs.readdirSync(rulesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        hashes.rules[entry.name] = hashFile(path.join(rulesDir, entry.name));
      }
    }
  }

  const agentsDir = path.join(claudeDir, "agents");
  if (fs.existsSync(agentsDir)) {
    for (const entry of fs.readdirSync(agentsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const dirHash = hashDirectory(path.join(agentsDir, entry.name));
        const combined = createHash("sha256")
          .update(JSON.stringify(dirHash))
          .digest("hex");
        hashes.agents[entry.name] = combined;
      }
    }
  }

  const hooksDir = path.join(claudeDir, "hooks");
  if (fs.existsSync(hooksDir)) {
    for (const entry of fs.readdirSync(hooksDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        hashes.hooks[entry.name] = hashFile(path.join(hooksDir, entry.name));
      }
    }
  }

  return hashes;
}

export function computeSourceHashes(
  packageRoot: string,
  skills: string[],
  rules: string[],
  agents: string[],
): ContentHashes {
  const hashes: ContentHashes = {
    skills: {},
    rules: {},
    agents: {},
    hooks: {},
  };

  for (const skill of skills) {
    const skillDir = path.join(packageRoot, "skills", skill);
    if (fs.existsSync(skillDir)) {
      const dirHash = hashDirectory(skillDir);
      const combined = createHash("sha256")
        .update(JSON.stringify(dirHash))
        .digest("hex");
      hashes.skills[skill] = combined;
    }
  }

  for (const rule of rules) {
    const ruleName = rule.endsWith(".md") ? rule : `${rule}.md`;
    const rulePath = path.join(packageRoot, "rules", ruleName);
    if (fs.existsSync(rulePath)) {
      hashes.rules[ruleName] = hashFile(rulePath);
    } else {
      const gamedevPath = path.join(packageRoot, "rules", "gamedev", ruleName);
      if (fs.existsSync(gamedevPath)) {
        hashes.rules[ruleName] = hashFile(gamedevPath);
      }
    }
  }

  for (const agent of agents) {
    const agentDir = path.join(packageRoot, "agents", agent);
    if (fs.existsSync(agentDir)) {
      const dirHash = hashDirectory(agentDir);
      const combined = createHash("sha256")
        .update(JSON.stringify(dirHash))
        .digest("hex");
      hashes.agents[agent] = combined;
    }
  }

  const hooksDir = path.join(packageRoot, "hooks");
  if (fs.existsSync(hooksDir)) {
    for (const entry of fs.readdirSync(hooksDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        hashes.hooks[entry.name] = hashFile(path.join(hooksDir, entry.name));
      }
    }
  }

  return hashes;
}
