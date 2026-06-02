/**
 * Anthropic API client
 *
 * NOTE: In production, API calls should go through your own backend
 * to keep the API key secret and enforce HIPAA-compliant logging.
 * For this demo, we call the API directly from the browser.
 *
 * A Rails proxy endpoint would look like:
 *   POST /api/chat  ->  forwards to Anthropic, strips PHI, logs audit trail
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

/**
 * Send a conversation to Claude and get a response.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} systemPrompt
 * @returns {Promise<string>}
 */
export async function sendMessage(messages, systemPrompt) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "API request failed");
  }

  const data = await response.json();
  return data.content[0].text;
}
