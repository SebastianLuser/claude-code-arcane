#!/usr/bin/env node
/**
 * One-time migration script: convert .profile (bash) files to .yaml
 */
import fs from "node:fs";
import path from "node:path";

const PROFILES_DIR = path.resolve("profiles");

function parseBashArray(text, varName) {
  // First try single-line: VAR=(item1 item2) or VAR=()
  const singleLine = new RegExp(`^${varName}=\\(([^\\n]*?)\\)`, "m");
  const m1 = text.match(singleLine);
  if (m1) {
    // Check it's truly single-line (closing paren on same line)
    const inner = m1[1].trim();
    if (inner === "" || !inner.includes("\n")) {
      return parseArrayContent(inner);
    }
  }

  // Multiline: VAR=(\n  item1\n  item2\n)
  const multiLine = new RegExp(`^${varName}=\\(\\s*\\n([\\s\\S]*?)^\\)`, "m");
  const m2 = text.match(multiLine);
  if (m2) {
    return parseArrayContent(m2[1]);
  }

  return [];
}

function parseArrayContent(content) {
  if (!content || !content.trim()) return [];
  const items = [];
  const tokenRegex = /"([^"]*?)"|'([^']*?)'|(\S+)/g;
  let m;
  while ((m = tokenRegex.exec(content)) !== null) {
    const value = m[1] ?? m[2] ?? m[3];
    if (value && !value.startsWith("#")) {
      items.push(value);
    }
    if (m[3] && m[3].startsWith("#")) {
      const restOfLine = content.indexOf("\n", tokenRegex.lastIndex);
      if (restOfLine !== -1) tokenRegex.lastIndex = restOfLine;
    }
  }
  return items;
}

function parseHeader(text, key) {
  const regex = new RegExp(`^#\\s*${key}:\\s*(.+)$`, "m");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function parseDescription(text) {
  const match = text.match(/^DESCRIPTION=["'](.+?)["']/m);
  return match ? match[1] : "";
}

const files = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith(".profile"));

for (const file of files) {
  const name = path.basename(file, ".profile");
  const content = fs.readFileSync(path.join(PROFILES_DIR, file), "utf-8");

  const profileType = parseHeader(content, "Type") || "addon";
  const description = parseDescription(content) || parseHeader(content, "Description") || "";

  const skills = parseBashArray(content, "SKILLS");
  // Legacy support: merge SKILLS_GENERAL, SKILLS_GAMEDEV, SKILLS_SOFTWARE
  for (const legacy of ["SKILLS_GENERAL", "SKILLS_GAMEDEV", "SKILLS_SOFTWARE"]) {
    skills.push(...parseBashArray(content, legacy));
  }
  const uniqueSkills = [...new Set(skills)];

  const rulesUniversal = parseBashArray(content, "RULES_UNIVERSAL");
  const rulesGamedev = parseBashArray(content, "RULES_GAMEDEV");
  const agents = parseBashArray(content, "AGENTS");
  const hooks = parseBashArray(content, "HOOKS");
  const permAllow = parseBashArray(content, "PERMISSIONS_ALLOW");
  const permDeny = parseBashArray(content, "PERMISSIONS_DENY");

  // Build YAML manually for clean output
  let yaml = "";
  yaml += `name: ${name}\n`;
  yaml += `description: "${description.replace(/"/g, '\\"')}"\n`;
  yaml += `type: ${profileType}\n`;

  yaml += `\nskills:\n`;
  if (uniqueSkills.length === 0) {
    yaml += `  []\n`;
  } else {
    for (const s of uniqueSkills) yaml += `  - ${s}\n`;
  }

  yaml += `\nrules:\n`;
  yaml += `  universal:\n`;
  if (rulesUniversal.length === 0) yaml += `    []\n`;
  else for (const r of rulesUniversal) yaml += `    - ${r}\n`;
  yaml += `  gamedev:\n`;
  if (rulesGamedev.length === 0) yaml += `    []\n`;
  else for (const r of rulesGamedev) yaml += `    - ${r}\n`;

  yaml += `\nagents:\n`;
  if (agents.length === 0) yaml += `  []\n`;
  else for (const a of agents) yaml += `  - ${a}\n`;

  if (hooks.length > 0) {
    yaml += `\nhooks:\n`;
    for (const h of hooks) yaml += `  - ${h}\n`;
  }

  yaml += `\npermissions:\n`;
  yaml += `  allow:\n`;
  if (permAllow.length === 0) yaml += `    []\n`;
  else for (const p of permAllow) yaml += `    - "${p}"\n`;
  yaml += `  deny:\n`;
  if (permDeny.length === 0) yaml += `    []\n`;
  else for (const p of permDeny) yaml += `    - "${p}"\n`;

  const outPath = path.join(PROFILES_DIR, `${name}.yaml`);
  fs.writeFileSync(outPath, yaml, "utf-8");
  console.log(`  [ok] ${file} -> ${name}.yaml (${uniqueSkills.length} skills)`);
}

console.log(`\nConverted ${files.length} profiles.`);
