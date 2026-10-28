import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Specs for hooks/guard.mjs: which commands and file edits it denies, asks about or lets through. */

type Decision = ["deny" | "ask" | null, string];
interface Guard {
  decide(payload: object): Decision;
  checkFile(file: string, root: string): Decision;
}

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "hooks", "guard.mjs");
const guard = (await import(pathToFileURL(HOOK).href)) as Guard;

const bash = (command: string) => guard.decide({ tool_name: "Bash", tool_input: { command } })[0];
const powershell = (command: string) => guard.decide({ tool_name: "PowerShell", tool_input: { command } })[0];

function expectAll(commands: string[], run: (c: string) => string | null, expected: string | null) {
  for (const command of commands) expect(run(command), command).toBe(expected);
}

describe("denied commands", () => {
  it("every force push form", () => {
    expectAll(["git push --force origin feat", "git push -f", "git push --force-with-lease",
      "git push origin +main", "git push -uf origin x"], bash, "deny");
  });

  it("bypassing git hooks", () => {
    expectAll(["git commit --no-verify -m x", "git commit -n -m x", "git push --no-verify",
      "git -c core.hooksPath=/dev/null commit -m x"], bash, "deny");
  });

  it("discarding work and privilege", () => {
    expectAll(["git reset --hard HEAD~1", "git clean -fdx", "sudo rm x", "chmod -R 777 ."], bash, "deny");
  });

  it("writing env files", () => {
    expect(bash("cat .env.example > .env")).toBe("deny");
    expect(bash("echo KEY=1 | tee .env.local")).toBe("deny");
    expect(bash("cp .env .env.example.bak && echo x > .env.example")).toBeNull();
    expectAll(["cp evil .env", "mv x .env.local", "cp .env.example .env"], bash, "deny");
    expect(powershell("Copy-Item x .env")).toBe("deny");
  });

  it("reading env files", () => {
    expectAll(["cat .env", "head -n 5 apps/api/.env.local", "grep KEY .env"], bash, "deny");
    expect(bash("cat .env.example")).toBeNull();
  });

  it("text inside an argument is not a command", () => {
    // validate-push.sh blocked this: it matched "git push --force ... master" as a substring.
    expect(bash('claude -p "explain git push --force origin master"')).toBeNull();
  });

  it("hidden behind chains and shells", () => {
    expectAll(["echo ok && git reset --hard", "true; sudo ls", 'bash -c "git push --force"',
      "FOO=1 command git clean -f", "echo $(git reset --hard)"], bash, "deny");
  });

  it("a comment does not hide the command on the next line", () => {
    // guard.py turned newlines into `;` first, so shlex read the comment to the end of
    // the whole command and never saw the force push.
    expect(bash("echo hi # note\ngit push --force")).toBe("deny");
    expect(bash("echo '# not a comment'; git reset --hard")).toBe("deny");
  });
});

describe("asked commands", () => {
  it("recursive force delete outside build output", () => {
    expectAll(["rm -rf src", "rm -fr ./lib", "rm -r -f data", "rm --recursive --force x",
      "rm -rf node_modules ../other", "rm -rf /tmp/x", "rm -rf C:/proj/node_modules", "rm -rf *"], bash, "ask");
  });

  it("deletes through cmd, find and xargs", () => {
    expectAll(["cmd /c rd /s /q src", "cmd //c rd //s //q src", "cmd /c del /s /q *.ts", "find . -delete",
      "find . -name '*.log' -exec rm -rf {} \\;", "ls | xargs rm -rf", "xargs -n 1 rm -rf < list"], bash, "ask");
    expect(powershell("cmd /c rd /s /q src")).toBe("ask");
    expectAll(["cmd /c rd /s /q node_modules", "cmd /c dir /s", "find . -name x -print", "xargs -n 1 echo"], bash, null);
  });

  it("build output is deleted freely", () => {
    expectAll(["rm -rf node_modules", "rm -rf node_modules dist .next", "rm -rf ./build/", "rm -r tmp"], bash, null);
  });

  it("git operations that lose work", () => {
    expectAll(["git checkout -- .", "git checkout .", "git restore .", "git stash drop", "git stash clear",
      "git branch -D feat", "git push origin --delete feat", "git push origin :feat", "git tag -d v1",
      "git filter-repo --path x"], bash, "ask");
  });

  it("safe git operations", () => {
    expectAll(["git status", "git push -u origin HEAD", "git checkout -b feat", "git checkout -- src/a.ts",
      "git restore --staged .", "git branch -d merged", "git stash", "git pull --rebase"], bash, null);
  });

  it("new dependencies", () => {
    expectAll(["npm i -D expresss", "npm install lodash", "pnpm add zod", "yarn add react", "pip install requests",
      "python -m pip install numpy", "uv add httpx", "go get github.com/x/y", "cargo add serde",
      "dotnet add package Serilog"], bash, "ask");
  });

  it("reinstalling from the lockfile", () => {
    expectAll(["npm install", "npm ci", "pnpm install", "yarn", "pip install -r requirements.txt",
      "pip install -e .", "go get ./...", "go mod tidy"], bash, null);
  });

  it("data loss", () => {
    expectAll(['psql -c "DROP TABLE users"', 'mysql -e "TRUNCATE orders"', 'psql -c "DELETE FROM users"',
      "redis-cli FLUSHALL", "npx prisma migrate reset", "supabase db reset", "dotnet ef database drop",
      "php artisan migrate:fresh", "docker compose down -v", "docker volume prune", "terraform destroy",
      "kubectl delete pod x", "helm uninstall api", "npm publish", "gh repo delete x",
      "gh api -X DELETE repos/a/b"], bash, "ask");
  });

  it("mentions are not actions", () => {
    expectAll(['git commit -m "docs: explain terraform destroy and DROP TABLE"',
      'psql -c "DELETE FROM users WHERE id = 1"', "docker compose down",
      'gh pr create --body "kubectl delete is dangerous"', "npm run build"], bash, null);
  });

  it("a heredoc commit message is data", () => {
    expect(bash("git commit -m \"$(cat <<'EOF'\nfeat: rm -rf the old cache\n\nsudo is not needed\nEOF\n)\"")).toBeNull();
  });
});

