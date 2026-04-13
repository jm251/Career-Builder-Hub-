import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("AI provider configuration", () => {
  it("prefers FastRouter when a FastRouter key is configured", async () => {
    process.env.FASTROUTER_API_KEY = "fast-key";
    process.env.FASTROUTER_MODEL = "anthropic/claude-4.5-sonnet";
    process.env.OPENAI_API_KEY = "openai-key";

    const { getAIModel, getAIProvider } = await import("@/lib/ai");

    expect(getAIProvider()).toBe("fastrouter");
    expect(getAIModel()).toBe("anthropic/claude-4.5-sonnet");
  });

  it("falls back to OpenAI when FastRouter is not configured", async () => {
    delete process.env.FASTROUTER_API_KEY;
    delete process.env.FASTROUTER_MODEL;
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.OPENAI_MODEL = "gpt-5-mini";

    const { getAIModel, getAIProvider } = await import("@/lib/ai");

    expect(getAIProvider()).toBe("openai");
    expect(getAIModel()).toBe("gpt-5-mini");
  });
});
