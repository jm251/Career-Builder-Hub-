import OpenAI from "openai";

let client: OpenAI | null = null;
let clientCacheKey = "";

export type AIProvider = "fastrouter" | "openai";

function getAIConfig() {
  if (process.env.FASTROUTER_API_KEY) {
    return {
      provider: "fastrouter" as const,
      apiKey: process.env.FASTROUTER_API_KEY,
      baseURL: process.env.FASTROUTER_BASE_URL || "https://go.fastrouter.ai/api/v1",
      model: process.env.FASTROUTER_MODEL || process.env.OPENAI_MODEL || "openai/gpt-4.1",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai" as const,
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: undefined,
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
    };
  }

  return null;
}

export function getAIProvider(): AIProvider | null {
  return getAIConfig()?.provider ?? null;
}

export function getAIClient() {
  const config = getAIConfig();

  if (!config) {
    return null;
  }

  const nextCacheKey = JSON.stringify({
    provider: config.provider,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  if (!client || clientCacheKey !== nextCacheKey) {
    client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    });
    clientCacheKey = nextCacheKey;
  }

  return client;
}

export function getAIModel() {
  return getAIConfig()?.model || "gpt-5-mini";
}
