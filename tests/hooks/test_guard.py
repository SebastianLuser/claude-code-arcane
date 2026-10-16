"""Specs for hooks/guard.py: which commands and file edits it denies, asks about or lets through."""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HOOK = Path(__file__).resolve().parents[2] / "hooks" / "guard.py"
spec = importlib.util.spec_from_file_location("guard", HOOK)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


def bash(command: str) -> str | None:
    return guard.decide({"tool_name": "Bash", "tool_input": {"command": command}})[0]


class DeniedCommands(unittest.TestCase):
    def test_every_force_push_form(self):
        for command in (
            "git push --force origin feat",
            "git push -f",
            "git push --force-with-lease",
            "git push origin +main",
            "git push -uf origin x",
        ):
            self.assertEqual(bash(command), "deny", command)

    def test_bypassing_git_hooks(self):
        for command in (
            "git commit --no-verify -m x",
            "git commit -n -m x",
            "git push --no-verify",
            "git -c core.hooksPath=/dev/null commit -m x",
        ):
            self.assertEqual(bash(command), "deny", command)

    def test_discarding_work_and_privilege(self):
        for command in ("git reset --hard HEAD~1", "git clean -fdx", "sudo rm x", "chmod -R 777 ."):
            self.assertEqual(bash(command), "deny", command)

    def test_writing_env_files(self):
        self.assertEqual(bash("cat .env.example > .env"), "deny")
        self.assertEqual(bash("echo KEY=1 | tee .env.local"), "deny")
        self.assertIsNone(bash("cp .env .env.example.bak && echo x > .env.example"))

    def test_reading_env_files(self):
        for command in ("cat .env", "head -n 5 apps/api/.env.local", "grep KEY .env"):
            self.assertEqual(bash(command), "deny", command)
        self.assertIsNone(bash("cat .env.example"))

    def test_text_inside_an_argument_is_not_a_command(self):
        # validate-push.sh blocked this: it matched "git push --force ... master" as a substring.
        self.assertIsNone(bash('claude -p "explain git push --force origin master"'))

    def test_hidden_behind_chains_and_shells(self):
        for command in (
            "echo ok && git reset --hard",
            "true; sudo ls",
            'bash -c "git push --force"',
            "FOO=1 command git clean -f",
            "echo $(git reset --hard)",
        ):
            self.assertEqual(bash(command), "deny", command)


class AskedCommands(unittest.TestCase):
    def test_recursive_force_delete_outside_build_output(self):
        for command in ("rm -rf src", "rm -fr ./lib", "rm -r -f data", "rm --recursive --force x",
                        "rm -rf node_modules ../other", "rm -rf /tmp/x", "rm -rf C:/proj/node_modules", "rm -rf *"):
            self.assertEqual(bash(command), "ask", command)

    def test_build_output_is_deleted_freely(self):
        for command in ("rm -rf node_modules", "rm -rf node_modules dist .next", "rm -rf ./build/", "rm -r tmp"):
            self.assertIsNone(bash(command), command)

    def test_git_operations_that_lose_work(self):
        for command in ("git checkout -- .", "git checkout .", "git restore .", "git stash drop",
                        "git stash clear", "git branch -D feat", "git push origin --delete feat",
                        "git push origin :feat", "git tag -d v1", "git filter-repo --path x"):
            self.assertEqual(bash(command), "ask", command)

    def test_safe_git_operations(self):
        for command in ("git status", "git push -u origin HEAD", "git checkout -b feat",
                        "git checkout -- src/a.ts", "git restore --staged .", "git branch -d merged",
                        "git stash", "git pull --rebase"):
            self.assertIsNone(bash(command), command)

    def test_new_dependencies(self):
        for command in ("npm i -D expresss", "npm install lodash", "pnpm add zod", "yarn add react",
                        "pip install requests", "python -m pip install numpy", "uv add httpx",
                        "go get github.com/x/y", "cargo add serde", "dotnet add package Serilog"):
            self.assertEqual(bash(command), "ask", command)

    def test_reinstalling_from_the_lockfile(self):
        for command in ("npm install", "npm ci", "pnpm install", "yarn", "pip install -r requirements.txt",
                        "pip install -e .", "go get ./...", "go mod tidy"):
            self.assertIsNone(bash(command), command)

    def test_data_loss(self):
        for command in ('psql -c "DROP TABLE users"', 'mysql -e "TRUNCATE orders"',
                        'psql -c "DELETE FROM users"', "redis-cli FLUSHALL", "npx prisma migrate reset",
                        "supabase db reset", "dotnet ef database drop", "php artisan migrate:fresh",
                        "docker compose down -v", "docker volume prune", "terraform destroy",
                        "kubectl delete pod x", "helm uninstall api", "npm publish", "gh repo delete x",
                        "gh api -X DELETE repos/a/b"):
            self.assertEqual(bash(command), "ask", command)

    def test_mentions_are_not_actions(self):
        for command in ('git commit -m "docs: explain terraform destroy and DROP TABLE"',
                        'psql -c "DELETE FROM users WHERE id = 1"', "docker compose down",
                        'gh pr create --body "kubectl delete is dangerous"', "npm run build"):
            self.assertIsNone(bash(command), command)

    def test_heredoc_commit_message_is_data(self):
        command = 'git commit -m "$(cat <<\'EOF\'\nfeat: rm -rf the old cache\n\nsudo is not needed\nEOF\n)"'
        self.assertIsNone(bash(command))


