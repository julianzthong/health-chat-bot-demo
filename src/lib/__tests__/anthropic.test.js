import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * anthropic.test.js
 *
 * We don't want to make real API calls in tests — that costs money and is slow.
 * Instead we mock the global fetch and assert that:
 *  - The request is built correctly (right URL, headers, body shape)
 *  - The response is parsed correctly
 *  - Errors are handled and thrown cleanly
 */

// Mock import.meta.env before importing the module
vi.stubEnv("VITE_ANTHROPIC_API_KEY", "test-anthropic-key");

// Dynamically import after env is stubbed
const { sendMessage } = await import("../anthropic.js");

const MOCK_SYSTEM_PROMPT = "You are a care navigator.";
const MOCK_MESSAGES = [{ role: "user", content: "I feel fine." }];
const MOCK_REPLY = "[SAFE] Glad to hear you are feeling well.";

function mockFetchSuccess(reply = MOCK_REPLY) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      content: [{ text: reply }],
    }),
  });
}

function mockFetchError(message = "Invalid API key") {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: { message } }),
  });
}

describe("Anthropic sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Request shape ---

  it("calls the correct Anthropic API URL", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
  });

  it("sends POST method", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.method).toBe("POST");
  });

  it("includes the API key in the x-api-key header", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const headers = options.headers;
    expect(headers["x-api-key"]).toBe("test-anthropic-key");
  });

  it("includes the anthropic-version header", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers["anthropic-version"]).toBe("2023-06-01");
  });

  it("sends the system prompt as a top-level field (not in messages array)", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.system).toBe(MOCK_SYSTEM_PROMPT);
    expect(body.messages.find((m) => m.role === "system")).toBeUndefined();
  });

  it("sends the conversation messages in the body", async () => {
    mockFetchSuccess();
    await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages).toEqual(MOCK_MESSAGES);
  });

  // --- Response parsing ---

  it("returns the text from data.content[0].text", async () => {
    mockFetchSuccess(MOCK_REPLY);
    const result = await sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT);
    expect(result).toBe(MOCK_REPLY);
  });

  it("handles an empty message history (initial greeting call)", async () => {
    mockFetchSuccess();
    await sendMessage([], MOCK_SYSTEM_PROMPT);
    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.messages).toEqual([]);
  });

  // --- Error handling ---

  it("throws an error when the API returns a non-ok response", async () => {
    mockFetchError("Invalid API key");
    await expect(sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT)).rejects.toThrow(
      "Invalid API key"
    );
  });

  it("throws a fallback error message when error body has no message field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    await expect(sendMessage(MOCK_MESSAGES, MOCK_SYSTEM_PROMPT)).rejects.toThrow(
      "API request failed"
    );
  });
});
