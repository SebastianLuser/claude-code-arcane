---
created: {{date:YYYY-MM-DD}}
type: codebases
---

# Codebases

The vault's bridge to code. Hub and project notes declare `repos:` in their frontmatter; this table says what each repo is and where it lives on this machine.

**The vault points, it does not copy.** No architecture goes here, no folder structure, no module explanations: that lives in the repo and goes stale the day someone merges. Only what the repo cannot tell you goes here: where it is locally, how it runs, and what is going to bite you.

| Repo | Local path | Branch | How to run | Graph | Notes |
|---|---|---|---|---|---|
| `<repo>` | `~/code/<repo>` | `main` | `npm run dev` | `graphify` | `<one-line gotcha>` |

## Before exploring a repo, query its graph

If the repo has a queryable code graph, **that is the first stop, not a subagent exploring**. An architecture survey with subagents costs on the order of 100k tokens and minutes; a graph query costs one or two thousand and is instant.

```bash
graphify query "what connects X to Y" --budget 2000
graphify explain "<Symbol>"
```

And if the repo has a curated architecture layer (for example `exploration/ARCHITECTURE.md`), read it after the graph: that is where the decisions and gotchas an AST cannot see live. If your change invalidates something it documents, updating it is part of the change.

## What goes in the vault and what goes in the repo

| Question | Answered by |
|---|---|
| What does this do and for whom? | The vault: the topic's hub |
| Why is it built this way? | The vault: the decision, in an atomic note |
| Which files do I touch? | The repo: the graph |
| What breaks if I change this? | The repo: the graph |
| How do I run it and what is going to blow up on me? | This table |

If you find yourself copying architecture into the vault, the question you were answering belonged to the repo.
