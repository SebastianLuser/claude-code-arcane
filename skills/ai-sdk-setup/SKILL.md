---
name: ai-sdk-setup
description: "Integrar features de IA en Next.js con el Vercel AI SDK: streaming de chat, tool calling, structured output, agents y RAG. Default a modelos Claude. Usar al agregar chat, generación o agentes a una app Next/Node."
category: "ai"
argument-hint: "[chat|stream|tools|structured|agent|rag]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Task
---
# ai-sdk-setup — Vercel AI SDK con Claude

## MANDATORY WORKFLOW

> **Antes de codear features LLM, leer la skill `claude-api`** para model IDs vigentes, params y pricing. No asumir de memoria.

### Step 0: Gather Requirements
1. **Caso:** chat / generación one-shot / extracción structured / agente con tools / RAG
2. **Streaming** al cliente o respuesta completa
3. **Modelo:** Opus 4.8 (`claude-opus-4-8`, razonamiento) / Sonnet 4.6 (`claude-sonnet-4-6`, balance) / Haiku 4.5 (`claude-haiku-4-5-20251001`, rápido/barato)
4. ¿Necesita tool calling / structured output / RAG (ver skill `pgvector-search`)?

### Step 1: Instalar
```bash
pnpm add ai @ai-sdk/anthropic zod
# env: ANTHROPIC_API_KEY (validar con Zod en src/lib/env.ts, nunca hardcodear)
```

### Step 2: Chat con streaming (Route Handler)
```ts
// app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```
Cliente: `useChat()` de `@ai-sdk/react`.

### Step 3: Structured output (Zod)
```ts
const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-6'),
  schema: z.object({ sentiment: z.enum(['pos','neg','neutral']), score: z.number() }),
  prompt: text,
});
```

### Step 4: Tool calling / agente
```ts
const result = await generateText({
  model: anthropic('claude-opus-4-8'),
  tools: {
    search: tool({
      description: 'Buscar docs', inputSchema: z.object({ q: z.string() }),
      execute: async ({ q }) => searchDocs(q),
    }),
  },
  stopWhen: stepCountIs(5),   // loop multi-step controlado
  prompt,
});
```

### Step 5: Buenas prácticas
- **Server-only** la API key — nunca exponer al cliente
- Auth en el route handler (como cualquier API route — ver rule `nextjs-code`)
- Rate limiting en endpoints de IA (costo $)
- Prompt caching para system prompts grandes (ver skill `claude-api`)
- Manejar errores de stream y abort (`AbortController`)
- Validar/parsear toda salida structured con Zod antes de usarla

## Cierre

Probar el endpoint con streaming real, verificar manejo de errores/abort y que la API key nunca llega al cliente. Endpoint funcionando + key server-only → integración **READY**. Confirmar el approach con el usuario antes de escribir código. Siguiente paso: skill `claude-api` para tuning de modelo/caching, o `pgvector-search` para RAG.

---

_Inspirado en las skills de AI SDK de [laguagu/claude-code-nextjs-skills](https://github.com/laguagu/claude-code-nextjs-skills). Adaptado al formato Arcane y a modelos Claude. Verificar API/SDK contra la skill `claude-api`._
