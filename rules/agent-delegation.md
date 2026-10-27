# Agent Delegation Rule

Applies to the main session and to every subagent it starts.

- **Your final message is the deliverable.** Never end a turn with "waiting for the subagents": a started task is not a finished one.
- **If you delegate, you collect.** Wait for every result, integrate it, then answer. No fire-and-forget.
- **One agent by default.** Split work only when it cannot fit one context, or when the second agent needs something the first must not have: different tools or permissions, a clean context (a reviewer that must not see the maker's reasoning), or a different model.
- **What a skill names may not be installed.** Skills point to `/skills` and agents from other profiles. Check `.claude/skills/<name>/` or `.claude/agents/` first; if it is missing, say which profile brings it and offer `/arcane-add <name>` instead of improvising it or handing the work to a general-purpose agent.
- **The prompt is all the subagent knows.** It does not see this conversation: pass the goal, the relevant files and the output format you expect.
