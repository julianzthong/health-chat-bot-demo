import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * openai.test.js
 *
 * Same pattern as anthropic.test.js — mock fetch, assert request shape,
 * assert response parsing, assert error handling.
 *
 * Key differences from Anthropic to verify:
 *  - System prompt goes inside messages array as { role: "system" } (not top-level)
 *  - Auth header is Authorization: Bearer ... (not x-api-key)
 *  - Response text is at data.choices[0].message.content (not data.content[0].text)
 */

vi.stubEnv("VITE_OPENAI_API_KEY", "test-openai-key");

const { sendMessage } = await import("../openai.js");

const MOCK_SYSTEM_PROMPT = "You are a care navigator.";
const MOCK_MESSAGES = [{ role: "user", content: "I feel fine." }];
const MOCK_REPLY = "[SAFE] Glad to hear you are feeling well.";

function mockFetchSuccess(reply = MOCK_REPLY) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: reply } }],
    }),
  });
}

function mockFetchError(message = "Incorrect API key provided") {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: { message } }),
  });
}

describe("OpenAI sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Request shape ---

  it("calls the correct OpenAI API URL", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("sends POST method", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe("POST");
  });

  it("sends the API key as a Bearer token in the Authorization header", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer test-openai-key");
  });

  it("does NOT use x-api-key header (OpenAI uses Authorization instead)", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers["x-api-key"]).toBeUndefined();
  });

  it("injects system prompt as first message with role 'system'", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages[0]).toEqual({ role: "system", content: MOCK_SYSTEM_PROMPT });
  });

  it("does NOT send system prompt as a top-level field", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.system).toBeUndefined();
  });

  it("appends conversation messages after the system message", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages[1]).toEqual(MOCK_MESSAGES[0]);
  });

  it("sends only the system message when history is empty", async () => {
    mockFetchSuccess();
    await sendMessage([], MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("system");
  });

  // --- Response parsing ---

  it("returns text from data.choices[0].message.content", async () => {
    mockFetchSuccess(MOCK_REPLY);
    const result = await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    expect(result).toBe(MOCK_REPLY);
  });

  // --- Error handling ---

  it("throws an error when the API returns a non-ok response", async () => {
    mockFetchError("Incorrect API key provided");
    await expect(sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT)).rejects.toThrow(
      "Incorrect API key provided"
    );
  });

  it("throws a fallback error message when error body has no message field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    await expect(sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT)).rejects.toThrow(
      "OpenAI API request failed"
    );
  });
});
