import { useState, useEffect, useRef } from "react";
import { sendMessage } from "../lib/anthropic";
import { parseGuardrail } from "../lib/guardrails";
import { CARE_NAVIGATOR_PROMPT } from "../prompts/careNavigator";

/**
 * useChat hook
 *
 * Manages conversation history, loading state, and error handling.
 * Keeps all API logic out of components so they stay clean and testable.
 *
 * @returns {{ messages, isLoading, error, submitMessage }}
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // conversation history in the format Anthropic expects
  const historyRef = useRef([]);

  // kick off the greeting from the bot on mount
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

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: userText,
      urgency: null,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // append user turn to history before calling API
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
