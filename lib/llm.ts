import OpenAI from "openai";

/**
 * LLM client. Backed by OpenRouter, which is OpenAI-API compatible — so we
 * use the official `openai` SDK with a custom baseURL. This lets us swap
 * models (Llama, Claude, GPT, etc.) by changing only `LLM_MODEL` in env,
 * without touching any call site.
 */

let _client: OpenAI | null = null;

export function llm(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env.local. Get one at https://openrouter.ai/keys"
    );
  }
  _client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      // Optional but helps OpenRouter surface ClearStep on its public app
      // leaderboard and gives them a referrer for analytics.
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ?? "https://clearstep.local",
      "X-Title": process.env.OPENROUTER_APP_TITLE ?? "ClearStep",
    },
  });
  return _client;
}

/**
 * Default model. Same Llama-3.3-70b-instruct we used on Groq, just routed
 * via OpenRouter. Override with `LLM_MODEL` env var to use Claude/GPT/etc.
 */
export const LLM_MODEL =
  process.env.LLM_MODEL || "meta-llama/llama-3.3-70b-instruct";
