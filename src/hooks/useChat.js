import { useState, useEffect, useRef } from "react";
import { sendMessage } from "../lib/openai"; // <-- only change from Anthropic version
import { parseGuardrail } from "../lib/guardrails";
import { CARE_NAVIGATOR_PROMPT } from "../prompts/careNavigator";

/**
 * useChat hook
 *
 * Identical logic to the Anthropic version — the only difference is the
 * import above. This is intentional: keeping provider logic in lib/ means
 * hooks, components, and prompts never need to change when you swap models.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const historyRef = useRef([]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const raw = await sendMessage([], CARE_NAVIGATOR_PROMPT);
        const { urgency, text } = parseGuardrail(raw);
        historyRef.current = [{ role: "assistant", content: raw }];
        setMessages([{ id: 1, role: "assistant", text, urgency }]);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  async function submitMessage(userText) {
    if (!userText.trim() || isLoading) return;

    const userMsg = { id: Date.now(), role: "user", text: userText, urgency: null };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: userText },
    ];

    try {
      const raw = await sendMessage(historyRef.current, CARE_NAVIGATOR_PROMPT);
      const { urgency, text } = parseGuardrail(raw);

      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: raw },
      ];

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text, urgency },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, isLoading, error, submitMessage };
}
