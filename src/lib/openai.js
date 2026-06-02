/**
 * OpenAI API client
 *
 * Drop-in replacement for anthropic.js — same function signature,
 * different wire format. This is the only file that needed to change
 * to switch providers, which is the point.
 *
 * NOTE: In production, API calls should go through your own backend
 * to keep the API key secret and enforce HIPAA-compliant logging.
 *
 * OpenAI vs Anthropic format differences:
 *  - System prompt goes inside the messages array as { role: "system" }
 *    rather than as a top-level `system` field
 *  - Response text is at data.choices[0].message.content
 *    rather than data.content[0].text
 *  - Model names differ (gpt-4o vs claude-sonnet-...)
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

/**
 * Send a conversation to GPT-4o and get a response.
 * @param {Array<{role: string, content: string}>} messages - Conversation history (no system msg)
 * @param {string} systemPrompt - Injected as the first message with role "system"
 * @returns {Promise<string>}
 */
export async function sendMessage(messages, systemPrompt) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}