import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * ollama.test.js
 *
 * Same pattern as the other clients — mock fetch, assert request shape,
 * assert response parsing, assert error handling.
 *
 * Key differences from Anthropic/OpenAI to verify:
 *  - No API key or auth header at all
 *  - Hits localhost:11434 instead of a remote API
 *  - System prompt goes in messages array as { role: "system" }
 *  - Response text is at data.message.content (not data.choices[0]... or data.content[0]...)
 *  - Request body includes stream: false
 */

const { sendMessage } = await import("../ollama.js");

const MOCK_SYSTEM_PROMPT = "You are a care navigator.";
const MOCK_MESSAGES = [{ role: "user", content: "I feel fine." }];
const MOCK_REPLY = "[SAFE] Glad to hear you are feeling well.";

function mockFetchSuccess(reply = MOCK_REPLY) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      message: { content: reply },
    }),
  });
}

function mockFetchError(statusText = "Connection refused") {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    text: async () => "",
    statusText,
  });
}

describe("Ollama sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Request shape ---

  it("calls the correct local Ollama URL", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe("http://localhost:11434/api/chat");
  });

  it("sends POST method", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe("POST");
  });

  it("does NOT send any Authorization or API key header", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
    expect(options.headers["x-api-key"]).toBeUndefined();
  });

  it("sets stream: false in the request body", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.stream).toBe(false);
  });

  it("injects system prompt as first message with role 'system'", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages[0]).toEqual({ role: "system", content: MOCK_SYSTEM_PROMPT });
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

  it("includes a model field in the request body", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.model).toBeDefined();
    expect(typeof body.model).toBe("string");
  });

  // --- Response parsing ---

  it("returns text from data.message.content", async () => {
    mockFetchSuccess(MOCK_REPLY);
    const result = await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    expect(result).toBe(MOCK_REPLY);
  });

  // --- Error handling ---

  it("throws an error when Ollama returns a non-ok response", async () => {
    mockFetchError("Connection refused");
    await expect(sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT)).rejects.toThrow(
      "Ollama error"
    );
  });

  it("includes the statusText in the error when body is empty", async () => {
    mockFetchError("Service Unavailable");
    await expect(sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT)).rejects.toThrow(
      "Service Unavailable"
    );
  });
});