class FileEdits(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        for rel in ("package.json", "tsconfig.json", "db/migrations/001_init.sql", ".eslintrc.json"):
            path = Path(self.root, rel)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("{}")

    def edit(self, rel: str) -> str | None:
        return guard.check_file(os.path.join(self.root, rel), self.root)[0]

    def test_env_files_are_denied_but_examples_are_not(self):
        self.assertEqual(self.edit(".env"), "deny")
        self.assertEqual(self.edit("apps/api/.env.production"), "deny")
        self.assertIsNone(self.edit(".env.example"))

    def test_ci_and_infra_always_ask(self):
        self.assertEqual(self.edit(".github/workflows/ci.yml"), "ask")
        self.assertEqual(self.edit("infra/main.tf"), "ask")
        self.assertEqual(self.edit("modules/vpc/vars.tfvars"), "ask")

    def test_existing_manifests_migrations_and_check_configs_ask(self):
        for rel in ("package.json", "tsconfig.json", "db/migrations/001_init.sql", ".eslintrc.json"):
            self.assertEqual(self.edit(rel), "ask", rel)

    def test_new_migration_and_ordinary_code_pass(self):
        self.assertIsNone(self.edit("db/migrations/002_add_email.sql"))
        self.assertIsNone(self.edit("src/index.ts"))

    def test_worktree_paths_follow_the_same_rules(self):
        self.assertEqual(self.edit(".claude/worktrees/feat/.github/workflows/ci.yml"), "ask")

    def test_files_outside_the_project_are_ignored(self):
        self.assertIsNone(guard.check_file(os.path.join(tempfile.gettempdir(), ".env"), self.root)[0])


class HookProtocol(unittest.TestCase):
    def run_hook(self, payload: dict, *args: str) -> str:
        result = subprocess.run(
            [sys.executable, str(HOOK), *args], input=json.dumps(payload),
            capture_output=True, text=True, check=True,
        )
        return result.stdout

    def test_decision_is_reported_as_pretooluse_json(self):
        out = json.loads(self.run_hook({"tool_name": "Bash", "tool_input": {"command": "rm -rf src"}}))
        self.assertEqual(out["hookSpecificOutput"]["hookEventName"], "PreToolUse")
        self.assertEqual(out["hookSpecificOutput"]["permissionDecision"], "ask")
        self.assertIn("src", out["hookSpecificOutput"]["permissionDecisionReason"])

    def test_allowed_commands_print_nothing(self):
        self.assertEqual(self.run_hook({"tool_name": "Bash", "tool_input": {"command": "ls"}}), "")

    def test_command_mode_prints_the_command(self):
        command = 'git commit -m "quote \\" inside"'
        out = self.run_hook({"tool_name": "Bash", "tool_input": {"command": command}}, "--command")
        self.assertEqual(out.strip(), command)

    def test_malformed_input_never_fails_the_tool_call(self):
        result = subprocess.run([sys.executable, str(HOOK)], input="not json", capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