describe("PowerShell commands", () => {
  it("git rules apply", () => {
    expect(powershell("git add .; git push --force origin main")).toBe("deny");
    expect(powershell("git reset --hard HEAD~1")).toBe("deny");
    expect(powershell("npm install left-pad")).toBe("ask");
    expect(powershell("npm test")).toBeNull();
  });

  it("recursive Remove-Item asks outside build output", () => {
    expectAll(["Remove-Item -Recurse -Force src", "rm -r -fo src", "ri -Recurse C:\\Users\\me\\node_modules"],
      powershell, "ask");
    expectAll(["Remove-Item -Recurse .\\node_modules", "Remove-Item -Recurse -Force .\\node_modules, .\\dist",
      "Remove-Item notes.txt"], powershell, null);
  });

  it("env files", () => {
    expect(powershell("Set-Content .env 'A=1'")).toBe("deny");
    expect(powershell("'A=1' | Out-File -FilePath .env")).toBe("deny");
    expect(powershell("Get-Content .env")).toBe("deny");
  });

  it("nested and quoted", () => {
    expect(powershell('pwsh -Command "git push --force"')).toBe("deny");
    expect(powershell("Invoke-Expression 'git reset --hard'")).toBe("deny");
    expect(powershell("git commit -m @'\nfix: never git push --force\n'@")).toBeNull();
    expect(powershell('Write-Host "a`nb"')).toBeNull();
  });
});

describe("file edits", () => {
  let root: string;
  const edit = (rel: string) => guard.checkFile(path.join(root, rel), root)[0];

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-guard-"));
    for (const rel of ["package.json", "tsconfig.json", "db/migrations/001_init.sql", ".eslintrc.json"]) {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), "{}");
    }
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("env files are denied but examples are not", () => {
    expect(edit(".env")).toBe("deny");
    expect(edit("apps/api/.env.production")).toBe("deny");
    expect(edit(".env.example")).toBeNull();
  });

  it("CI and infra always ask", () => {
    expect(edit(".github/workflows/ci.yml")).toBe("ask");
    expect(edit("infra/main.tf")).toBe("ask");
    expect(edit("modules/vpc/vars.tfvars")).toBe("ask");
  });

  it("existing manifests, migrations and check configs ask", () => {
    for (const rel of ["package.json", "tsconfig.json", "db/migrations/001_init.sql", ".eslintrc.json"]) {
      expect(edit(rel), rel).toBe("ask");
    }
  });

  it("a new migration and ordinary code pass", () => {
    expect(edit("db/migrations/002_add_email.sql")).toBeNull();
    expect(edit("src/index.ts")).toBeNull();
  });

  it("worktree paths follow the same rules", () => {
    expect(edit(".claude/worktrees/feat/.github/workflows/ci.yml")).toBe("ask");
  });

  it("files outside the project are ignored", () => {
    expect(guard.checkFile(path.join(os.tmpdir(), ".env"), root)[0]).toBeNull();
  });
});

describe("hook protocol", () => {
  const run = (payload: string, ...args: string[]) =>
    spawnSync(process.execPath, [HOOK, ...args], { input: payload, encoding: "utf-8" });

  it("reports the decision as PreToolUse JSON", () => {
    const out = JSON.parse(run(JSON.stringify({ tool_name: "Bash", tool_input: { command: "rm -rf src" } })).stdout);
    expect(out.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(out.hookSpecificOutput.permissionDecision).toBe("ask");
    expect(out.hookSpecificOutput.permissionDecisionReason).toContain("src");
  });

  it("prints nothing for an allowed command", () => {
    expect(run(JSON.stringify({ tool_name: "Bash", tool_input: { command: "ls" } })).stdout).toBe("");
  });

  it("command mode prints the command", () => {
    const command = 'git commit -m "quote \\" inside"';
    const out = run(JSON.stringify({ tool_name: "Bash", tool_input: { command } }), "--command").stdout;
    expect(out.trim()).toBe(command);
  });

  it("malformed input never fails the tool call", () => {
    const result = run("not json");
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
  });
});
