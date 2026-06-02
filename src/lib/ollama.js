/**
 * Ollama API client
 *
 * Ollama runs models locally on your machine — no API key, no cost.
 * It exposes a REST API at http://localhost:11434 by default.
 *
 * Ollama's /api/chat endpoint is OpenAI-compatible, meaning:
 *  - System prompt goes as the first message with role "system"
 *  - Response is at data.message.content
 *
 * To change the model, update MODEL below. Popular options:
 *  - "llama3.2"      (fast, good quality, ~2GB)
 *  - "llama3.1:8b"   (slightly larger, better reasoning)
 *  - "mistral"       (good at following instructions)
 *  - "gemma2"        (Google's open model, very capable)
 *
 * Run `ollama list` in your terminal to see what you have installed.
 *
 * CORS note: Ollama needs to allow requests from localhost:5173 (Vite dev server).
 * Set this env var before starting Ollama:
 *   Mac/Linux: OLLAMA_ORIGINS=http://localhost:5173 ollama serve
 *   Windows:   set OLLAMA_ORIGINS=http://localhost:5173 && ollama serve
 */

const OLLAMA_API_URL = "http://localhost:11434/api/chat";
const MODEL = "llama3.2"; // change this to any model you have pulled

/**
 * Send a conversation to a local Ollama model and get a response.
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} systemPrompt - Injected as the first message with role "system"
 * @returns {Promise<string>}
 */
export async function sendMessage(messages, systemPrompt) {
  const response = await fetch(OLLAMA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false, // set to true if you want streaming later
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error: ${text || response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
}
