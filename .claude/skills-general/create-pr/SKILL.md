Create a pull request for the current branch:

1. Run `git status` and `git log` to understand all changes since branching from main/master
2. Run `git diff main...HEAD` (or the appropriate base branch) to see the full diff
3. Push the branch to origin if not already pushed
4. Create the PR using `gh pr create` with:
   - A concise title (under 70 chars)
   - A body with:
     ## Summary
     - Bullet points of what changed and why

     ## Test plan
     - How to verify the changes work

     🤖 Generated with [Claude Code](https://claude.com/claude-code)

Return the PR URL when done.
