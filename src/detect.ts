import fs from "node:fs";
import path from "node:path";

export interface StackDetection {
  profile: string;
  reason: string;
}

function hasFile(dir: string, rel: string): boolean {
  return fs.existsSync(path.join(dir, rel));
}

function topLevelMatch(dir: string, suffix: string): string | undefined {
  try {
    return fs.readdirSync(dir).find((f) => f.endsWith(suffix));
  } catch {
    return undefined;
  }
}

function readPackageDeps(dir: string): Record<string, string> {
  try {
    const raw = JSON.parse(
      fs.readFileSync(path.join(dir, "package.json"), "utf-8"),
    ) as Record<string, unknown>;
    return {
      ...((raw.dependencies as Record<string, string>) ?? {}),
      ...((raw.devDependencies as Record<string, string>) ?? {}),
    };
  } catch {
    return {};
  }
}

/**
 * Inspect a project directory for stack markers and suggest matching
 * profiles. Returns zero or more suggestions (a monorepo can hit several).
 * Only top-level markers are checked — this is a hint for the install
 * wizard, not a build-system-grade analysis.
 */
export function detectStack(dir: string): StackDetection[] {
  const out: StackDetection[] = [];

  const isUnity = hasFile(dir, "ProjectSettings/ProjectVersion.txt");
  if (isUnity) {
    out.push({ profile: "unity-dev", reason: "ProjectSettings/ProjectVersion.txt" });
  }

  const uproject = topLevelMatch(dir, ".uproject");
  if (uproject) {
    out.push({ profile: "unreal-dev", reason: uproject });
  }

  const isFlutter = hasFile(dir, "pubspec.yaml");
  if (isFlutter) {
    out.push({ profile: "flutter", reason: "pubspec.yaml" });
  }

  if (hasFile(dir, "go.mod")) {
    out.push({ profile: "backend-go", reason: "go.mod" });
  }

  let isReactNative = false;
  if (hasFile(dir, "package.json")) {
    const deps = readPackageDeps(dir);
    if (deps["@nestjs/core"]) {
      out.push({ profile: "backend-nestjs", reason: "package.json: @nestjs/core" });
    } else if (deps["next"]) {
      out.push({ profile: "backend-nextjs", reason: "package.json: next" });
    } else if (deps["react-native"] || deps["expo"]) {
      isReactNative = true;
      out.push({ profile: "mobile", reason: "package.json: react-native/expo" });
    } else if (deps["react"] || deps["vue"] || deps["svelte"]) {
      out.push({ profile: "frontend", reason: "package.json: react/vue/svelte" });
    } else if (deps["fastify"] || deps["express"] || deps["koa"] || deps["hono"]) {
      out.push({ profile: "backend-ts", reason: "package.json: server framework" });
    } else if (deps["typescript"]) {
      out.push({ profile: "backend-ts", reason: "package.json: typescript" });
    }
  }

  // Unity projects keep .sln/.csproj at the root; skip the .NET suggestion there.
  if (!isUnity) {
    const dotnet = topLevelMatch(dir, ".sln") ?? topLevelMatch(dir, ".csproj");
    if (dotnet) {
      out.push({ profile: "backend-dotnet", reason: dotnet });
    }
  }

  // Flutter/React Native repos carry android/ and ios/ shells; those are not
  // native projects.
  if (!isFlutter && !isReactNative) {
    if (
      (hasFile(dir, "settings.gradle") || hasFile(dir, "settings.gradle.kts")) &&
      hasFile(dir, "app")
    ) {
      out.push({ profile: "android-native", reason: "settings.gradle + app/" });
    }
    const ios =
      topLevelMatch(dir, ".xcodeproj") ??
      topLevelMatch(dir, ".xcworkspace") ??
      (hasFile(dir, "Podfile") ? "Podfile" : undefined);
    if (ios) {
      out.push({ profile: "ios-native", reason: ios });
    }
  }

  return out;
}
