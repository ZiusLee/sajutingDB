# AI Model Configuration (Updated for GPT-5)

This document defines how models are configured in the Saju Chat API and how to safely tune them without code changes.

Primary integration uses the AI SDK with `streamText` and `@ai-sdk/openai`, which provides streaming and unified model usage across providers [^1].

## What Changed

- Default model is now `gpt-5` for the main chat
- We added provider-specific options for reasoning effort and verbosity
- All key settings are controlled by environment variables

These changes follow the migration guidance you provided:
- Migrating from gpt-4.1 → Use gpt-5 with minimal or low reasoning as a strong alternative
- Start with minimal reasoning and low verbosity; increase reasoning or verbosity only if needed

## Server Location

- File: `app/api/saju-chat/route.ts`
- Calls: Two `streamText()` calls (main generation and "continue" generation)

## Environment Variables

You can configure the model and parameters without modifying code:

- MODEL_NAME
  - Default: `gpt-5`
  - Examples: `gpt-5`, `gpt-5-mini`, fallback like `gpt-4.1` if needed

- MODEL_REASONING_EFFORT
  - Default: `minimal`
  - Allowed: `minimal`, `low`, `medium`, `high`
  - Recommendation:
    - From gpt-4.1 → start with `minimal`, increase to `low` if needed

- MODEL_TEXT_VERBOSITY
  - Default: `low`
  - Allowed: `low`, `medium`, `high`
  - Lower verbosity helps concise outputs; increase for more verbose responses

- CONTINUE_MODEL_REASONING_EFFORT
  - Default: same as MODEL_REASONING_EFFORT
  - Used for "continue generation" flow, e.g., can keep lighter reasoning for speed

Example configuration:
- MODEL_NAME=gpt-5
- MODEL_REASONING_EFFORT=minimal
- MODEL_TEXT_VERBOSITY=low

## Code Behavior

The API uses:
\`\`\`ts
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

const result = await streamText({
  messages,
  model: openai(MODEL_NAME),
  temperature: 1.0,
  maxTokens: 2048,
  top_p: 1.0,
  providerOptions: {
    openai: {
      reasoning: { effort: MODEL_REASONING_EFFORT },
      text: { verbosity: MODEL_TEXT_VERBOSITY },
    },
  },
})
\`\`\`

- We continue to use `streamText` with the AI SDK for streaming responses [^1].
- We pass provider-specific options for reasoning effort and verbosity to align with GPT-5's Responses API style controls while retaining the SDK abstraction layer.

The "continue generation" flow uses the same model but allows a separate reasoning effort via `CONTINUE_MODEL_REASONING_EFFORT`.

## Tuning Guidance

1) Start Minimal
- MODEL_REASONING_EFFORT=minimal
- MODEL_TEXT_VERBOSITY=low

2) If you need deeper answers:
- Increase MODEL_REASONING_EFFORT from minimal → low → medium (stepwise)

3) If you want longer/more talkative outputs:
- Increase MODEL_TEXT_VERBOSITY from low → medium

4) If performance degrades or costs rise:
- Reduce reasoning effort or verbosity
- Try `gpt-5-mini` if your use-case tolerates lighter models

## Rollback Plan

If you encounter regressions:
- Set MODEL_NAME back to `gpt-4.1`
- Or reduce reasoning/verbosity
- No code changes required; only environment variables

## Notes

- The AI SDK’s `streamText` and `@ai-sdk/openai` are still the canonical integration and require no app-level API rewrites [^1].
- Embeddings and auxiliary services remain unchanged.
