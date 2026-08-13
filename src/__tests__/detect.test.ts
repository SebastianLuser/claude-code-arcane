import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { detectStack } from "../detect.js";

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-detect-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function write(rel: string, content = ""): void {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function detected(): string[] {
  return detectStack(dir).map((d) => d.profile);
}

describe("detectStack", () => {
  it("returns nothing for an empty directory", () => {
    expect(detected()).toEqual([]);
  });

  it("detects Unity and suppresses the .NET suggestion for its csproj", () => {
    write("ProjectSettings/ProjectVersion.txt", "m_EditorVersion: 6000.0.1f1");
    write("Assembly-CSharp.csproj");
    expect(detected()).toEqual(["unity-dev"]);
  });

  it("detects Unreal via .uproject", () => {
    write("MyGame.uproject", "{}");
    expect(detected()).toEqual(["unreal-dev"]);
  });

  it("detects Flutter and suppresses native android/ios shells", () => {
    write("pubspec.yaml", "name: app");
    write("settings.gradle");
    write("app/build.gradle");
    write("Podfile");
    expect(detected()).toEqual(["flutter"]);
  });

  it("detects Go", () => {
    write("go.mod", "module example.com/app");
    expect(detected()).toEqual(["backend-go"]);
  });

  it("detects NestJS over generic TS", () => {
    write(
      "package.json",
      JSON.stringify({ dependencies: { "@nestjs/core": "^10.0.0", typescript: "^5" } }),
    );
    expect(detected()).toEqual(["backend-nestjs"]);
  });

  it("detects Next.js", () => {
    write("package.json", JSON.stringify({ dependencies: { next: "^15" } }));
    expect(detected()).toEqual(["backend-nextjs"]);
  });

  it("detects React Native and suppresses native android/ios shells", () => {
    write(
      "package.json",
      JSON.stringify({ dependencies: { "react-native": "0.76.0", react: "^18" } }),
    );
    write("settings.gradle");
    write("app/build.gradle");
    write("Podfile");
    expect(detected()).toEqual(["mobile"]);
  });

  it("detects frontend for plain React", () => {
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    expect(detected()).toEqual(["frontend"]);
  });

  it("detects backend-ts for server frameworks", () => {
    write("package.json", JSON.stringify({ dependencies: { fastify: "^5" } }));
    expect(detected()).toEqual(["backend-ts"]);
  });

  it("detects .NET via .sln outside Unity", () => {
    write("Api.sln");
    expect(detected()).toEqual(["backend-dotnet"]);
  });

  it("detects native Android via gradle + app dir", () => {
    write("settings.gradle.kts");
    write("app/build.gradle.kts");
    expect(detected()).toEqual(["android-native"]);
  });

  it("detects iOS via Podfile", () => {
    write("Podfile");
    expect(detected()).toEqual(["ios-native"]);
  });

  it("ignores malformed package.json", () => {
    write("package.json", "{not json");
    expect(detected()).toEqual([]);
  });

  it("can return multiple suggestions for a mixed repo", () => {
    write("go.mod", "module example.com/app");
    write("package.json", JSON.stringify({ dependencies: { react: "^18" } }));
    expect(detected()).toEqual(expect.arrayContaining(["backend-go", "frontend"]));
  });
});
