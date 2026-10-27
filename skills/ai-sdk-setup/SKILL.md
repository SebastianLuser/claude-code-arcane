---
name: ai-sdk-setup
description: "Integrate AI features into Next.js with the Vercel AI SDK: chat streaming, tool calling, structured output, agents and RAG. Defaults to Claude models. Use when adding chat, generation or agents to a Next/Node app."
category: "ai"
argument-hint: "[chat|stream|tools|structured|agent|rag]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# ai-sdk-setup — Vercel AI SDK with Claude

## MANDATORY WORKFLOW

> **Before coding LLM features, read the `claude-api` skill** for current model IDs, params and pricing. Do not assume from memory.

### Step 0: Gather Requirements
1. **Case:** chat / one-shot generation / structured extraction / agent with tools / RAG
2. **Streaming** to the client or a complete response
3. **Model:** Opus 5.5 (`claude-opus-5-5`, reasoning) / Sonnet 5.5 (`claude-sonnet-5-5`, balance) / Haiku 5.5 (`claude-haiku-5-5`, fast/cheap)
4. Does it need tool calling / structured output / RAG (see the `pgvector-search` skill)?

### Step 1: Install
```bash
pnpm add ai @ai-sdk/anthropic zod
# env: ANTHROPIC_API_KEY (validate with Zod in src/lib/env.ts, never hardcode)
```

### Step 2: Chat with streaming (Route Handler)
```ts
// app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: anthropic('claude-sonnet-5-5'),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```
Client: `useChat()` from `@ai-sdk/react`.

### Step 3: Structured output (Zod)
```ts
const { object } = await generateObject({
  model: anthropic('claude-sonnet-5-5'),
  schema: z.object({ sentiment: z.enum(['pos','neg','neutral']), score: z.number() }),
  prompt: text,
});
```

### Step 4: Tool calling / agent
```ts
const result = await generateText({
  model: anthropic('claude-opus-5-5'),
  tools: {
    search: tool({
      description: 'Search docs', inputSchema: z.object({ q: z.string() }),
      execute: async ({ q }) => searchDocs(q),
    }),
  },
  stopWhen: stepCountIs(5),   // controlled multi-step loop
  prompt,
});
```

### Step 5: Good practices
- Keep the API key **server-only** — never expose it to the client
- Auth in the route handler (like any API route — see the `nextjs-code` rule)
- Rate limiting on AI endpoints (cost $)
- Prompt caching for large system prompts (see the `claude-api` skill)
- Handle stream errors and aborts (`AbortController`)
- Validate/parse all structured output with Zod before using it

## Wrap-up

Test the endpoint with real streaming, verify error/abort handling and that the API key never reaches the client. Working endpoint + server-only key → integration **READY**. Confirm the approach with the user before writing code. Next step: the `claude-api` skill for model/caching tuning, or `pgvector-search` for RAG.

---

_Inspired by the AI SDK skills in [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adapted to the Arcane format and to Claude models. Verify the API/SDK against the `claude-api` skill._
