export interface ProfileDefinition {
  name: string;
  description: string;
  type: "base" | "addon";
  skills: string[];
  rules: {
    universal: string[];
    gamedev: string[];
  };
  agents: string[];
  hooks: string[];
  permissions: {
    allow: string[];
    deny: string[];
  };
}

export interface MergedProfile {
  loaded: string[];
  skills: string[];
  rules: { universal: string[]; gamedev: string[] };
  agents: string[];
  hooks: string[];
  permissions: { allow: string[]; deny: string[] };
}

export interface ArcaneManifest {
  arcane_version: string;
  cli: "npm";
  profile_command: string;
  profiles: string[];
  installed_at: string;
  total_skills: number;
  total_rules: number;
  installed_skills: string[];
  installed_rules: string[];
  installed_agents: string[];
  source: string;
}

export interface InstallerOptions {
  target: string;
  dryRun: boolean;
  force: boolean;
}
