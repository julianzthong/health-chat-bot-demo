/**
 * Guardrail layer
 *
 * Claude is instructed to prefix every response with [URGENT] or [SAFE].
 * This module parses that tag and strips it from the display text.
 *
 * In a real system you'd also:
 *  - Log every URGENT flag to a database with timestamp + conversation ID
 *  - Trigger a notification to an on-call care coordinator
 *  - Store a full audit trail for HIPAA compliance
 */

export const URGENCY = {
  URGENT: "URGENT",
  SAFE: "SAFE",
  UNKNOWN: "UNKNOWN",
};

/**
 * Parse a raw Claude response into structured output.
 * @param {string} rawText
 * @returns {{ urgency: string, text: string }}
 */
export function parseGuardrail(rawText) {
  if (rawText.startsWith("[URGENT]")) {
    return {
      urgency: URGENCY.URGENT,
      text: rawText.replace(/^\[URGENT\]\s*/, ""),
    };
  }

  if (rawText.startsWith("[SAFE]")) {
    return {
      urgency: URGENCY.SAFE,
      text: rawText.replace(/^\[SAFE\]\s*/, ""),
    };
  }

  // Fallback — Claude didn't follow the format (shouldn't happen often)
  return {
    urgency: URGENCY.UNKNOWN,
    text: rawText,
  };
}
